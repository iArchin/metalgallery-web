import "server-only";
import { readCollection, updateCollection } from "./db";
import type { ChatConversation, ChatMessage } from "../types";

/**
 * Support-chat store. Each visitor keeps a conversation token in their browser
 * and posts to it; admins list conversations and reply. Backed by the `chats`
 * JSON collection through the serialized updateCollection queue.
 */

const now = () => new Date().toISOString();
const MAX_LEN = 2000;

function nextMsgId(msgs: ChatMessage[]): number {
  return msgs.reduce((m, x) => Math.max(m, x.id), 0) + 1;
}

export async function listConversations(): Promise<ChatConversation[]> {
  const all = await readCollection<ChatConversation[]>("chats");
  return [...all].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getConversation(id: string): Promise<ChatConversation | undefined> {
  const all = await readCollection<ChatConversation[]>("chats");
  return all.find((c) => c.id === id);
}

export async function totalUnreadForAdmin(): Promise<number> {
  const all = await readCollection<ChatConversation[]>("chats");
  return all.reduce((s, c) => s + (c.unreadForAdmin || 0), 0);
}

/** Visitor sends a message; creates the conversation on first contact. */
export async function postUserMessage(
  id: string,
  text: string,
  label?: string
): Promise<ChatConversation | undefined> {
  const clean = text.trim().slice(0, MAX_LEN);
  if (!id || !clean) return undefined;
  return updateCollection<ChatConversation[], ChatConversation>("chats", (all) => {
    const t = now();
    const idx = all.findIndex((c) => c.id === id);
    const base: ChatConversation =
      idx === -1
        ? {
            id,
            label: label?.trim() || "بازدیدکننده",
            messages: [],
            createdAt: t,
            updatedAt: t,
            unreadForAdmin: 0,
          }
        : { ...all[idx], messages: [...all[idx].messages] };
    if (idx !== -1 && label?.trim() && base.label === "بازدیدکننده") {
      base.label = label.trim();
    }
    base.messages.push({ id: nextMsgId(base.messages), from: "user", text: clean, at: t });
    base.updatedAt = t;
    base.unreadForAdmin = (base.unreadForAdmin || 0) + 1;
    const next = idx === -1 ? [...all, base] : all.map((c, i) => (i === idx ? base : c));
    return { next, result: base };
  });
}

/** Admin replies to an existing conversation. */
export async function postAdminMessage(
  id: string,
  text: string
): Promise<ChatConversation | undefined> {
  const clean = text.trim().slice(0, MAX_LEN);
  if (!id || !clean) return undefined;
  return updateCollection<ChatConversation[], ChatConversation | undefined>("chats", (all) => {
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) return { next: all, result: undefined };
    const t = now();
    const convo: ChatConversation = { ...all[idx], messages: [...all[idx].messages] };
    convo.messages.push({ id: nextMsgId(convo.messages), from: "admin", text: clean, at: t });
    convo.updatedAt = t;
    convo.unreadForAdmin = 0; // replying implies the admin has read it
    const next = all.map((c, i) => (i === idx ? convo : c));
    return { next, result: convo };
  });
}

export async function markReadByAdmin(id: string): Promise<void> {
  return updateCollection<ChatConversation[], void>("chats", (all) => {
    const next = all.map((c) => (c.id === id ? { ...c, unreadForAdmin: 0 } : c));
    return { next, result: undefined };
  });
}
