"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { FaMoon, FaSun } from "react-icons/fa";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10 rounded-full"></div>;
  }

  return (
    <button
      className="paper-btn w-10 h-10 flex items-center justify-center !p-0 text-[var(--ink-soft)] hover:text-[var(--ink)] dark:text-[var(--ink-dark-soft)] dark:hover:text-[var(--ink-dark)]"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Toggle Theme"
      title="Toggle Theme"
    >
      {theme === "light" ? <FaMoon size={18} /> : <FaSun size={18} />}
    </button>
  );
}
