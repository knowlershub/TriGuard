export type WhatsAppIncomingTextMessage = {
  messageId: string;
  from: string;
  timestamp: string;
  text: string;
  phoneNumberId: string | null;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(
  value: unknown
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function parseIncomingWhatsAppTextMessage(
  payload: unknown
): WhatsAppIncomingTextMessage | null {
  if (!isRecord(payload)) {
    return null;
  }

  const entry = Array.isArray(payload.entry)
    ? payload.entry[0]
    : null;

  if (!isRecord(entry)) {
    return null;
  }

  const changes = Array.isArray(entry.changes)
    ? entry.changes[0]
    : null;

  if (!isRecord(changes)) {
    return null;
  }

  if (!isRecord(changes.value)) {
    return null;
  }

  const value = changes.value;

  const messages = Array.isArray(value.messages)
    ? value.messages
    : null;

  if (!messages || messages.length === 0) {
    return null;
  }

  const message = messages[0];

  if (!isRecord(message)) {
    return null;
  }

  if (message.type !== "text") {
    return null;
  }

  const from =
    typeof message.from === "string"
      ? message.from.trim()
      : "";

  const messageId =
    typeof message.id === "string"
      ? message.id.trim()
      : "";

  const timestamp =
    typeof message.timestamp === "string"
      ? message.timestamp
      : "";

  const text =
    isRecord(message.text) &&
    typeof message.text.body === "string"
      ? message.text.body.trim()
      : "";

  const phoneNumberId =
    isRecord(value.metadata) &&
    typeof value.metadata.phone_number_id === "string"
      ? value.metadata.phone_number_id
      : null;

  if (!from || !messageId || !text) {
    return null;
  }

  return {
    messageId,
    from,
    timestamp,
    text,
    phoneNumberId,
  };
}
