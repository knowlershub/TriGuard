import {
  NextRequest,
  NextResponse,
} from "next/server";

import { resolveApiUser } from "@/lib/apiAuth";
import {
  extractTextFromImage,
} from "@/lib/ocr/tesseractOcr";
import {
  parseReceiptText,
} from "@/lib/parsers/receiptParser";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

export async function POST(
  req: NextRequest
) {
  try {
    const resolved =
      await resolveApiUser();

    if (resolved.status !== 200) {
      return NextResponse.json(
        {
          error: resolved.error,
        },
        {
          status: resolved.status,
        }
      );
    }

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
      !file.type.startsWith("image/")
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

    if (
      file.size <= 0 ||
      file.size > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "Image must be between 1 byte and 10MB.",
        },
        {
          status: 400,
        }
      );
    }

    const imageBuffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    const rawText =
      await extractTextFromImage(
        imageBuffer
      );

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
      parseReceiptText(rawText);

    return NextResponse.json({
      rawText,
      parsed,
      provider: "tesseract",
    });
  } catch (error) {
    console.error(
      "[receipt ocr] OCR request failed:",
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
