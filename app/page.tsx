import Link from "next/link";
import Aurora from "@/components/Aurora";

const FEATURES = [
  {
    title: "Personalised matches",
    body: "Answer a few quick questions and see only the schemes, funding and benefits your startup actually qualifies for.",
    icon: "🎯",
    tile: "from-coral to-pink",
  },
  {
    title: "Plain-language guides",
    body: "Every scheme explained without jargon — who can apply, what you get, and a step-by-step checklist to act on it.",
    icon: "📋",
    tile: "from-violet to-[#a855f7]",
  },
  {
    title: "Ask WeBridge AI",
    body: "Ask questions in your own words and get answers grounded only in verified scheme data, with official links.",
    icon: "💬",
    tile: "from-gold to-coral",
  },
];

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <Aurora />

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-lg font-extrabold tracking-tight">
          🧭 WeBridge
        </span>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-ink/60 transition-colors hover:text-ink"
        >
          I already have a profile →
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center md:py-24">
        <span className="animate-fade-up glass mb-7 inline-flex items-center gap-2 rounded-full border border-white/60 px-4 py-1.5 text-sm font-medium text-ink/70 shadow-soft">
          <span className="h-2 w-2 rounded-full bg-mint" />
          For early-stage Indian founders
        </span>

        <h1
          className="animate-fade-up max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight md:text-6xl"
          style={{ animationDelay: "0.06s" }}
        >
          Every scheme your startup qualifies for,{" "}
          <span className="gradient-text">in one place.</span>
        </h1>

        <p
          className="animate-fade-up mt-6 max-w-xl text-lg text-ink/70"
          style={{ animationDelay: "0.12s" }}
        >
          Government schemes, funding, incubators, competitions and compliance —
          matched to your startup and explained in plain language.
        </p>

        <div
          className="animate-fade-up mt-10 flex flex-col items-center gap-4"
          style={{ animationDelay: "0.18s" }}
        >
          <Link
            href="/onboarding"
            className="btn-gradient rounded-full px-10 py-4 text-lg font-semibold"
          >
            Get started — it's free
          </Link>
          <p className="text-sm text-ink/50">
            Free · No signup · Takes 2 minutes
          </p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="animate-fade-up card-hover rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur"
              style={{ animationDelay: `${0.24 + i * 0.08}s` }}
            >
              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${f.tile} text-2xl shadow-soft`}
              >
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                {f.body}
              </p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-5xl text-center text-xs text-ink/50">
          Scheme details are curated summaries — always confirm on the official
          source linked with each scheme before applying.
        </p>
      </section>
    </main>
  );
}
