"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "./status-badge";
import { formatDate } from "@/lib/utils";

interface Ticket {
  id: string;
  client_name: string;
  wedding_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<string, string> = {
  all: "Wszystkie",
  new: "Nowe",
  in_progress: "W trakcie",
  done: "Zrobione",
  sent: "Wysłane",
};

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const [status, setStatus] = useState(ticket.status);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleStatusChange(e: React.MouseEvent, newStatus: string) {
    e.preventDefault();
    e.stopPropagation();
    setIsUpdating(true);
    try {
      const res = await fetch("/api/tickets/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id, status: newStatus }),
      });
      if (res.ok) setStatus(newStatus);
    } catch {
      // ignore
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Link
      href={`/panel/${ticket.id}`}
      className="block border border-[var(--border)] bg-[var(--card)] p-6 transition-colors hover:border-[var(--gold)]/50"
      style={{ borderRadius: "4px" }}
    >
      {/* Górna część — imiona + status */}
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-serif text-2xl text-[var(--foreground)]">
          {ticket.client_name}
        </h3>
        <StatusBadge status={status} />
      </div>

      {/* Daty */}
      <div className="mt-3 flex flex-col gap-1 text-base text-[var(--muted-foreground)] sm:flex-row sm:gap-6">
        <span>Ślub: {formatDate(ticket.wedding_date)}</span>
        <span>Zgłoszono: {formatDateTime(ticket.created_at)}</span>
      </div>

      {/* Zmiana statusu — przyciski */}
      <div className="mt-4 flex flex-wrap gap-2">
        {["new", "in_progress", "done", "sent"].map((s) => {
          const isActive = status === s;
          return (
            <button
              key={s}
              onClick={(e) => handleStatusChange(e, s)}
              disabled={isUpdating || isActive}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--gold)] text-[var(--background)]"
                  : "border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
              } disabled:opacity-50`}
              style={{ borderRadius: "2px" }}
            >
              {statusLabels[s]}
            </button>
          );
        })}
      </div>
    </Link>
  );
}

export function TeamTicketList({ tickets }: { tickets: Ticket[] }) {
  const [filter, setFilter] = useState("all");

  // Najnowsze na górze
  const sorted = [...tickets].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const filtered =
    filter === "all" ? sorted : sorted.filter((t) => t.status === filter);

  // Liczniki do filtrów
  const counts: Record<string, number> = { all: tickets.length };
  for (const t of tickets) {
    counts[t.status] = (counts[t.status] || 0) + 1;
  }

  return (
    <div>
      {/* Filtry */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["all", "new", "in_progress", "done", "sent"].map((s) => {
          const isActive = filter === s;
          const count = counts[s] || 0;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--gold)] text-[var(--background)]"
                  : "border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
              }`}
              style={{ borderRadius: "2px" }}
            >
              {statusLabels[s]} ({count})
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-lg text-[var(--muted-foreground)]">
          Brak zgłoszeń
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}
