import Aurora from "@/components/Aurora";
import Brand from "@/components/Brand";
import RoleChoice from "@/components/RoleChoice";

const FEATURES = [
  {
    title: "Swipe to shortlist",
    body: "Go category by category — recognition, funding, incubators and more — and swipe right on what fits. We remember your picks.",
    icon: "💜",
    tile: "from-violet to-fuchsia",
  },
  {
    title: "Plain-language guides",
    body: "Every scheme explained without jargon — who can apply, what you get, and a step-by-step checklist to act on it.",
    icon: "📋",
    tile: "from-purple to-violet",
  },
  {
    title: "Meet a mentor",
    body: "Get matched to mentors who fit your sector and stage, pitch your idea in 400 words, and hear back from the ones who love it.",
    icon: "🤝",
    tile: "from-fuchsia to-purple",
  },
];

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <Aurora />

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Brand withTagline />
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center md:py-20">
        <span className="animate-fade-up glass mb-7 inline-flex items-center gap-2 rounded-full border border-white/60 px-4 py-1.5 text-sm font-medium text-ink/70 shadow-soft">
          <span className="h-2 w-2 rounded-full bg-mint" />
          For early-stage Indian founders & the mentors who back them
        </span>

        <h1
          className="animate-fade-up max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight md:text-6xl"
          style={{ animationDelay: "0.06s" }}
        >
          Connecting startups,{" "}
          <span className="gradient-text">building futures.</span>
        </h1>

        <p
          className="animate-fade-up mt-6 max-w-xl text-lg text-ink/70"
          style={{ animationDelay: "0.12s" }}
        >
          Match to the government schemes, funding and support your startup
          qualifies for — then to the mentors who can help you win them.
        </p>

        <p
          className="animate-fade-up mt-10 text-sm font-semibold uppercase tracking-wide text-ink/50"
          style={{ animationDelay: "0.16s" }}
        >
          How do you want to start?
        </p>
        <div className="mt-4 flex w-full justify-center">
          <RoleChoice />
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="animate-fade-up card-hover rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur"
              style={{ animationDelay: `${0.3 + i * 0.08}s` }}
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
