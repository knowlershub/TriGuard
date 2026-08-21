export async function extractTextFromImage(
  imageBuffer: Buffer
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    console.error(
      "[googleVision] GOOGLE_VISION_API_KEY is missing."
    );
    return null;
  }

  const base64Image = imageBuffer.toString("base64");

  try {
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: "TEXT_DETECTION",
                },
              ],
            },
          ],
        }),
      }
    );

    const body = await res.text();

    if (!res.ok) {
      console.error(
        `[googleVision] API error (${res.status}): ${body}`
      );

      return null;
    }

    let data: {
      responses?: Array<{
        fullTextAnnotation?: {
          text?: string;
        };
        error?: {
          code?: number;
          message?: string;
          status?: string;
        };
      }>;
    };

    try {
      data = JSON.parse(body);
    } catch {
      console.error(
        "[googleVision] API returned invalid JSON."
      );

      return null;
    }

    const firstResponse = data.responses?.[0];

    if (firstResponse?.error) {
      console.error(
        "[googleVision] Vision response error:",
        firstResponse.error
      );

      return null;
    }

    const text =
      firstResponse?.fullTextAnnotation?.text?.trim();

    if (!text) {
      console.warn(
        "[googleVision] Google Vision returned no text."
      );

      return null;
    }

    return text;
  } catch (error) {
    console.error(
      "[googleVision] Request failed:",
      error
    );

    return null;
  }
}