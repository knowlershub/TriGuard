export async function extractTextFromImage(imageBuffer: Buffer): Promise<string | null> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    console.error("[googleVision] Missing GOOGLE_VISION_API_KEY.");
    return null;
  }

  const base64Image = imageBuffer.toString("base64");

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[googleVision] API error (${res.status}): ${body}`);
    return null;
  }

  const data = await res.json();
  const text = data?.responses?.[0]?.fullTextAnnotation?.text;
  return text ?? null;
}