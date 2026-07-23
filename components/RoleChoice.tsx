"use client";

import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";
import { saveRole } from "@/lib/store";

const ROLES: {
  role: Role;
  path: string;
  icon: string;
  title: string;
  body: string;
  tile: string;
}[] = [
  {
    role: "founder",
    path: "/onboarding",
    icon: "🚀",
    title: "I'm a founder",
    body: "Find the schemes, funding and mentors your startup qualifies for — swipe to build your shortlist.",
    tile: "from-violet to-fuchsia",
  },
  {
    role: "mentor",
    path: "/mentor",
    icon: "🧭",
    title: "I'm a mentor",
    body: "See founders reaching out with their ideas, and reply to the ones you believe in.",
    tile: "from-purple to-violet",
  },
];

export default function RoleChoice() {
  const router = useRouter();

  function choose(role: Role, path: string) {
    saveRole(role);
    router.push(path);
  }

  return (
    <div className="grid w-full max-w-2xl gap-5 sm:grid-cols-2">
      {ROLES.map((r, i) => (
        <button
          key={r.role}
          type="button"
          onClick={() => choose(r.role, r.path)}
          className="animate-fade-up card-hover group rounded-3xl border border-white/70 bg-white/80 p-6 text-left shadow-soft backdrop-blur"
          style={{ animationDelay: `${0.24 + i * 0.08}s` }}
        >
          <div
            className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${r.tile} text-3xl shadow-soft`}
          >
            {r.icon}
          </div>
          <h3 className="mt-4 text-xl font-bold">{r.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{r.body}</p>
          <span className="mt-4 inline-block text-sm font-semibold text-violet transition-transform group-hover:translate-x-1">
            Continue →
          </span>
        </button>
      ))}
    </div>
  );
}
