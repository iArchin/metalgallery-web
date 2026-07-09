import { postUserMessage } from "@/lib/server/chat";

/** Visitor sends a support message. Body: { conversationId, text, label? }. */
export async function POST(req: Request) {
  let body: { conversationId?: unknown; text?: unknown; label?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "بدنه درخواست نامعتبر است" }, { status: 400 });
  }
  const { conversationId, text, label } = body ?? {};
  if (typeof conversationId !== "string" || !conversationId.trim()) {
    return Response.json({ ok: false, error: "شناسه گفتگو نامعتبر است" }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ ok: false, error: "متن پیام را وارد کنید" }, { status: 400 });
  }
  const convo = await postUserMessage(
    conversationId,
    text,
    typeof label === "string" ? label : undefined
  );
  if (!convo) {
    return Response.json({ ok: false, error: "ارسال پیام ناموفق بود" }, { status: 400 });
  }
  return Response.json({ ok: true, data: { messages: convo.messages } });
}
