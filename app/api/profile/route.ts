import {
  getCurrentCustomer,
  updateCustomer,
  type CustomerProfilePatch,
} from "@/lib/server/auth";
import type { CustomerAddress } from "@/lib/types";

export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return Response.json({ ok: false, error: "وارد نشده‌اید" }, { status: 401 });
  }
  return Response.json({ ok: true, data: customer });
}

export async function PUT(req: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return Response.json({ ok: false, error: "وارد نشده‌اید" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "بدنه درخواست نامعتبر است" }, { status: 400 });
  }

  const patch: CustomerProfilePatch = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string") {
      return Response.json({ ok: false, error: "نام نامعتبر است" }, { status: 400 });
    }
    patch.name = body.name.trim().slice(0, 80);
  }

  if (body.avatar !== undefined) {
    // Accepts a URL or an uploaded (client-resized) data URL; cap keeps the
    // stored image small (~256px JPEG is well under this).
    patch.avatar = typeof body.avatar === "string" ? body.avatar.trim().slice(0, 800000) : "";
  }

  if (body.address !== undefined) {
    if (body.address === null) {
      patch.address = undefined;
    } else if (typeof body.address === "object" && !Array.isArray(body.address)) {
      const a = body.address as Record<string, unknown>;
      const addr: CustomerAddress = {
        full: typeof a.full === "string" ? a.full.trim().slice(0, 500) : "",
        postalCode:
          typeof a.postalCode === "string" ? a.postalCode.replace(/\D/g, "").slice(0, 10) : "",
      };
      const lat = Number(a.lat);
      const lng = Number(a.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
        addr.lat = lat;
        addr.lng = lng;
      }
      patch.address = addr;
    } else {
      return Response.json({ ok: false, error: "آدرس نامعتبر است" }, { status: 400 });
    }
  }

  const updated = await updateCustomer(customer.id, patch);
  if (!updated) {
    return Response.json({ ok: false, error: "حساب کاربری یافت نشد" }, { status: 404 });
  }
  return Response.json({ ok: true, data: updated });
}
