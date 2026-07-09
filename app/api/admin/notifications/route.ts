import { requireAdminApi } from "@/lib/server/auth";
import { totalUnreadForAdmin } from "@/lib/server/chat";
import { readCollection } from "@/lib/server/db";
import type { ContactMessage, Order } from "@/lib/types";

/** Admin: live counts for the sidebar badges (chat, messages, pending orders). */
export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const [chatUnread, messages, orders] = await Promise.all([
    totalUnreadForAdmin(),
    readCollection<ContactMessage[]>("messages"),
    readCollection<Order[]>("orders"),
  ]);
  return Response.json({
    ok: true,
    data: {
      chatUnread,
      messagesUnread: messages.filter((m) => !m.read).length,
      pendingOrders: orders.filter((o) => o.status === "pending").length,
    },
  });
}
