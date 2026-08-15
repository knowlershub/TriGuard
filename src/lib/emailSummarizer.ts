export type EmailSummary = {
  bullets: string[];
  detectedType: "bill" | "subscription" | "action_item" | null;
};

const SYSTEM_PROMPT = `You summarize emails for a busy student/young professional in Nigeria.
Given an email's subject, sender, and a text snippet, respond with ONLY valid JSON, no markdown, no preamble:
{
  "bullets": ["<point 1>", "<point 2>", "<point 3>"],
  "detectedType": "bill" | "subscription" | "action_item" | null
}
Rules:
- Exactly 3 bullets, each under 15 words.
- detectedType "bill": a payment is due (utility, school fee, rent, etc).
- detectedType "subscription": a recurring service renewal/charge is mentioned.
- detectedType "action_item": the email asks the recipient to do something specific.
- detectedType null: none of the above (newsletter, FYI, social, etc).
- If the snippet is too short/unclear to summarize meaningfully, still return your best 3 bullets from what's available.`;

export async function summarizeEmail(
  subject: string,
  from: string,
  snippet: string
): Promise<EmailSummary | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[emailSummarizer] Missing OPENAI_API_KEY.");
    return null;
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Subject: ${subject}\nFrom: ${from}\nSnippet: ${snippet}` },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    console.error(`[emailSummarizer] OpenAI API error (${res.status}): ${await res.text()}`);
    return null;
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed.bullets)) return null;
    return {
      bullets: parsed.bullets.slice(0, 3),
      detectedType: parsed.detectedType ?? null,
    };
  } catch {
    console.error("[emailSummarizer] Failed to parse model output as JSON:", content);
    return null;
  }
}