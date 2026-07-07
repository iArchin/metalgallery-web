import {
  findUserByEmail,
  verifyPassword,
  setSessionCookie,
} from "@/lib/server/auth";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: "درخواست نامعتبر است" },
      { status: 400 }
    );
  }

  const { email, password } = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
  };

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return Response.json(
      { ok: false, error: "ایمیل و رمز عبور را وارد کنید" },
      { status: 400 }
    );
  }

  const user = await findUserByEmail(email.trim());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return Response.json(
      { ok: false, error: "ایمیل یا رمز عبور اشتباه است" },
      { status: 401 }
    );
  }

  await setSessionCookie(user.id);

  return Response.json({
    ok: true,
    data: { id: user.id, email: user.email, name: user.name },
  });
}
