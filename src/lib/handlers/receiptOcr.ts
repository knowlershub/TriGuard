import { prisma } from "@/lib/prisma";
import { downloadWhatsAppMedia } from "@/lib/whatsappMedia";
import { extractTextFromImage } from "@/lib/ocr/tesseractOcr";
import { parseReceiptText } from "@/lib/parsers/receiptParser";
import { checkLeakAlert } from "@/lib/leakAlert";

export async function handleReceiptImage(userId: string, mediaId: string): Promise<string> {
  const imageBuffer = await downloadWhatsAppMedia(mediaId);
  if (!imageBuffer) {
    return "Couldn't download that image — try sending it again.";
  }

  const rawText = await extractTextFromImage(imageBuffer);
  if (!rawText) {
    return "Couldn't read any text from that receipt. Try a clearer photo, or log it manually with /expense 500 data.";
  }

  const { amount, merchant } = parseReceiptText(rawText);

  if (!amount) {
    return "Found text on the receipt but couldn't find a total amount. Try /expense 500 data to log it manually.";
  }

  const expense = await prisma.expense.create({
    data: {
      userId,
      amount,
      merchant,
      category: merchant,
      source: "receipt_ocr",
      rawInput: rawText,
      parsedBy: "ocr:google_vision",
    },
  });

  const label = merchant ? ` at ${merchant}` : "";
  const alert = await checkLeakAlert(userId, expense.category);
  const base = `Logged ₦${expense.amount}${label} from receipt.`;

  return alert ? `${base}\n${alert}` : base;
}