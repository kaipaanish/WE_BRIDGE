"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { CategoryPill } from "@/components/SchemeCard";
import type { Entry } from "@/lib/types";

export interface SwipeCardHandle {
  swipe: (dir: "left" | "right") => void;
}

const THRESHOLD = 110; // px of horizontal drag to count as a decision

const SwipeCard = forwardRef<
  SwipeCardHandle,
  {
    entry: Entry;
    locked: boolean;
    onDecide: (dir: "left" | "right") => void;
  }
>(function SwipeCard({ entry, locked, onDecide }, ref) {
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<null | "left" | "right">(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const decided = useRef(false);

  // Fires onDecide exactly once for this card, whatever path triggers it.
  function fire(dir: "left" | "right") {
    if (decided.current) return;
    decided.current = true;
    onDecide(dir);
  }

  // Fallback: normally the fly-out transition's onTransitionEnd calls fire(),
  // but if the transform doesn't actually transition (e.g. a keypress set exit
  // while a drag had transitions disabled), this timer guarantees the decision
  // still lands. `decided` keeps it single-fire.
  useEffect(() => {
    if (!exit) return;
    const t = setTimeout(() => fire(exit), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exit]);

  useImperativeHandle(ref, () => ({
    swipe: (dir) => {
      // Ignore while a pointer drag is active — committing an exit then would
      // disable the transition and could strand the card.
      if (!exit && !dragging) setExit(dir);
    },
  }));

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (exit) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging || !start.current) return;
    setDx(e.clientX - start.current.x);
    setDy(e.clientY - start.current.y);
  }

  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    start.current = null;
    if (dx > THRESHOLD) setExit("right");
    else if (dx < -THRESHOLD) setExit("left");
    else {
      setDx(0);
      setDy(0);
    }
  }

  function onTransitionEnd() {
    if (exit) fire(exit);
  }

  const flyX = exit === "left" ? -700 : exit === "right" ? 700 : dx;
  const rotate = exit
    ? (exit === "left" ? -1 : 1) * 16
    : dx * 0.05;
  const likeOpacity = Math.min(Math.max(dx / THRESHOLD, 0), 1);
  const nopeOpacity = Math.min(Math.max(-dx / THRESHOLD, 0), 1);

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onTransitionEnd={onTransitionEnd}
      style={{
        transform: `translate(${flyX}px, ${exit ? dy - 30 : dy}px) rotate(${rotate}deg)`,
        transition: dragging ? "none" : "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        touchAction: "none",
      }}
      className={`relative flex h-[62vh] max-h-[560px] cursor-grab select-none flex-col overflow-hidden rounded-[2rem] border bg-white/90 p-6 shadow-soft backdrop-blur active:cursor-grabbing ${
        locked ? "border-gold/50" : "border-white/70"
      }`}
    >
      {/* LIKE / NOPE stamps */}
      <span
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute right-6 top-6 z-10 -rotate-12 rounded-xl border-4 border-mint px-3 py-1 text-2xl font-black uppercase tracking-wider text-mint"
      >
        Save
      </span>
      <span
        style={{ opacity: nopeOpacity }}
        className="pointer-events-none absolute left-6 top-6 z-10 rotate-12 rounded-xl border-4 border-rose-500 px-3 py-1 text-2xl font-black uppercase tracking-wider text-rose-500"
      >
        Skip
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <CategoryPill category={entry.category} />
        {locked && (
          <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-medium text-ink">
            🔒 Unlocks after DPIIT
          </span>
        )}
        <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-medium text-ink/60">
          {entry.deadline === "rolling" ? "Rolling" : "⏰ Deadline"}
        </span>
      </div>

      <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">
        {entry.name}
      </h2>
      <p className="mt-2 text-ink/70">{entry.oneLiner}</p>

      <div className="mt-5 rounded-2xl bg-violet/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-violet">
          What you get
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink/80">
          {entry.benefit}
        </p>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink/60">
        {entry.summary}
      </p>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
        {entry.eligibility.dpiitRequired && (
          <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink/60">
            Needs DPIIT
          </span>
        )}
        {entry.tags.slice(0, 3).map((t) => (
          <span
            key={t}
            className="rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink/60"
          >
            #{t}
          </span>
        ))}
      </div>
    </div>
  );
});

export default SwipeCard;
