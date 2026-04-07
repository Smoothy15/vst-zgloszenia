const statusConfig: Record<
  string,
  { label: string; borderColor: string; textColor: string }
> = {
  new: {
    label: "Nowe",
    borderColor: "border-l-[var(--gold)]",
    textColor: "text-[var(--gold)]",
  },
  in_progress: {
    label: "W trakcie",
    borderColor: "border-l-[var(--gold-light)]",
    textColor: "text-[var(--gold-light)]",
  },
  done: {
    label: "Zrobione",
    borderColor: "border-l-[var(--success)]",
    textColor: "text-[var(--success)]",
  },
  sent: {
    label: "Wysłane",
    borderColor: "border-l-[#888888]",
    textColor: "text-[#888888]",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.new;

  return (
    <span
      className={`inline-block border-l-2 ${config.borderColor} ${config.textColor} bg-[var(--bg-card,#161616)] px-3 py-1 text-xs font-medium`}
      style={{ borderRadius: "2px" }}
    >
      {config.label}
    </span>
  );
}
