import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/users";

export const dynamic = "force-dynamic";

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfNextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function startOfPreviousMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfNextDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1
  );
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);

  return result;
}

export async function GET(req: NextRequest) {
  try {
    const testUserId = req.nextUrl.searchParams.get("testUserId");

    if (!testUserId) {
      return NextResponse.json(
        { error: "Missing testUserId" },
        { status: 400 }
      );
    }

    const user = await getOrCreateUser("test", testUserId);
    const now = new Date();

    const monthStart = startOfMonth(now);
    const nextMonthStart = startOfNextMonth(now);
    const previousMonthStart = startOfPreviousMonth(now);
    const dayStart = startOfDay(now);
    const nextDayStart = startOfNextDay(now);
    const weekStart = startOfWeek(now);

    const [
      currentMonthExpenses,
      previousMonthExpenses,
      recentExpenses,
      activeTasks,
      recentEmails,
      todayEmails,
    ] = await Promise.all([
      prisma.expense.findMany({
        where: {
          userId: user.id,
          occurredAt: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
        orderBy: {
          occurredAt: "desc",
        },
      }),

      prisma.expense.findMany({
        where: {
          userId: user.id,
          occurredAt: {
            gte: previousMonthStart,
            lt: monthStart,
          },
        },
      }),

      prisma.expense.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          occurredAt: "desc",
        },
        take: 20,
      }),

      prisma.task.findMany({
        where: {
          userId: user.id,
          isDone: false,
        },
        orderBy: [
          {
            dueAt: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
      }),

      prisma.emailLog.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      }),

      prisma.emailLog.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: dayStart,
            lt: nextDayStart,
          },
        },
      }),
    ]);

    const monthTotal = currentMonthExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    const previousMonthTotal = previousMonthExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    const weekTotal = recentExpenses
      .filter((expense) => expense.occurredAt >= weekStart)
      .reduce((sum, expense) => sum + Number(expense.amount), 0);

    const monthChange =
      previousMonthTotal > 0
        ? ((monthTotal - previousMonthTotal) / previousMonthTotal) * 100
        : monthTotal > 0
          ? 100
          : 0;

    const dueSoonLimit = new Date(now);
    dueSoonLimit.setDate(dueSoonLimit.getDate() + 3);

    const dueSoonTasks = activeTasks.filter(
      (task) =>
        task.dueAt !== null &&
        task.dueAt >= now &&
        task.dueAt <= dueSoonLimit
    );

    const currentByCategory = new Map<string, number>();
    const previousByCategory = new Map<string, number>();

    for (const expense of currentMonthExpenses) {
      const category = expense.category ?? "Other";
      const amount = Number(expense.amount);

      currentByCategory.set(
        category,
        (currentByCategory.get(category) ?? 0) + amount
      );
    }

    for (const expense of previousMonthExpenses) {
      const category = expense.category ?? "Other";
      const amount = Number(expense.amount);

      previousByCategory.set(
        category,
        (previousByCategory.get(category) ?? 0) + amount
      );
    }

    const leaks = Array.from(currentByCategory.entries())
      .map(([category, currentAmount]) => {
        const previousAmount = previousByCategory.get(category) ?? 0;

        if (previousAmount <= 0) {
          return null;
        }

        const percentage =
          ((currentAmount - previousAmount) / previousAmount) * 100;

        if (percentage <= 15) {
          return null;
        }

        return {
          category,
          currentAmount,
          previousAmount,
          percentage: Number(percentage.toFixed(1)),
        };
      })
      .filter(
        (
          leak
        ): leak is {
          category: string;
          currentAmount: number;
          previousAmount: number;
          percentage: number;
        } => leak !== null
      )
      .sort((a, b) => b.percentage - a.percentage);

    const actionRequiredEmails = recentEmails.filter(
      (email) =>
        email.detectedType === "action_item" ||
        email.routedTo === "TaskSnap"
    );

    const subscriptionEmails = recentEmails.filter(
      (email) =>
        email.detectedType === "subscription" ||
        email.routedTo?.toLowerCase().includes("submanager")
    );

    const activities = [
      ...recentExpenses.map((expense) => ({
        id: `expense-${expense.id}`,
        time: expense.occurredAt,
        title: "Expense recorded",
        description: `₦${Number(expense.amount).toLocaleString("en-NG")} ${
          expense.merchant ?? expense.category ?? "Expense"
        }`,
        type: "expense" as const,
      })),

      ...activeTasks.map((task) => ({
        id: `task-${task.id}`,
        time: task.createdAt,
        title: "Task created",
        description: task.title,
        type: "task" as const,
      })),

      ...recentEmails.map((email) => ({
        id: `email-${email.id}`,
        time: email.createdAt,
        title: "Email summarized",
        description: email.subject ?? "Email processed",
        type: "email" as const,
      })),
    ]
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 10)
      .map((activity) => ({
        ...activity,
        time: activity.time.toISOString(),
      }));

    return NextResponse.json({
      user: {
        id: user.id,
        displayName: user.displayName,
      },

      summary: {
        monthTotal,
        previousMonthTotal,
        weekTotal,
        monthChange: Number(monthChange.toFixed(1)),
        transactionCount: currentMonthExpenses.length,
        activeTaskCount: activeTasks.length,
        dueSoonTaskCount: dueSoonTasks.length,
        todayTaskCount: activeTasks.filter(
          (task) =>
            task.dueAt !== null &&
            task.dueAt >= dayStart &&
            task.dueAt < nextDayStart
        ).length,
        emailProcessedToday: todayEmails.length,
        actionRequiredEmails: actionRequiredEmails.length,
        subscriptions: subscriptionEmails.length,
      },

      expenses: recentExpenses.map((expense) => ({
        id: expense.id,
        amount: Number(expense.amount),
        currency: expense.currency,
        category: expense.category,
        merchant: expense.merchant,
        source: expense.source,
        rawInput: expense.rawInput,
        occurredAt: expense.occurredAt.toISOString(),
        createdAt: expense.createdAt.toISOString(),
      })),

      tasks: activeTasks.map((task) => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        dueAt: task.dueAt?.toISOString() ?? null,
        source: task.source,
        isDone: task.isDone,
        createdAt: task.createdAt.toISOString(),
      })),

      emails: recentEmails.map((email) => ({
        id: email.id,
        subject: email.subject,
        summary: email.summary,
        detectedType: email.detectedType,
        routedTo: email.routedTo,
        createdAt: email.createdAt.toISOString(),
      })),

      leaks,
      activities,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}