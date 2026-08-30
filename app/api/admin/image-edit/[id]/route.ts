import { requireAdminApi } from "@/lib/server/auth";
import { AtlasError, getImageEditResult, pollUrlForJob } from "@/lib/server/atlas";

/** Poll one edit job. Returns processing / completed (with a preview URL) / failed. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await params;
  let pollUrl: string;
  try {
    pollUrl = pollUrlForJob(id);
  } catch {
    return Response.json({ ok: false, error: "شناسه نامعتبر است" }, { status: 400 });
  }

  try {
    return Response.json({ ok: true, data: await getImageEditResult(pollUrl) });
  } catch (e) {
    if (e instanceof AtlasError) {
      return Response.json({ ok: false, error: e.message }, { status: 502 });
    }
    return Response.json({ ok: false, error: "خطا در دریافت وضعیت ویرایش" }, { status: 500 });
  }
}
