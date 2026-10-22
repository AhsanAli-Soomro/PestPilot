"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-muted-foreground opacity-50" />
    );
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={`Toggle theme (currently ${theme})`}
      className="w-10 h-10 rounded-lg border border-border bg-card hover:bg-muted/60 transition-colors flex items-center justify-center text-foreground touch-target shadow-sm"
      title={`Current theme: ${theme}. Click to switch.`}
    >
      {theme === "dark" && <Moon className="w-5 h-5 text-amber-400" />}
      {theme === "light" && <Sun className="w-5 h-5 text-amber-600" />}
      {theme === "system" && <Laptop className="w-5 h-5 text-primary" />}
    </button>
  );
}

