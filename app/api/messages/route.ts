import { listMessages, createMessage } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const messages = await listMessages();
    return Response.json({ ok: true, data: messages });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در دریافت پیام‌ها" },
      { status: 500 }
    );
  }
}

// Public endpoint — the contact form posts here.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: "بدنه درخواست نامعتبر است" },
      { status: 400 }
    );
  }

  const { name, email, subject, message } = (body ?? {}) as {
    name?: unknown;
    email?: unknown;
    subject?: unknown;
    message?: unknown;
  };

  if (typeof name !== "string" || !name.trim()) {
    return Response.json(
      { ok: false, error: "نام الزامی است" },
      { status: 400 }
    );
  }
  if (typeof email !== "string" || !email.trim()) {
    return Response.json(
      { ok: false, error: "ایمیل الزامی است" },
      { status: 400 }
    );
  }
  if (typeof subject !== "string" || !subject.trim()) {
    return Response.json(
      { ok: false, error: "موضوع پیام الزامی است" },
      { status: 400 }
    );
  }
  if (typeof message !== "string" || !message.trim()) {
    return Response.json(
      { ok: false, error: "متن پیام الزامی است" },
      { status: 400 }
    );
  }

  try {
    const created = await createMessage({ name, email, subject, message });
    return Response.json({ ok: true, data: created });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در ثبت پیام" },
      { status: 500 }
    );
  }
}
