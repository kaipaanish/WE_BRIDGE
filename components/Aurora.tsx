// Soft, slowly drifting gradient blobs behind the page — the source of the
// app's bright, airy feel. Purely decorative and non-interactive; sits on its
// own layer below all content. Motion is disabled under prefers-reduced-motion.
export default function Aurora() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="animate-blob absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-coral/30 blur-3xl" />
      <div
        className="animate-blob absolute top-1/4 -right-40 h-[32rem] w-[32rem] rounded-full bg-violet/25 blur-3xl"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="animate-blob absolute -bottom-40 left-1/4 h-[30rem] w-[30rem] rounded-full bg-gold/25 blur-3xl"
        style={{ animationDelay: "-13s" }}
      />
    </div>
  );
}
