import { prisma } from "@/lib/prisma";

export type PendingEventType = "round_up" | "bill_detected" | "subscription_detected";

export async function queuePendingEvent(
  userId: string,
  eventType: PendingEventType,
  payload: Record<string, unknown>
): Promise<void> {
  await prisma.pendingCrossModuleEvent.create({
    data: {
      userId,
      eventType,
      payload: JSON.stringify(payload),
      status: "pending_module",
    },
  });
}