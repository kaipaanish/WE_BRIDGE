"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AskAssistant from "@/components/AskAssistant";
import Aurora from "@/components/Aurora";
import { CategoryPill } from "@/components/SchemeCard";
import StepChecklist from "@/components/StepChecklist";
import { schemes } from "@/lib/data";
import { loadProfile } from "@/lib/profile";
import type { UserProfile } from "@/lib/types";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-3xl border border-white/70 p-6 shadow-soft">
      <h2 className="text-sm font-bold uppercase tracking-wide text-coral">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function SchemeDetailPage() {
  const params = useParams<{ id: string }>();
  const entry = schemes.find((e) => e.id === params.id);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  if (!entry) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="text-center">
          <p className="text-lg font-semibold">Scheme not found.</p>
          <Link
            href="/dashboard"
            className="btn-gradient mt-4 inline-block rounded-full px-6 py-3 font-semibold"
          >
            ← Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const dpiitLocked =
    entry.eligibility.dpiitRequired &&
    profile !== null &&
    !profile.dpiitRecognized;

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8 pb-24">
      <Aurora />
      <div className="animate-fade-up mx-auto flex max-w-3xl flex-col gap-5">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-ink/60 hover:text-ink"
        >
          ← Back to dashboard
        </Link>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CategoryPill category={entry.category} />
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                entry.deadline === "rolling"
                  ? "bg-mint/15 text-emerald-900"
                  : "bg-gold/25 text-ink"
              }`}
            >
              {entry.deadline === "rolling"
                ? "Rolling — apply anytime"
                : `⏰ ${entry.deadline}`}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
            {entry.name}
          </h1>
          <p className="mt-2 text-lg text-ink/70">{entry.oneLiner}</p>
        </div>

        <Section title="In plain language">
          <p className="leading-relaxed">{entry.summary}</p>
        </Section>

        <Section title="Who can apply">
          <p className="leading-relaxed">{entry.eligibilityPlain}</p>
          {entry.eligibility.notes && (
            <p className="mt-2 text-sm text-ink/60">
              {entry.eligibility.notes}
            </p>
          )}
          {dpiitLocked && (
            <p className="mt-3 rounded-xl bg-gold/20 px-4 py-3 text-sm font-medium">
              🔒 This needs DPIIT recognition, which you don&apos;t have yet —{" "}
              <Link
                href="/scheme/get-dpiit-recognised"
                className="text-coral underline"
              >
                here&apos;s how to get it
              </Link>
              .
            </p>
          )}
        </Section>

        <Section title="What you get">
          <p className="leading-relaxed">{entry.benefit}</p>
        </Section>

        <Section title="How to apply — your checklist">
          <StepChecklist schemeId={entry.id} steps={entry.howToApply} />
        </Section>

        <Section title="Documents you'll need">
          <ul className="space-y-2">
            {entry.documentsRequired.map((doc) => (
              <li key={doc} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5">📄</span>
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </Section>

        <a
          href={entry.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gradient block rounded-2xl px-6 py-4 text-center text-lg font-semibold"
        >
          Open the official page ↗
        </a>

        {entry.sourceVerifiedDate === null && (
          <p className="text-center text-xs text-ink/50">
            Figures marked (VERIFY) are pending confirmation against the
            official source — always double-check before applying.
          </p>
        )}

        <Section title="Ask WeBridge AI">
          <p className="mb-4 text-sm text-ink/60">
            Ask anything about this scheme or your situation — answers come
            only from our curated scheme data.
          </p>
          <AskAssistant profile={profile} />
        </Section>
      </div>
    </main>
  );
}
