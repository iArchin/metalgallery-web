import { listProducts } from "@/lib/server/repos";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";

    if (!q || q.length < 1) {
      return Response.json({ ok: true, data: [] });
    }

    const products = await listProducts();

    const query = q.toLowerCase();
    const results = products
      .filter((p) => {
        if (!p.active) return false;
        const name = p.name.toLowerCase();
        const desc = p.description.toLowerCase();
        return name.includes(query) || desc.includes(query);
      })
      .sort((a, b) => {
        // Exact match or starts-with gets priority
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aStarts = aName.startsWith(query);
        const bStarts = bName.startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.id - b.id;
      })
      .slice(0, 6);

    return Response.json({ ok: true, data: results });
  } catch {
    return Response.json(
      { ok: false, error: "خطا در جستجوی محصولات" },
      { status: 500 }
    );
  }
}
