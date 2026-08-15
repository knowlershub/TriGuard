import { createWorker } from "tesseract.js";

export async function extractTextFromImage(imageBuffer: Buffer): Promise<string | null> {
  try {
    const worker = await createWorker("eng");
    const { data } = await worker.recognize(imageBuffer);
    await worker.terminate();

    const text = data.text?.trim();
    return text && text.length > 0 ? text : null;
  } catch (err) {
    console.error("[tesseractOcr] OCR failed:", err);
    return null;
  }
}