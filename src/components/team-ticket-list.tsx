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

const statusOrder: Record<string, number> = {
  new: 0,
  in_progress: 1,
  done: 2,
  sent: 3,
};

function TicketCard({ ticket }: { ticket: Ticket }) {
  const [status, setStatus] = useState(ticket.status);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleStatusChange(e: React.MouseEvent, newStatus: string) {
    e.preventDefault(); // Nie otwieraj linku
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
      className="block border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[var(--gold)]/50"
      style={{ borderRadius: "4px" }}
    >
      {/* Górna część — imiona + status */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-xl text-[var(--foreground)]">
            {ticket.client_name}
          </h3>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Daty */}
      <div className="mt-3 flex items-center gap-6 text-sm text-[var(--muted-foreground)]">
        <span>Ślub: {formatDate(ticket.wedding_date)}</span>
        <span>Zgłoszono: {formatDate(ticket.created_at)}</span>
      </div>

      {/* Zmiana statusu — przyciski */}
      <div className="mt-4 flex flex-wrap gap-2">
        {["new", "in_progress", "done", "sent"].map((s) => {
          const labels: Record<string, string> = {
            new: "Nowe",
            in_progress: "W trakcie",
            done: "Zrobione",
            sent: "Wysłane",
          };
          const isActive = status === s;
          return (
            <button
              key={s}
              onClick={(e) => handleStatusChange(e, s)}
              disabled={isUpdating || isActive}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[var(--gold)] text-[var(--background)]"
                  : "border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
              } disabled:opacity-50`}
              style={{ borderRadius: "2px" }}
            >
              {labels[s]}
            </button>
          );
        })}
      </div>
    </Link>
  );
}

export function TeamTicketList({ tickets }: { tickets: Ticket[] }) {
  const sorted = [...tickets].sort((a, b) => {
    const orderDiff =
      (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
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
    <div className="space-y-3">
      {sorted.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
