export async function downloadWhatsAppMedia(mediaId: string): Promise<Buffer | null> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    console.error("[whatsappMedia] Missing WHATSAPP_ACCESS_TOKEN.");
    return null;
  }

  const metaRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!metaRes.ok) {
    console.error(`[whatsappMedia] Failed to fetch media metadata (${metaRes.status})`);
    return null;
  }

  const meta = await metaRes.json();
  const url: string | undefined = meta?.url;
  if (!url) {
    console.error("[whatsappMedia] Media metadata had no url field.");
    return null;
  }

  const fileRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!fileRes.ok) {
    console.error(`[whatsappMedia] Failed to download media file (${fileRes.status})`);
    return null;
  }

  const arrayBuffer = await fileRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}