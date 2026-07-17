import Link from "next/link";
import type { Category, Entry } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";

const PILL_STYLES: Record<Category, string> = {
  recognition: "bg-blue-100 text-blue-900",
  benefit: "bg-emerald-100 text-emerald-900",
  funding: "bg-amber-100 text-amber-900",
  incubator: "bg-violet-100 text-violet-900",
  competition: "bg-rose-100 text-rose-900",
  process: "bg-sky-100 text-sky-900",
  compliance: "bg-slate-200 text-slate-800",
};

export function CategoryPill({ category }: { category: Category }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${PILL_STYLES[category]}`}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}

export default function SchemeCard({
  entry,
  locked = false,
  reasons = [],
}: {
  entry: Entry;
  locked?: boolean;
  reasons?: string[];
}) {
  return (
    <Link
      href={`/scheme/${entry.id}`}
      className={`card-hover group flex flex-col rounded-3xl border bg-white/85 p-5 shadow-soft backdrop-blur ${
        locked ? "border-gold/50" : "border-white/70"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <CategoryPill category={entry.category} />
        {locked && (
          <span className="inline-block rounded-full bg-gold/20 px-3 py-1 text-xs font-medium text-ink">
            🔒 Unlocks after DPIIT recognition
          </span>
        )}
      </div>
      <h3 className="mt-3 font-bold leading-snug transition-colors group-hover:text-coral">
        {entry.name}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
        {entry.oneLiner}
      </p>
      {reasons.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {reasons.slice(0, 3).map((reason) => (
            <li
              key={reason}
              className="rounded-full bg-coral/10 px-2.5 py-1 text-[11px] font-medium text-coral"
            >
              {reason}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex items-center justify-between pt-4 text-xs">
        <span className="text-ink/50">
          {entry.deadline === "rolling"
            ? "Rolling — apply anytime"
            : "⏰ Deadline applies"}
        </span>
        <span className="font-semibold text-coral">View →</span>
      </div>
    </Link>
  );
}
