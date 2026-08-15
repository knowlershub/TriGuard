/**
 * Free alternative to OpenAI for email summarization — Google's Gemini API
 * via AI Studio (ai.google.dev), NOT the same as Cloud Vision/Vertex AI.
 * This one has a genuine free tier with no billing account required at all.
 *
 * Get a key: aistudio.google.com/app/apikey — click "Create API key",
 * no credit card, no Cloud project billing needed. Different from
 * GOOGLE_VISION_API_KEY (Cloud Console) even though both are "Google" —
 * store this one separately as GEMINI_API_KEY.
 *
 * Same function signature as emailSummarizer.ts (OpenAI version) — drop-in
 * replacement, nothing else needs to change to switch between them.
 */

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
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("[emailSummarizer] Missing GEMINI_API_KEY.");
    return null;
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\nSubject: ${subject}\nFrom: ${from}\nSnippet: ${snippet}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    console.error(
      `[emailSummarizer] Gemini API error (${res.status}): ${await res.text()}`
    );
    return null;
  }

  const data = await res.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    return null;
  }

  try {
    const parsed = JSON.parse(content);

    if (!Array.isArray(parsed.bullets)) {
      return null;
    }

    return {
      bullets: parsed.bullets.slice(0, 3),
      detectedType: parsed.detectedType ?? null,
    };
  } catch {
    console.error(
      "[emailSummarizer] Failed to parse model output as JSON:",
      content
    );
    return null;
  }
}