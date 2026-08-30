"use client";

/**
 * Light/dark theme switch. The current state lives on <html data-theme> and is
 * persisted to localStorage. Which icon shows is driven purely by the `dark:`
 * CSS variant, so there is no React state and therefore no hydration mismatch.
 *
 * At rest the button shows the theme you are in; hovering crossfades to the one
 * you would switch to, so the control previews its own effect.
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
      {/*
        Two icons stacked in the same 20px box, crossfading on hover.

        At rest the button shows the theme you are IN; on hover it swaps to the
        one you would switch TO, so the control previews its own result. The
        pair rotates through each other rather than blinking, which also gives
        the sun somewhere to travel from.

        Still driven entirely by the `dark:` variant — which this project maps
        to [data-theme] — so there is no React state here and therefore no
        hydration mismatch, exactly as before.
      */}
      <span className="relative block h-5 w-5">
        {/* Sun — the light-mode resting face, and the dark-mode hover face. */}
        <svg
          className="absolute inset-0 h-5 w-5 transition-all duration-300 ease-out
                     opacity-100 rotate-0 scale-100
                     group-hover:opacity-0 group-hover:-rotate-90 group-hover:scale-75
                     dark:opacity-0 dark:rotate-90 dark:scale-75
                     dark:group-hover:opacity-100 dark:group-hover:rotate-0 dark:group-hover:scale-100"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        {/* Moon — the light-mode hover face, and the dark-mode resting face. */}
        <svg
          className="absolute inset-0 h-5 w-5 transition-all duration-300 ease-out
                     opacity-0 rotate-90 scale-75
                     group-hover:opacity-100 group-hover:rotate-0 group-hover:scale-100
                     dark:opacity-100 dark:rotate-0 dark:scale-100
                     dark:group-hover:opacity-0 dark:group-hover:-rotate-90 dark:group-hover:scale-75"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </span>
    </button>
  );
}
