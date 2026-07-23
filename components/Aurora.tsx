"use client";

import { useEffect, useRef } from "react";

// Soft, slowly drifting gradient blobs behind the page — the source of the
// app's bright, airy feel. It also parallax-shifts gently with scroll (both
// directions) for a fluid sense of depth. Purely decorative; sits below all
// content. All motion is disabled under prefers-reduced-motion.
export default function Aurora() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const apply = () => {
      raf = 0;
      const el = ref.current;
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
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden will-change-transform"
    >
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
  );
}
