import Link from "next/link";
import type { PlanStep } from "@/lib/types";

const STATUS_STYLES: Record<PlanStep["status"], { badge: string; label: string }> = {
  now: { badge: "bg-emerald-100 text-emerald-900", label: "Do now" },
  next: { badge: "bg-sky-100 text-sky-900", label: "Next" },
  locked: { badge: "bg-gold/25 text-ink", label: "Unlocks later" },
};

export default function ActionPlan({ steps }: { steps: PlanStep[] }) {
  if (steps.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold">Your next steps</h2>
      <p className="mt-1 text-sm text-ink/60">
        The order that actually unlocks everything else.
      </p>

      <ol className="mt-5 space-y-3">
        {steps.map((step, i) => {
          const style = STATUS_STYLES[step.status];
          const Inner = (
            <div
              className={`flex gap-4 rounded-3xl border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur ${
                step.entryId ? "card-hover" : ""
              }`}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-coral to-pink text-sm font-bold text-white shadow-soft">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold leading-snug">{step.title}</h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${style.badge}`}
                  >
                    {style.label}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink/70">
                  {step.detail}
                </p>
                {step.entryId && (
                  <span className="mt-2 inline-block text-xs font-semibold text-coral">
                    See how →
                  </span>
                )}
              </div>
            </div>
          );

          return (
            <li key={`${step.title}-${i}`}>
              {step.entryId ? (
                <Link href={`/scheme/${step.entryId}`} className="block">
                  {Inner}
                </Link>
              ) : (
                Inner
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
