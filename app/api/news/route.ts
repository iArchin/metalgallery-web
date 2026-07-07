import { newsRepo } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";
import type { NewsItem } from "@/lib/types";

export async function GET(req: Request) {
  try {
    let news = await newsRepo.list();
    // Drafts are admin-only: ?all=1 with a valid session includes them.
    const wantsAll = new URL(req.url).searchParams.get("all") === "1";
    const isAdmin = wantsAll && !(await requireAdminApi());
    if (!isAdmin) news = news.filter((n) => n.published);
    return Response.json({ ok: true, data: news });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در دریافت فهرست اخبار" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: "بدنه درخواست نامعتبر است" },
      { status: 400 }
    );
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return Response.json(
      { ok: false, error: "عنوان خبر الزامی است" },
      { status: 400 }
    );
  }

  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) {
    return Response.json(
      { ok: false, error: "متن خبر الزامی است" },
      { status: 400 }
    );
  }

  const input: Omit<NewsItem, "id"> = {
    title,
    body: text,
    date: typeof body.date === "string" ? body.date.trim() : "",
    tag: typeof body.tag === "string" ? body.tag.trim() : "",
    published: Boolean(body.published),
  };

  try {
    const item = await newsRepo.create(input);
    return Response.json({ ok: true, data: item });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در ایجاد خبر" },
      { status: 500 }
    );
  }
}
