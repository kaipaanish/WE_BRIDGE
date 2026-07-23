"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// The ranked-grid dashboard was replaced by the swipe deck (/swipe) and the
// shortlist summary (/summary) in v2. Keep this path working for old links.
export default function DashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/summary");
  }, [router]);
  return (
    <main className="grid min-h-screen place-items-center">
      <p className="text-ink/50">Taking you to your shortlist…</p>
    </main>
  );
}
