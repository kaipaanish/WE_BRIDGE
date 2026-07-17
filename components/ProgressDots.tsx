export default function ProgressDots({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-2.5 rounded-full transition-all duration-300 ${
            i === current
              ? "w-8 bg-gradient-to-r from-coral to-pink"
              : i < current
                ? "w-2.5 bg-coral/50"
                : "w-2.5 bg-ink/15"
          }`}
        />
      ))}
    </div>
  );
}
