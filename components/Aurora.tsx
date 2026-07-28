"use client";

import { useEffect, useRef } from "react";

// Soft, slowly drifting gradient blobs behind the page — the source of the
// app's bright, airy feel, with a gentle scroll parallax.
//
// Two layers on purpose: the OUTER layer is fixed to the viewport and does the
// clipping (overflow-hidden), so its clip edge always sits at the screen
// boundary. The parallax transform is applied to the INNER layer, so scrolling
// never drags the clip edge into view (which would show a hard line where a
// blurred blob gets cut). All motion is disabled under prefers-reduced-motion.
export default function Aurora() {
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const apply = () => {
      raf = 0;
      const el = inner.current;
      if (el) el.style.transform = `translateY(${window.scrollY * 0.06}px)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    apply();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div ref={inner} className="absolute inset-0 will-change-transform">
        <div className="animate-blob absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-violet/30 blur-3xl" />
        <div
          className="animate-blob absolute top-1/4 -right-40 h-[32rem] w-[32rem] rounded-full bg-fuchsia/25 blur-3xl"
          style={{ animationDelay: "-7s" }}
        />
        <div
          className="animate-blob absolute -bottom-40 left-1/4 h-[30rem] w-[30rem] rounded-full bg-purple/25 blur-3xl"
          style={{ animationDelay: "-13s" }}
        />
      </div>
    </div>
  );
}
