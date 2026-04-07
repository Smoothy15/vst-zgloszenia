"use client";

import { useState, useRef } from "react";
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
  status: string;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  new: "Nowe",
  in_progress: "W trakcie",
  done: "Zrobione",
  sent: "Wysłane",
};

export function ClientChat({
  ticket,
  messages: initialMessages,
}: {
  ticket: Ticket;
  messages: Message[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSend() {
    if (!newMessage.trim() && files.length === 0) return;
    setIsSending(true);

    try {
      const formData = new FormData();
      formData.set("ticketId", ticket.id);
      formData.set("sender", "client");
      formData.set("content", newMessage);
      for (const file of files) {
        formData.append("files", file);
      }

      const res = await fetch("/api/messages", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Błąd wysyłki");

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      alert("Nie udało się wysłać wiadomości. Spróbuj ponownie.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Nagłówek */}
      <div
        className="mb-6 border border-[var(--border)] bg-[var(--card)] p-6"
        style={{ borderRadius: "4px" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-xl text-[var(--foreground)]">
              {ticket.client_name}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Data ślubu: {formatDate(ticket.wedding_date)}
            </p>
          </div>
          <span className="text-sm text-[var(--gold)]">
            {statusLabels[ticket.status] || ticket.status}
          </span>
        </div>
      </div>

      {/* Wiadomości */}
      <div className="mb-6 space-y-4">
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
                    ? "text-[var(--muted-foreground)]"
                    : "text-[var(--gold)]"
                }`}
              >
                {msg.sender === "client" ? "Ty" : "VST Wedding"}
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
              <audio
                controls
                src={msg.audio_url}
                className="mt-2 w-full"
              />
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

      {/* Formularz nowej wiadomości */}
      <div
        className="border border-[var(--border)] bg-[var(--card)] p-4"
        style={{ borderRadius: "4px" }}
      >
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Napisz wiadomość..."
          rows={3}
          className="w-full resize-y border border-[var(--border)] bg-[var(--input)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--gold)] focus:outline-none"
          style={{ borderRadius: "2px" }}
        />
        <div className="mt-3 flex items-center justify-between">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="text-xs text-[var(--muted-foreground)]"
          />
          <button
            onClick={handleSend}
            disabled={isSending || (!newMessage.trim() && files.length === 0)}
            className="bg-[var(--gold)] px-6 py-2 text-sm font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-light)] disabled:opacity-50"
            style={{ borderRadius: "2px" }}
          >
            {isSending ? "Wysyłanie..." : "Wyślij"}
          </button>
        </div>
      </div>
    </div>
  );
}
