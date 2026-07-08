"use client";

export default function HeroBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none grayscale-0 dark:grayscale dark:opacity-40 opacity-25"
      style={{
        backgroundImage: `url('/images/doodle-pattern.png')`,
        backgroundRepeat: "repeat",
        backgroundSize: "300px",
        maskImage: "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
      }}
      aria-hidden="true"
    />
  );
}
