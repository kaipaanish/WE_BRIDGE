"use client";

import { useEffect, useState } from "react";

export default function StepChecklist({
  schemeId,
  steps,
}: {
  schemeId: string;
  steps: string[];
}) {
  const storageKey = `startup-navigator-steps-${schemeId}`;
  const [done, setDone] = useState<boolean[]>(() => steps.map(() => false));

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved)) {
          setDone(steps.map((_, i) => Boolean(saved[i])));
        }
      }
    } catch {
      // ignore — checklist just starts unticked
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function toggle(index: number) {
    const next = done.map((d, i) => (i === index ? !d : d));
    setDone(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  const completed = done.filter(Boolean).length;

  return (
    <div>
      <p className="mb-3 text-sm text-ink/60">
        {completed} of {steps.length} steps done
        {completed === steps.length && steps.length > 0 && " 🎉"}
      </p>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                done[i]
                  ? "border-emerald-200 bg-emerald-50 text-ink/60"
                  : "border-navy/10 bg-white hover:border-navy/30"
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  done[i]
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-navy/30 text-ink/50"
                }`}
              >
                {done[i] ? "✓" : i + 1}
              </span>
              <span className={done[i] ? "line-through" : ""}>{step}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
