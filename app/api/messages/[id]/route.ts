import { setMessageRead, deleteMessage } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await ctx.params;
  const messageId = Number(id);
  if (!Number.isInteger(messageId)) {
    return Response.json(
      { ok: false, error: "شناسه پیام نامعتبر است" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: "بدنه درخواست نامعتبر است" },
      { status: 400 }
    );
  }

  const { read } = (body ?? {}) as { read?: unknown };
  if (typeof read !== "boolean") {
    return Response.json(
      { ok: false, error: "وضعیت خوانده‌شدن پیام نامعتبر است" },
      { status: 400 }
    );
  }

  try {
    const message = await setMessageRead(messageId, read);
    if (!message) {
      return Response.json(
        { ok: false, error: "پیام مورد نظر پیدا نشد" },
        { status: 404 }
      );
    }
    return Response.json({ ok: true, data: message });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در به‌روزرسانی پیام" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await ctx.params;
  const messageId = Number(id);
  if (!Number.isInteger(messageId)) {
    return Response.json(
      { ok: false, error: "شناسه پیام نامعتبر است" },
      { status: 400 }
    );
  }

  try {
    const removed = await deleteMessage(messageId);
    if (!removed) {
      return Response.json(
        { ok: false, error: "پیام مورد نظر پیدا نشد" },
        { status: 404 }
      );
    }
    return Response.json({ ok: true, data: { id: messageId } });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در حذف پیام" },
      { status: 500 }
    );
  }
}
