"use client";

import { useState, useRef } from "react";
import { StatusBadge } from "./status-badge";
import { formatDate } from "@/lib/utils";

interface Attachment {
  id: string;
  file_url: string;
  file_name: string | null;
}

interface Message {
  id: string;
  sender: "client" | "team";
  content: string | null;
  audio_url: string | null;
  created_at: string;
  attachments: Attachment[];
}

interface Ticket {
  id: string;
  client_name: string;
  wedding_date: string;
  email: string;
  access_token: string;
  status: string;
  created_at: string;
}

export function TeamChat({
  ticket,
  messages: initialMessages,
}: {
  ticket: Ticket;
  messages: Message[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState(ticket.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const clientLink = `${window.location.origin}/moje-zgloszenie/${ticket.access_token}`;

  function copyClientLink() {
    navigator.clipboard.writeText(clientLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function handleSend() {
    if (!newMessage.trim()) return;
    setIsSending(true);

    try {
      const formData = new FormData();
      formData.set("ticketId", ticket.id);
      formData.set("sender", "team");
      formData.set("content", newMessage);

      const res = await fetch("/api/messages", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Błąd");

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
    } catch {
      alert("Nie udało się wysłać.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch("/api/tickets/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id, status: newStatus }),
      });
      if (!res.ok) throw new Error("Błąd");
      setStatus(newStatus);
    } catch {
      alert("Nie udało się zmienić statusu.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <div>
      {/* Nagłówek ticketu */}
      <div
        className="mb-6 border border-[var(--border)] bg-[var(--card)] p-6"
        style={{ borderRadius: "4px" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-[var(--foreground)]">
              {ticket.client_name}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Ślub: {formatDate(ticket.wedding_date)}
            </p>
            {ticket.email && (
              <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                Email: {ticket.email}
              </p>
            )}
            <button
              onClick={copyClientLink}
              className="mt-3 border border-[var(--border)] px-4 py-1.5 text-sm font-medium text-[var(--gold)] transition-colors hover:border-[var(--gold)]"
              style={{ borderRadius: "2px" }}
            >
              {linkCopied ? "Skopiowano!" : "Kopiuj link dla klienta"}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdatingStatus}
              className="border border-[var(--border)] bg-[var(--input)] px-3 py-1.5 text-xs text-[var(--foreground)] focus:border-[var(--gold)] focus:outline-none"
              style={{ borderRadius: "2px" }}
            >
              <option value="new">Nowe</option>
              <option value="in_progress">W trakcie</option>
              <option value="done">Zrobione</option>
              <option value="sent">Wysłane</option>
            </select>
          </div>
        </div>
      </div>

      {/* Wiadomości */}
      <div className="mb-6 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`border p-4 ${
              msg.sender === "client"
                ? "border-[var(--border)] bg-[var(--card)]"
                : "border-[var(--gold)]/20 bg-[var(--gold)]/5"
            }`}
            style={{ borderRadius: "4px" }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className={`text-xs font-medium ${
                  msg.sender === "client"
                    ? "text-[var(--foreground)]"
                    : "text-[var(--gold)]"
                }`}
              >
                {msg.sender === "client" ? "Klient" : "Team"}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">
                {new Date(msg.created_at).toLocaleString("pl-PL")}
              </span>
            </div>

            {msg.content && (
              <p className="whitespace-pre-wrap text-sm text-[var(--foreground)]">
                {msg.content}
              </p>
            )}

            {msg.audio_url && (
              <audio controls src={msg.audio_url} className="mt-2 w-full" />
            )}

            {msg.attachments?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {msg.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[var(--border)] px-3 py-1 text-xs text-[var(--gold)] transition-colors hover:border-[var(--gold)]"
                    style={{ borderRadius: "2px" }}
                  >
                    {att.file_name || "Plik"}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Odpowiedź team */}
      <div
        className="border border-[var(--border)] bg-[var(--card)] p-4"
        style={{ borderRadius: "4px" }}
      >
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Odpowiedz klientowi..."
          rows={3}
          className="w-full resize-y border border-[var(--border)] bg-[var(--input)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--gold)] focus:outline-none"
          style={{ borderRadius: "2px" }}
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleSend}
            disabled={isSending || !newMessage.trim()}
            className="bg-[var(--gold)] px-6 py-2 text-sm font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-light)] disabled:opacity-50"
            style={{ borderRadius: "2px" }}
          >
            {isSending ? "Wysyłanie..." : "Wyślij odpowiedź"}
          </button>
        </div>
      </div>
    </div>
  );
}
