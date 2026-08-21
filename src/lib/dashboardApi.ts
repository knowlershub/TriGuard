export type DashboardExpense = {
  id: string;
  amount: number;
  currency: string;
  category: string | null;
  merchant: string | null;
  source: string;
  rawInput: string | null;
  occurredAt: string;
  createdAt: string;
};

export type DashboardTask = {
  id: string;
  title: string;
  priority: string;
  dueAt: string | null;
  source: string | null;
  isDone: boolean;
  createdAt: string;
};

export type DashboardEmail = {
  id: string;
  subject: string | null;
  summary: string | null;
  detectedType: string | null;
  routedTo: string | null;
  createdAt: string;
};

export type DashboardLeak = {
  category: string;
  currentAmount: number;
  previousAmount: number;
  percentage: number;
};

export type DashboardActivity = {
  id: string;
  time: string;
  title: string;
  description: string;
  type: "expense" | "task" | "email";
};

export type DashboardData = {
  user: {
    id: string;
    displayName: string | null;
  };

  summary: {
    monthTotal: number;
    previousMonthTotal: number;
    weekTotal: number;
    monthChange: number;
    transactionCount: number;
    activeTaskCount: number;
    dueSoonTaskCount: number;
    todayTaskCount: number;
    emailProcessedToday: number;
    actionRequiredEmails: number;
    subscriptions: number;
  };

  expenses: DashboardExpense[];
  tasks: DashboardTask[];
  emails: DashboardEmail[];
  leaks: DashboardLeak[];
  activities: DashboardActivity[];
};

export async function getDashboardData(
  testUserId: string
): Promise<DashboardData> {
  const response = await fetch(
    `/api/dashboard?testUserId=${encodeURIComponent(testUserId)}`,
    {
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to load dashboard");
  }

  return data;
}

export async function sendCommand(
  testUserId: string,
  text: string
): Promise<{ reply: string }> {
  const response = await fetch("/api/command", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      testUserId,
      text,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Command failed");
  }

  return data;
}