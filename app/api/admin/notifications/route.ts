import { eq, sql } from "drizzle-orm";
import { requireAdminApi } from "@/lib/server/auth";
import { totalUnreadForAdmin } from "@/lib/server/chat";
import { db } from "@/lib/server/db";
import { messages, orders } from "@/lib/server/schema";

/** Admin: live counts for the sidebar badges (chat, messages, pending orders). */
export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const [chatUnread, messagesUnread, pendingOrders] = await Promise.all([
    totalUnreadForAdmin(),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(messages)
      .where(eq(messages.read, false))
      .then((r) => r[0]?.n ?? 0),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.status, "pending"))
      .then((r) => r[0]?.n ?? 0),
  ]);

  return Response.json({
    ok: true,
    data: { chatUnread, messagesUnread, pendingOrders },
  });
}
