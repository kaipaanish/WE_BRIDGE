"use client";

import { useEffect, useState } from "react";
import type { UserProfile } from "@/lib/types";

// Fetches a short, grounded "here's your situation" brief from /api/brief.
// Entirely optional: if the AI key is missing (204) or the call fails, the
// component renders nothing and the deterministic plan below still guides the
// founder. So a failure here never breaks the dashboard.
export default function DashboardBrief({ profile }: { profile: UserProfile }) {
  const [brief, setBrief] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    })
      .then(async (res) => (res.status === 204 ? null : (await res.json())?.brief))
      .then((text) => {
        if (!cancelled) setBrief(typeof text === "string" ? text : null);
      })
      .catch(() => {
        if (!cancelled) setBrief(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  if (loading) {
    return (
      <div className="glass mt-8 animate-pulse rounded-3xl border border-white/70 p-5 shadow-soft">
        <div className="h-3 w-24 rounded bg-ink/10" />
        <div className="mt-3 h-3 w-full rounded bg-ink/10" />
        <div className="mt-2 h-3 w-4/5 rounded bg-ink/10" />
      </div>
    );
  }

  if (!brief) return null;

  return (
    <div className="animate-fade-up mt-8 rounded-3xl border border-violet/20 bg-gradient-to-br from-fuchsia/10 via-white/70 to-violet/10 p-5 shadow-soft backdrop-blur">
      <p className="text-xs font-bold uppercase tracking-wide text-violet">
        ✨ Your situation
      </p>
      <p className="mt-2 leading-relaxed text-ink/90">{brief}</p>
    </div>
  );
}
