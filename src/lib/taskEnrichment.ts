import * as chrono from "chrono-node";

export type TaskPriority = "high" | "medium" | "low";

export type EnrichedTask = {
  title: string;
  dueAt: Date | null;
  priority: TaskPriority;
};

const HIGH_PRIORITY_KEYWORDS = [
  "urgent", "asap", "important", "deadline", "exam", "due", "critical", "emergency",
];
const LOW_PRIORITY_KEYWORDS = [
  "sometime", "eventually", "whenever", "maybe", "no rush",
];

export function enrichTask(rawText: string): EnrichedTask {
  const priority = detectPriority(rawText);
  const { title, dueAt } = detectDeadline(rawText);

  return { title, dueAt, priority };
}

function detectPriority(text: string): TaskPriority {
  const lower = text.toLowerCase();

  if (HIGH_PRIORITY_KEYWORDS.some((kw) => lower.includes(kw))) return "high";
  if (LOW_PRIORITY_KEYWORDS.some((kw) => lower.includes(kw))) return "low";
  return "medium";
}

function detectDeadline(text: string): { title: string; dueAt: Date | null } {
  const results = chrono.parse(text, new Date(), { forwardDate: true });

  if (results.length === 0) {
    return { title: text, dueAt: null };
  }

  const match = results[0];
  const title = (text.slice(0, match.index) + text.slice(match.index + match.text.length))
    .replace(/\s+/g, " ")
    .trim();

  return {
    title: title || text.trim(),
    dueAt: match.start.date(),
  };
}