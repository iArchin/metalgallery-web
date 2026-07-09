import { requireAdminApi } from "@/lib/server/auth";
import { getConversation, markReadByAdmin, postAdminMessage } from "@/lib/server/chat";

/** Admin: open a conversation (marks it read). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { id } = await ctx.params;
  const convo = await getConversation(id);
  if (!convo) return Response.json({ ok: false, error: "گفتگو یافت نشد" }, { status: 404 });
  if (convo.unreadForAdmin) await markReadByAdmin(id);
  return Response.json({ ok: true, data: { ...convo, unreadForAdmin: 0 } });
}

/** Admin: reply to a conversation. Body: { text }. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { id } = await ctx.params;
  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "بدنه درخواست نامعتبر است" }, { status: 400 });
  }
  if (typeof body?.text !== "string" || !body.text.trim()) {
    return Response.json({ ok: false, error: "متن پاسخ را وارد کنید" }, { status: 400 });
  }
  const convo = await postAdminMessage(id, body.text);
  if (!convo) return Response.json({ ok: false, error: "گفتگو یافت نشد" }, { status: 404 });
  return Response.json({ ok: true, data: convo });
}
