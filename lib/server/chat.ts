import "server-only";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import { chats, chatMessages } from "./schema";
import type { ChatConversation, ChatMessage } from "../types";

/**
 * Support-chat store. Each visitor keeps a conversation token in their browser
 * and posts to it; admins list conversations and reply. Backed by the `chats`
 * and `chat_messages` tables. Message ids are a global sequence — still unique
 * and insert-ordered, which is all the client needs.
 */

const MAX_LEN = 2000;
const DEFAULT_LABEL = "بازدیدکننده";

type ChatRow = typeof chats.$inferSelect;
type ChatMsgRow = typeof chatMessages.$inferSelect;

function toChatMessage(r: ChatMsgRow): ChatMessage {
  return { id: r.id, from: r.fromRole as "user" | "admin", text: r.text, at: r.at.toISOString() };
}
function toConversation(c: ChatRow, msgs: ChatMsgRow[]): ChatConversation {
  return {
    id: c.id,
    label: c.label,
    messages: msgs.map(toChatMessage),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    unreadForAdmin: c.unreadForAdmin,
  };
}

async function attach(rows: ChatRow[]): Promise<ChatConversation[]> {
  if (!rows.length) return [];
  const msgs = await db
    .select()
    .from(chatMessages)
    .where(inArray(chatMessages.chatId, rows.map((r) => r.id)))
    .orderBy(chatMessages.id);
  const byChat = new Map<string, ChatMsgRow[]>();
  for (const m of msgs) {
    const list = byChat.get(m.chatId);
    if (list) list.push(m);
    else byChat.set(m.chatId, [m]);
  }
  return rows.map((r) => toConversation(r, byChat.get(r.id) ?? []));
}

export async function listConversations(): Promise<ChatConversation[]> {
  return attach(await db.select().from(chats).orderBy(desc(chats.updatedAt)));
}

export async function getConversation(id: string): Promise<ChatConversation | undefined> {
  const [row] = await db.select().from(chats).where(eq(chats.id, id));
  if (!row) return undefined;
  return (await attach([row]))[0];
}

export async function totalUnreadForAdmin(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`coalesce(sum(${chats.unreadForAdmin}), 0)::int` })
    .from(chats);
  return row?.n ?? 0;
}

/** Visitor sends a message; creates the conversation on first contact. */
export async function postUserMessage(
  id: string,
  text: string,
  label?: string
): Promise<ChatConversation | undefined> {
  const clean = text.trim().slice(0, MAX_LEN);
  if (!id || !clean) return undefined;

  return db.transaction(async (tx) => {
    const t = new Date();
    const [existing] = await tx.select().from(chats).where(eq(chats.id, id)).for("update");
    if (!existing) {
      await tx.insert(chats).values({
        id,
        label: label?.trim() || DEFAULT_LABEL,
        createdAt: t,
        updatedAt: t,
        unreadForAdmin: 0,
      });
    } else if (label?.trim() && existing.label === DEFAULT_LABEL) {
      // a guest who later identifies themselves upgrades the label
      await tx.update(chats).set({ label: label.trim() }).where(eq(chats.id, id));
    }

    await tx.insert(chatMessages).values({ chatId: id, fromRole: "user", text: clean, at: t });
    const [updated] = await tx
      .update(chats)
      .set({ updatedAt: t, unreadForAdmin: sql`${chats.unreadForAdmin} + 1` })
      .where(eq(chats.id, id))
      .returning();

    const msgs = await tx.select().from(chatMessages).where(eq(chatMessages.chatId, id)).orderBy(chatMessages.id);
    return toConversation(updated, msgs);
  });
}

/** Admin replies to an existing conversation. */
export async function postAdminMessage(
  id: string,
  text: string
): Promise<ChatConversation | undefined> {
  const clean = text.trim().slice(0, MAX_LEN);
  if (!id || !clean) return undefined;

  return db.transaction(async (tx) => {
    const t = new Date();
    const [existing] = await tx.select().from(chats).where(eq(chats.id, id)).for("update");
    if (!existing) return undefined;

    await tx.insert(chatMessages).values({ chatId: id, fromRole: "admin", text: clean, at: t });
    const [updated] = await tx
      .update(chats)
      .set({ updatedAt: t, unreadForAdmin: 0 }) // replying implies the admin has read it
      .where(eq(chats.id, id))
      .returning();

    const msgs = await tx.select().from(chatMessages).where(eq(chatMessages.chatId, id)).orderBy(chatMessages.id);
    return toConversation(updated, msgs);
  });
}

export async function markReadByAdmin(id: string): Promise<void> {
  await db.update(chats).set({ unreadForAdmin: 0 }).where(eq(chats.id, id));
}
