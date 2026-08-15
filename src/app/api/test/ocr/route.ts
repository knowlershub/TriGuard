import { NextRequest, NextResponse } from "next/server";
import { extractTextFromImage } from "@/lib/ocr/tesseractOcr";
import { parseReceiptText } from "@/lib/parsers/receiptParser";

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("image");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Send multipart/form-data with an 'image' field." },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);

  const rawText = await extractTextFromImage(imageBuffer);
  if (!rawText) {
    return NextResponse.json(
      { error: "Vision API returned no text — check GOOGLE_VISION_API_KEY and server logs." },
      { status: 500 }
    );
  }

  const parsed = parseReceiptText(rawText);

  return NextResponse.json({
    rawText,
    parsed,
  });
}