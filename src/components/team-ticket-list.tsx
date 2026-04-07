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

function TicketCard({
  ticket,
  onArchive,
}: {
  ticket: Ticket;
  onArchive: (id: string) => void;
}) {
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
      if (res.ok) {
        if (newStatus === "archived") {
          onArchive(ticket.id);
        } else {
          setStatus(newStatus);
        }
      }
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
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-serif text-2xl text-[var(--foreground)]">
          {ticket.client_name}
        </h3>
        <StatusBadge status={status} />
      </div>

      <div className="mt-3 flex flex-col gap-1 text-base text-[var(--muted-foreground)] sm:flex-row sm:gap-6">
        <span>Ślub: {formatDate(ticket.wedding_date)}</span>
        <span>Zgłoszono: {formatDateTime(ticket.created_at)}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
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

        {/* Separator + archiwizuj */}
        <span className="mx-1 text-[var(--border)]">|</span>
        <button
          onClick={(e) => handleStatusChange(e, "archived")}
          disabled={isUpdating}
          className="px-4 py-1.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--destructive)] disabled:opacity-50"
        >
          Archiwizuj
        </button>
      </div>
    </Link>
  );
}

function ArchivedCard({
  ticket,
  onRestore,
}: {
  ticket: Ticket;
  onRestore: (id: string) => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleRestore(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsUpdating(true);
    try {
      const res = await fetch("/api/tickets/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id, status: "new" }),
      });
      if (res.ok) onRestore(ticket.id);
    } catch {
      // ignore
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Link
      href={`/panel/${ticket.id}`}
      className="block border border-[var(--border)] bg-[var(--card)] p-5 opacity-60 transition-colors hover:border-[var(--gold)]/30 hover:opacity-80"
      style={{ borderRadius: "4px" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl text-[var(--foreground)]">
            {ticket.client_name}
          </h3>
          <div className="mt-1 flex flex-col gap-1 text-sm text-[var(--muted-foreground)] sm:flex-row sm:gap-4">
            <span>Ślub: {formatDate(ticket.wedding_date)}</span>
            <span>Zgłoszono: {formatDateTime(ticket.created_at)}</span>
          </div>
        </div>
        <button
          onClick={handleRestore}
          disabled={isUpdating}
          className="shrink-0 border border-[var(--border)] px-4 py-1.5 text-sm font-medium text-[var(--gold)] transition-colors hover:border-[var(--gold)] disabled:opacity-50"
          style={{ borderRadius: "2px" }}
        >
          Przywróć
        </button>
      </div>
    </Link>
  );
}

export function TeamTicketList({ tickets }: { tickets: Ticket[] }) {
  const [filter, setFilter] = useState("all");
  const [showArchive, setShowArchive] = useState(false);
  const [localTickets, setLocalTickets] = useState(tickets);

  const active = localTickets.filter((t) => t.status !== "archived");
  const archived = localTickets.filter((t) => t.status === "archived");

  // Najnowsze na górze
  const sorted = [...active].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const filtered =
    filter === "all" ? sorted : sorted.filter((t) => t.status === filter);

  // Liczniki
  const counts: Record<string, number> = { all: active.length };
  for (const t of active) {
    counts[t.status] = (counts[t.status] || 0) + 1;
  }

  function handleArchive(id: string) {
    setLocalTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "archived" } : t))
    );
  }

  function handleRestore(id: string) {
    setLocalTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "new" } : t))
    );
  }

  return (
    <div>
      {/* Tabs: Zgłoszenia / Archiwum */}
      <div className="mb-6 flex items-center gap-6 border-b border-[var(--border)] pb-3">
        <button
          onClick={() => setShowArchive(false)}
          className={`text-lg font-medium transition-colors ${
            !showArchive
              ? "text-[var(--gold)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          Zgłoszenia ({active.length})
        </button>
        <button
          onClick={() => setShowArchive(true)}
          className={`text-lg font-medium transition-colors ${
            showArchive
              ? "text-[var(--gold)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          Archiwum ({archived.length})
        </button>
      </div>

      {!showArchive ? (
        <>
          {/* Filtry statusów */}
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

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-lg text-[var(--muted-foreground)]">
              Brak zgłoszeń
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onArchive={handleArchive}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {archived.length === 0 ? (
            <div className="py-12 text-center text-lg text-[var(--muted-foreground)]">
              Archiwum jest puste
            </div>
          ) : (
            <div className="space-y-3">
              {archived
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .map((ticket) => (
                  <ArchivedCard
                    key={ticket.id}
                    ticket={ticket}
                    onRestore={handleRestore}
                  />
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
