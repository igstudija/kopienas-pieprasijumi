export function extractWhatsappTextMessages(payload: unknown) {
  const result: Array<{ from: string; text: string }> = [];
  if (!payload || typeof payload !== "object") return result;
  const root = payload as { entry?: Array<{ changes?: Array<{ value?: { messages?: Array<{ from?: string; type?: string; text?: { body?: string } }> } }> }> };
  for (const entry of root.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        if (message.type === "text" && message.from && message.text?.body) result.push({ from: message.from, text: message.text.body });
      }
    }
  }
  return result;
}
