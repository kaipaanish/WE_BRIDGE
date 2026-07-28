"use client";

// Renders the WEBRIDGE logo. It prefers the exact raster at /public/logo.png
// if present, and otherwise falls back to the vector recreation at
// /public/logo.svg. So dropping the original logo.png into /public swaps the
// real logo in with no code change.
export default function Brand({
  className = "h-11",
  withTagline = false,
}: {
  className?: string;
  withTagline?: boolean;
}) {
  return (
    <span className="inline-flex flex-col items-start gap-1.5">
      {/* Solid-white chip so the logo's pale-lilac strokes stay legible on the
          light, purple-tinted page background instead of blending in. */}
      <span className="inline-flex items-center rounded-2xl bg-white px-3.5 py-2 shadow-soft ring-1 ring-ink/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="WEBRIDGE"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.dataset.fallback !== "1") {
              img.dataset.fallback = "1";
              img.src = "/logo.svg";
            }
          }}
          className={`${className} w-auto`}
        />
      </span>
      {withTagline && (
        <span className="pl-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/50">
          Connecting startups, building futures
        </span>
      )}
    </span>
  );
}
