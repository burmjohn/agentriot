"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme } from "./theme-provider";

const cycleOrder = ["system", "light", "dark"] as const;

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleClick = () => {
    const idx = cycleOrder.indexOf(theme);
    const next = cycleOrder[(idx + 1) % cycleOrder.length];
    setTheme(next);
  };

  const label = `Theme: ${theme}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className="inline-flex items-center justify-center rounded-md p-2 text-foreground transition-colors hover:bg-surface focus-visible:outline-focus-cyan"
    >
      {theme === "light" && <Sun className="h-5 w-5" aria-hidden="true" />}
      {theme === "dark" && <Moon className="h-5 w-5" aria-hidden="true" />}
      {theme === "system" && <Monitor className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}

export { ThemeToggle };
