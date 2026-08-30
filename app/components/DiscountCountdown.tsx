"use client";

import { useEffect, useState } from "react";
import { toPersianNumber } from "@/app/utils/numbers";

/**
 * A circular countdown to the end of a product's discount.
 *
 * Renders nothing until mounted. The server cannot know the visitor's clock, so
 * rendering a live remaining time during SSR would guarantee a hydration
 * mismatch — and a countdown that flickers to a different number on load looks
 * broken. Once mounted it ticks every second.
 *
 * When the deadline passes it disappears rather than sitting at zero. The
 * surrounding discount presentation is gated on the same deadline server-side,
 * so an expired offer stops being advertised everywhere at once.
 */

interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function remaining(endsAt: string): Parts {
  const total = Math.max(0, Date.parse(endsAt) - Date.now());
  const s = Math.floor(total / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    total,
  };
}

export default function DiscountCountdown({
  endsAt,
  size = "md",
}: {
  endsAt: string;
  /** `sm` for a product card, `md` for the detail page. */
  size?: "sm" | "md";
}) {
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    const tick = () => setParts(remaining(endsAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!parts || parts.total <= 0) return null;

  const { days, hours, minutes, seconds } = parts;
  // The biggest unit still worth showing, plus the one below it: "۲ روز" reads
  // better than a six-digit clock on a product card, and seconds only matter
  // once they are all that is left.
  const big = days > 0 ? days : hours > 0 ? hours : minutes > 0 ? minutes : seconds;
  const bigLabel = days > 0 ? "روز" : hours > 0 ? "ساعت" : minutes > 0 ? "دقیقه" : "ثانیه";
  const small =
    days > 0
      ? `${toPersianNumber(hours)} ساعت`
      : hours > 0
        ? `${toPersianNumber(minutes)} دقیقه`
        : `${toPersianNumber(seconds)} ثانیه`;

  // The ring drains over whichever unit is currently counting down, so it
  // always visibly moves rather than sitting still for hours on a long offer.
  const fraction =
    days > 0
      ? (hours * 3600 + minutes * 60 + seconds) / 86400
      : hours > 0
        ? (minutes * 60 + seconds) / 3600
        : minutes > 0
          ? seconds / 60
          : seconds / 60;

  const px = size === "sm" ? 62 : 88;
  const stroke = size === "sm" ? 4 : 5;
  const r = (px - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const urgent = parts.total < 60 * 60 * 1000; // under an hour

  return (
    <div
      className="relative shrink-0"
      style={{ width: px, height: px }}
      role="timer"
      aria-label={`پایان تخفیف تا ${toPersianNumber(big)} ${bigLabel}`}
    >
      <svg width={px} height={px} className="-rotate-90" aria-hidden>
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-border"
        />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className={urgent ? "stroke-primary" : "stroke-primary/70"}
          style={{ transition: "stroke-dashoffset 0.9s linear" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          className={`font-extrabold tabular-nums ${
            size === "sm" ? "text-base" : "text-2xl"
          } ${urgent ? "text-primary" : "text-content"}`}
        >
          {toPersianNumber(big)}
        </span>
        <span
          className={`mt-0.5 font-bold text-content-muted ${
            size === "sm" ? "text-[9px]" : "text-[11px]"
          }`}
        >
          {bigLabel}
        </span>
        {size === "md" && (
          <span className="mt-0.5 text-[10px] text-content-subtle">{small}</span>
        )}
      </div>
    </div>
  );
}
