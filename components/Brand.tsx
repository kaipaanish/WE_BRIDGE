// WE-BRIDGE wordmark + a small SVG "bridge-W" mark, in the purple brand.
// This is a clean re-creation; to use the exact logo raster, drop it at
// public/logo.png and swap <BrandMark /> for an <Image />.

export function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden fill="none">
      <defs>
        <linearGradient
          id="wb-grad"
          x1="4"
          y1="8"
          x2="44"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#7c3aed" />
          <stop offset="1" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      {/* Outer W — the "bridge" span */}
      <path
        d="M5 9 L15 39 L24 21 L33 39 L43 9"
        stroke="url(#wb-grad)"
        strokeWidth="6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Inner deep-purple chevron — the layered look of the logo */}
      <path
        d="M15 9 L24 29 L33 9"
        stroke="#241a4d"
        strokeWidth="4.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Brand({
  withTagline = false,
  markClassName,
  className = "",
}: {
  withTagline?: boolean;
  markClassName?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <BrandMark className={markClassName ?? "h-7 w-7"} />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-ink">
          WE<span className="text-violet">-</span>BRIDGE
        </span>
        {withTagline && (
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-ink/50">
            Connecting startups, building futures
          </span>
        )}
      </span>
    </span>
  );
}
