export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm text-slate-400">{description}</p>
    </div>
  );
}
