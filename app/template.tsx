"use client";

import type { ReactNode } from "react";

// template.tsx re-mounts on every navigation (unlike layout.tsx), so this
// gives a smooth fade-rise transition on each route change. The animation
// itself is defined in globals.css and no-ops under prefers-reduced-motion.
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-page">{children}</div>;
}
