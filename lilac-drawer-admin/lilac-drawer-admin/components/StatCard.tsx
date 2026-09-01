export default function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold text-tan uppercase tracking-wide">{label}</p>
      <p className="font-heading text-3xl text-purple-deep mt-1.5">{value}</p>
      {hint && <p className="text-xs text-tan-dark mt-1">{hint}</p>}
    </div>
  );
}
