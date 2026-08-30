"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toPersianNumber } from "@/app/utils/numbers";

/**
 * Product gallery: a hover magnifier over the main photo, and a full-screen
 * lightbox with its own thumbnail rail.
 *
 * The fiddly part is the lens maths. The photo is `object-contain`, so the
 * pixels the shopper sees do NOT fill the frame — there is padding, and then
 * letterboxing inside what is left. Magnifying against the frame's rectangle
 * would drift further off-target the more the aspect ratios differ, so the
 * rendered image rectangle is derived from the natural dimensions instead.
 */

/** How much bigger the lens shows the photo. */
const ZOOM = 2.6;
/** Lens diameter in px. */
const LENS = 190;

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Where the photo actually lands inside its padded frame, under object-contain. */
function containedRect(frame: DOMRect, padding: number, natW: number, natH: number): Rect | null {
  const boxW = frame.width - padding * 2;
  const boxH = frame.height - padding * 2;
  if (boxW <= 0 || boxH <= 0 || !natW || !natH) return null;
  const scale = Math.min(boxW / natW, boxH / natH);
  const width = natW * scale;
  const height = natH * scale;
  return {
    left: padding + (boxW - width) / 2,
    top: padding + (boxH - height) / 2,
    width,
    height,
  };
}

export default function ProductGallery({
  images,
  alt,
  badge,
}: {
  images: string[];
  alt: string;
  /** Optional corner ribbon, e.g. a discount percentage. */
  badge?: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);

  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  /**
   * Where the photo sits inside its frame. State rather than a ref: the render
   * below reads it to place the lens, and reading a ref during render is both a
   * React rule violation and a real staleness hazard.
   */
  const [geom, setGeom] = useState<Rect | null>(null);

  const src = images[Math.min(index, images.length - 1)];

  const clamp = useCallback(
    (i: number) => ((i % images.length) + images.length) % images.length,
    [images.length]
  );

  // Recompute on enter and on load: layout may have changed since last time.
  // Returns the value as well as storing it, so a caller in the same tick can
  // use it without waiting for the state update.
  const measure = useCallback((): Rect | null => {
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!frame || !img) return null;
    const r = containedRect(
      frame.getBoundingClientRect(),
      16, // matches p-4 on the <img>
      img.naturalWidth,
      img.naturalHeight
    );
    setGeom(r);
    return r;
  }, []);

  // A resize invalidates the measurement; clear it so the next hover re-measures.
  useEffect(() => {
    const onResize = () => setGeom(null);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const frame = frameRef.current;
    if (!frame) return;
    const g = geom ?? measure();
    if (!g) return;

    const r = frame.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    // Outside the photo itself (in the letterbox or padding) there is nothing
    // to magnify — hide the lens rather than show blank canvas.
    if (x < g.left || x > g.left + g.width || y < g.top || y > g.top + g.height) {
      setLens(null);
      return;
    }
    setLens({ x, y });
  }

  // Keyboard control for the lightbox, and a body scroll lock while it is open.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      // RTL: ArrowLeft advances, matching the on-screen arrow positions.
      if (e.key === "ArrowLeft") setIndex((i) => clamp(i + 1));
      if (e.key === "ArrowRight") setIndex((i) => clamp(i - 1));
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, clamp]);

  const g = geom;
  // Background offset that puts the hovered point at the centre of the lens.
  const lensStyle =
    lens && g
      ? {
          left: lens.x - LENS / 2,
          top: lens.y - LENS / 2,
          backgroundImage: `url(${src})`,
          backgroundSize: `${g.width * ZOOM}px ${g.height * ZOOM}px`,
          backgroundPosition: `${-((lens.x - g.left) * ZOOM - LENS / 2)}px ${-((lens.y - g.top) * ZOOM - LENS / 2)}px`,
        }
      : undefined;

  return (
    <div>
      {/* ------------------------------------------------------ main photo */}
      <div
        ref={frameRef}
        onMouseEnter={measure}
        onMouseMove={onMove}
        onMouseLeave={() => setLens(null)}
        onClick={() => setLightbox(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setLightbox(true);
          }
        }}
        aria-label="بزرگ‌نمایی تصویر محصول"
        className="group relative h-64 sm:h-80 md:h-auto md:aspect-[4/3] md:min-h-96 w-full cursor-zoom-in overflow-hidden rounded-2xl bg-product-canvas mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={measure}
          className="h-full w-full object-contain p-4"
        />

        {badge}

        {/* The lens. Pointer-events off so it never interrupts the tracking. */}
        {lensStyle && (
          <span
            aria-hidden
            style={{ ...lensStyle, width: LENS, height: LENS }}
            className="pointer-events-none absolute z-20 rounded-full border-2 border-white bg-product-canvas bg-no-repeat shadow-[0_8px_30px_rgb(0_0_0/0.25)] ring-1 ring-black/10"
          />
        )}

        {/* Affordance — only where a cursor exists to hover with. */}
        <span className="pointer-events-none absolute bottom-3 left-3 z-10 hidden items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 [@media(hover:hover)]:flex">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
          برای نمای کامل کلیک کنید
        </span>
      </div>

      {/* ------------------------------------------------------ thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-1">
          {images.map((image, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`تصویر ${toPersianNumber(i + 1)}`}
              aria-current={index === i}
              className={`shrink-0 h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-xl border-2 bg-product-canvas transition-colors ${
                index === i ? "border-primary ring-2 ring-primary" : "border-border hover:border-border-strong"
              }`}
            >
              <img src={image} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}

      {/* -------------------------------------------------------- lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-black/92 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="نمای کامل تصویر محصول"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white sm:px-6">
            <span className="text-sm font-bold">
              {toPersianNumber(index + 1)} از {toPersianNumber(images.length)}
            </span>
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label="بستن"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Clicking the backdrop closes; clicking the photo does not. */}
          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-2 sm:px-16"
            onClick={() => setLightbox(false)}
          >
            <img
              src={src}
              alt={alt}
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full object-contain"
            />

            {images.length > 1 && (
              <>
                {/* RTL: "previous" sits on the right. */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(clamp(index - 1));
                  }}
                  aria-label="تصویر قبلی"
                  className="absolute right-2 sm:right-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(clamp(index + 1));
                  }}
                  aria-label="تصویر بعدی"
                  className="absolute left-2 sm:left-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar px-4 py-4">
              {images.map((image, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`تصویر ${toPersianNumber(i + 1)}`}
                  aria-current={index === i}
                  className={`shrink-0 h-16 w-16 overflow-hidden rounded-xl border-2 bg-product-canvas transition-all ${
                    index === i
                      ? "border-primary opacity-100"
                      : "border-transparent opacity-55 hover:opacity-90"
                  }`}
                >
                  <img src={image} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
