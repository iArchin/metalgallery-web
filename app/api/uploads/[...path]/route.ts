import path from "path";
import fs from "fs/promises";
import { uploadsRoot } from "@/lib/server/uploads";

/**
 * Serve admin-uploaded files from DATA_DIR/uploads (they live outside /public,
 * on the persistent data volume). Public — the storefront shows these images
 * to everyone. See lib/server/uploads.ts for why this sits under /api.
 */

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;

  // Server-generated names only — anything else (dotfiles, "..", separators)
  // is a 404, which also makes path traversal unexpressible.
  if (
    !segments?.length ||
    segments.some((s) => !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(s) || s.includes(".."))
  ) {
    return new Response(null, { status: 404 });
  }

  const type = CONTENT_TYPES[path.extname(segments[segments.length - 1]).toLowerCase()];
  if (!type) return new Response(null, { status: 404 });

  try {
    const buf = await fs.readFile(path.join(uploadsRoot(), ...segments));
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": type,
        // Filenames are unique per upload and never rewritten.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
