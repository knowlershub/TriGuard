import { NextRequest, NextResponse } from "next/server";

import { extractTextFromImage as extractWithGoogleVision } from "@/lib/ocr/googleVision";
import { extractTextFromImage as extractWithTesseract } from "@/lib/ocr/tesseractOcr";
import { parseReceiptText } from "@/lib/parsers/receiptParser";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest
) {
  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    return new NextResponse(
      "Not Found",
      {
        status: 404,
      }
    );
  }

  try {
    const formData =
      await req.formData().catch(
        () => null
      );

    const file =
      formData?.get("image");

    if (
      !file ||
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            "Send multipart/form-data with an 'image' field.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "The uploaded file must be an image.",
        },
        {
          status: 400,
        }
      );
    }

    const maxFileSize =
      10 * 1024 * 1024;

    if (
      file.size > maxFileSize
    ) {
      return NextResponse.json(
        {
          error:
            "Image must be 10MB or smaller.",
        },
        {
          status: 400,
        }
      );
    }

    const arrayBuffer =
      await file.arrayBuffer();

    const imageBuffer =
      Buffer.from(arrayBuffer);

    let rawText:
      | string
      | null = null;

    let provider:
      | "google_vision"
      | "tesseract" =
      "tesseract";

    if (
      process.env
        .GOOGLE_VISION_API_KEY
    ) {
      rawText =
        await extractWithGoogleVision(
          imageBuffer
        );

      if (rawText) {
        provider =
          "google_vision";
      }
    }

    if (!rawText) {
      rawText =
        await extractWithTesseract(
          imageBuffer
        );

      provider =
        "tesseract";
    }

    if (!rawText) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from this image. Try a clearer photo with better lighting.",
        },
        {
          status: 422,
        }
      );
    }

    const parsed =
      parseReceiptText(
        rawText
      );

    return NextResponse.json({
      rawText,
      parsed,
      provider,
    });
  } catch (error) {
    console.error(
      "[ocr] OCR request failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "OCR processing failed.",
      },
      {
        status: 500,
      }
    );
  }
}
