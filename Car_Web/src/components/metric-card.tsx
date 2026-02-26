type MetricCardProps = {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
};

export function MetricCard({ label, value, tone = "default" }: MetricCardProps) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50"
        : "border-slate-200 bg-white";

  return (
    <article className={`rounded-xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </article>
  );
}
