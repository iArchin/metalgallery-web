import "server-only";
import { createHash, randomInt, timingSafeEqual } from "crypto";
import { readCollection, updateCollection } from "./db";
import { SESSION_SECRET as SECRET } from "./secret";

/**
 * Phone + OTP core, shared by the customer and admin login flows.
 *
 * Codes are stored hashed (never in plaintext) in the `otps` collection, keyed
 * by canonical phone, with a short TTL, a resend cooldown and a max-attempts
 * cap. Delivery goes through SMS.ir's verify API; when no provider is
 * configured the code is logged to the server console instead (dev fallback).
 */

const OTP_TTL_MS = 2 * 60 * 1000; // code valid for 2 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // one code per phone per minute
const MAX_ATTEMPTS = 5; // wrong tries before a code is burned
const CODE_LENGTH = 5;

interface OtpRecord {
  codeHash: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

type OtpStore = Record<string, OtpRecord>;

/* --------------------------------------------------------------- helpers */

/** Convert Persian/Arabic-Indic digits to ASCII. */
function toAsciiDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** Normalize an Iranian mobile number to canonical `09xxxxxxxxx`, or null. */
export function normalizePhone(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let s = toAsciiDigits(input).replace(/[\s\-()]/g, "");
  if (s.startsWith("+98")) s = "0" + s.slice(3);
  else if (s.startsWith("0098")) s = "0" + s.slice(4);
  else if (s.startsWith("98") && s.length === 12) s = "0" + s.slice(2);
  else if (s.startsWith("9") && s.length === 10) s = "0" + s;
  return /^09\d{9}$/.test(s) ? s : null;
}

function hashCode(phone: string, code: string): string {
  return createHash("sha256").update(`${phone}:${code}:${SECRET}`).digest("hex");
}

function codesMatch(phone: string, code: string, storedHash: string): boolean {
  const a = Buffer.from(hashCode(phone, code));
  const b = Buffer.from(storedHash);
  return a.length === b.length && timingSafeEqual(a, b);
}

function generateCode(): string {
  const min = 10 ** (CODE_LENGTH - 1);
  const max = 10 ** CODE_LENGTH;
  return String(randomInt(min, max));
}

/* ---------------------------------------------------------- SMS delivery */

async function sendVerifySms(
  mobile: string,
  code: string
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.SMS_IR_API_KEY;
  const templateId = Number(process.env.SMS_IR_TEMPLATE_ID);
  const paramName = process.env.SMS_IR_PARAM_NAME || "Code";

  if (!apiKey || !Number.isFinite(templateId) || templateId <= 0) {
    return { ok: false, error: "سرویس پیامک پیکربندی نشده است" };
  }

  try {
    const res = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/plain",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        mobile,
        templateId,
        parameters: [{ name: paramName, value: code }],
      }),
      signal: AbortSignal.timeout(10000),
    });
    const json = (await res.json().catch(() => null)) as { status?: number; message?: string } | null;
    if (!res.ok || !json || json.status !== 1) {
      console.error("[OTP] SMS.ir error:", res.status, json);
      return { ok: false, error: json?.message || `خطای سرویس پیامک (${res.status})` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[OTP] SMS.ir request failed:", err);
    return { ok: false, error: "خطا در ارتباط با سرویس پیامک" };
  }
}

/* -------------------------------------------------------------- requests */

export interface RequestOtpResult {
  ok: boolean;
  error?: string;
  cooldown?: number; // seconds until a resend is allowed (on cooldown error)
  devCode?: string; // dev only: the code, when no SMS provider is configured
}

export async function requestOtp(rawPhone: unknown): Promise<RequestOtpResult> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "شماره موبایل معتبر نیست" };

  const now = Date.now();
  const existing = (await readCollection<OtpStore>("otps"))[phone];
  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const cooldown = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
    return { ok: false, error: `تا ${cooldown} ثانیه دیگر می‌توانید کد جدید بگیرید`, cooldown };
  }

  const code = generateCode();
  const isDev = process.env.NODE_ENV !== "production";
  const hasProvider = Boolean(process.env.SMS_IR_API_KEY);
  const send = await sendVerifySms(phone, code);
  // Production must actually deliver the SMS. In dev we continue regardless (the
  // provider may be unreachable, or SMS.ir sandbox mode doesn't deliver a real
  // message) and surface the code so the flow is testable.
  if (!send.ok && !isDev) {
    return { ok: false, error: send.error ?? "ارسال پیامک ناموفق بود" };
  }
  if (isDev) console.warn(`[OTP] code for ${phone}: ${code}${send.ok ? "" : " (SMS not delivered)"}`);

  await updateCollection<OtpStore, void>("otps", (store) => {
    const next: OtpStore = {};
    // Drop expired records while we're here, then write the fresh one.
    for (const [k, v] of Object.entries(store)) if (v.expiresAt > now) next[k] = v;
    next[phone] = {
      codeHash: hashCode(phone, code),
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      lastSentAt: now,
    };
    return { next, result: undefined };
  });

  // Echo the code back to the browser only when there is no SMS provider at all
  // — i.e. nothing could have delivered it. Once SMS_IR_API_KEY is configured the
  // app behaves like production and the code stays server-side (console only),
  // so a misread NODE_ENV can never turn the login form into a code oracle.
  return { ok: true, devCode: isDev && !hasProvider ? code : undefined };
}

export interface VerifyOtpResult {
  ok: boolean;
  phone?: string; // canonical phone on success
  error?: string;
}

export async function verifyOtp(rawPhone: unknown, rawCode: unknown): Promise<VerifyOtpResult> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "شماره موبایل معتبر نیست" };
  const code = toAsciiDigits(String(rawCode ?? "")).replace(/\D/g, "");
  if (!code) return { ok: false, error: "کد تایید را وارد کنید" };

  return updateCollection<OtpStore, VerifyOtpResult>("otps", (store) => {
    const now = Date.now();
    const rec = store[phone];
    if (!rec || rec.expiresAt < now) {
      return { next: store, result: { ok: false, error: "کد منقضی شده است. دوباره درخواست دهید" } };
    }
    if (rec.attempts >= MAX_ATTEMPTS) {
      const next = { ...store };
      delete next[phone];
      return { next, result: { ok: false, error: "تعداد تلاش‌ها زیاد است. دوباره درخواست دهید" } };
    }
    if (!codesMatch(phone, code, rec.codeHash)) {
      const next = { ...store, [phone]: { ...rec, attempts: rec.attempts + 1 } };
      return { next, result: { ok: false, error: "کد تایید نادرست است" } };
    }
    const next = { ...store };
    delete next[phone]; // one-time use
    return { next, result: { ok: true, phone } };
  });
}
