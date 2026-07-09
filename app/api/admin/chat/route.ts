import { requireAdminApi } from "@/lib/server/auth";
import { listConversations, totalUnreadForAdmin } from "@/lib/server/chat";

/** Admin: list all support conversations + total unread count. */
export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const [conversations, unread] = await Promise.all([
    listConversations(),
    totalUnreadForAdmin(),
  ]);
  return Response.json({ ok: true, data: { conversations, unread } });
}
