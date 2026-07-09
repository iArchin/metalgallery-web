import { getConversation } from "@/lib/server/chat";

/** Visitor polls their own conversation for new (admin) replies. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const convo = await getConversation(id);
  return Response.json({ ok: true, data: { messages: convo?.messages ?? [] } });
}
