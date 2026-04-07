import Link from "next/link";
import { StatusBadge } from "./status-badge";
import { formatDate, truncate } from "@/lib/utils";

interface Ticket {
  id: string;
  client_name: string;
  wedding_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Kolejność sortowania statusów
const statusOrder: Record<string, number> = {
  new: 0,
  in_progress: 1,
  done: 2,
  sent: 3,
};

export function TeamTicketList({ tickets }: { tickets: Ticket[] }) {
  const sorted = [...tickets].sort((a, b) => {
    const orderDiff = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
    if (orderDiff !== 0) return orderDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (sorted.length === 0) {
    return (
      <div className="py-12 text-center text-[var(--muted-foreground)]">
        Brak zgłoszeń
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((ticket) => (
        <Link
          key={ticket.id}
          href={`/panel/${ticket.id}`}
          className="block border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--gold)]/50"
          style={{ borderRadius: "4px" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-serif text-base text-[var(--foreground)]">
                  {ticket.client_name}
                </h3>
                <StatusBadge status={ticket.status} />
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Ślub: {formatDate(ticket.wedding_date)}
              </p>
            </div>
            <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
              {formatDate(ticket.created_at)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
