import { articlesRepo } from "@/lib/server/repos";
import { requireAdminApi } from "@/lib/server/auth";
import type { Article } from "@/lib/types";

/**
 * Accepts content either as a paragraphs array or as raw textarea text
 * (paragraphs separated by blank lines) and normalizes to string[].
 */
function normalizeContent(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((p) => String(p).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(/\r?\n\s*\r?\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return [];
}

export async function GET(req: Request) {
  try {
    let articles = await articlesRepo.list();
    // Drafts are admin-only: ?all=1 with a valid session includes them.
    const wantsAll = new URL(req.url).searchParams.get("all") === "1";
    const isAdmin = wantsAll && !(await requireAdminApi());
    if (!isAdmin) articles = articles.filter((a) => a.published);
    return Response.json({ ok: true, data: articles });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در دریافت فهرست مقالات" },
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
      { ok: false, error: "عنوان مقاله الزامی است" },
      { status: 400 }
    );
  }

  const content = normalizeContent(body.content);
  if (content.length === 0) {
    return Response.json(
      { ok: false, error: "متن مقاله الزامی است" },
      { status: 400 }
    );
  }

  const input: Omit<Article, "id"> = {
    title,
    excerpt: typeof body.excerpt === "string" ? body.excerpt.trim() : "",
    content,
    date: typeof body.date === "string" ? body.date.trim() : "",
    author: typeof body.author === "string" ? body.author.trim() : "",
    category: typeof body.category === "string" ? body.category.trim() : "",
    readingMinutes: Math.max(1, Math.round(Number(body.readingMinutes) || 1)),
    imageKeyword:
      typeof body.imageKeyword === "string" && body.imageKeyword.trim()
        ? body.imageKeyword.trim()
        : "toys",
    imageLock: Number(body.imageLock) || 0,
    published: Boolean(body.published),
  };

  try {
    const article = await articlesRepo.create(input);
    return Response.json({ ok: true, data: article });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در ایجاد مقاله" },
      { status: 500 }
    );
  }
}
