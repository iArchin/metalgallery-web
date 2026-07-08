"use client";

/**
 * Light/dark theme switch. The current state lives on <html data-theme> and is
 * persisted to localStorage. Which icon shows is driven purely by the `dark:`
 * CSS variant, so there is no React state and therefore no hydration mismatch.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const toggle = () => {
    const d = document.documentElement;
    const next = d.getAttribute("data-theme") === "dark" ? "light" : "dark";
    d.classList.add("theme-transition");
    d.setAttribute("data-theme", next);
    d.style.colorScheme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    window.setTimeout(() => d.classList.remove("theme-transition"), 350);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="تغییر حالت روشن و تاریک"
      title="تغییر تم"
      className={`group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-2 text-content hover:border-primary hover:text-primary transition-colors ${className}`}
    >
      {/* Moon — shown in light mode (click to go dark) */}
      <svg
        className="w-5 h-5 dark:hidden"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
      {/* Sun — shown in dark mode (click to go light) */}
      <svg
        className="w-5 h-5 hidden dark:block"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    </button>
  );
}
