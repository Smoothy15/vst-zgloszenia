"use client";

import { useState, useRef } from "react";
import { AudioRecorder } from "./audio-recorder";

export function TicketForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<Blob | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const clientName = formData.get("clientName") as string;
    const weddingDate = formData.get("weddingDate") as string;
    const email = formData.get("email") as string;
    const description = formData.get("description") as string;
    const files = formData.getAll("files") as File[];

    if (!clientName || !weddingDate || !email || !description) {
      setError("Wypełnij wszystkie wymagane pola.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Przygotuj dane do wysłania
      const submitData = new FormData();
      submitData.set("clientName", clientName);
      submitData.set("weddingDate", weddingDate);
      submitData.set("email", email);
      submitData.set("description", description);

      // Dodaj pliki
      for (const file of files) {
        if (file.size > 0) submitData.append("files", file);
      }

      // Dodaj nagranie audio
      if (audioRef.current) {
        submitData.set("audio", audioRef.current, "nagranie.webm");
      }

      const res = await fetch("/api/tickets", {
        method: "POST",
        body: submitData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Coś poszło nie tak.");
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div
          className="border border-[var(--border)] bg-[var(--card)] p-8"
          style={{ borderRadius: "4px" }}
        >
          <div className="mb-4 text-4xl text-[var(--gold)]">✓</div>
          <h2 className="mb-2 font-serif text-2xl text-[var(--foreground)]">
            Zgłoszenie przyjęte
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Dziękujemy! Na podany adres email wysłaliśmy link do śledzenia
            statusu zgłoszenia. Odezwiemy się wkrótce.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg space-y-6"
    >
      {error && (
        <div
          className="border border-[var(--destructive)] bg-[var(--destructive)]/10 px-4 py-3 text-sm text-red-400"
          style={{ borderRadius: "2px" }}
        >
          {error}
        </div>
      )}

      {/* Imiona pary */}
      <div>
        <label
          htmlFor="clientName"
          className="mb-1.5 block text-sm text-[var(--muted-foreground)]"
        >
          Imię i nazwisko / imiona pary *
        </label>
        <input
          id="clientName"
          name="clientName"
          type="text"
          required
          placeholder="np. Anna i Tomek Kowalscy"
          className="w-full border border-[var(--border)] bg-[var(--input)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--gold)] focus:outline-none"
          style={{ borderRadius: "2px" }}
        />
      </div>

      {/* Data ślubu */}
      <div>
        <label
          htmlFor="weddingDate"
          className="mb-1.5 block text-sm text-[var(--muted-foreground)]"
        >
          Data ślubu *
        </label>
        <input
          id="weddingDate"
          name="weddingDate"
          type="date"
          required
          className="w-full border border-[var(--border)] bg-[var(--input)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--gold)] focus:outline-none"
          style={{ borderRadius: "2px" }}
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm text-[var(--muted-foreground)]"
        >
          Adres email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="wasz@email.pl"
          className="w-full border border-[var(--border)] bg-[var(--input)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--gold)] focus:outline-none"
          style={{ borderRadius: "2px" }}
        />
      </div>

      {/* Opis poprawki */}
      <div>
        <label
          htmlFor="description"
          className="mb-1.5 block text-sm text-[var(--muted-foreground)]"
        >
          Opis poprawki *
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          placeholder="Opisz jakie zmiany chcielibyście w filmie..."
          className="w-full resize-y border border-[var(--border)] bg-[var(--input)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--gold)] focus:outline-none"
          style={{ borderRadius: "2px" }}
        />
      </div>

      {/* Nagranie głosowe */}
      <div>
        <label className="mb-1.5 block text-sm text-[var(--muted-foreground)]">
          Nagranie głosowe (opcjonalnie)
        </label>
        <AudioRecorder
          onRecordingComplete={(blob) => {
            audioRef.current = blob;
          }}
        />
      </div>

      {/* Pliki */}
      <div>
        <label
          htmlFor="files"
          className="mb-1.5 block text-sm text-[var(--muted-foreground)]"
        >
          Zdjęcia / screeny (opcjonalnie, max 5 plików po 10MB)
        </label>
        <input
          id="files"
          name="files"
          type="file"
          multiple
          accept="image/*,.pdf"
          className="w-full text-sm text-[var(--muted-foreground)] file:mr-3 file:border file:border-[var(--border)] file:bg-[var(--input)] file:px-4 file:py-2 file:text-sm file:text-[var(--foreground)] hover:file:border-[var(--gold)]"
          style={{ borderRadius: "2px" }}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-light)] disabled:opacity-50"
        style={{ borderRadius: "2px" }}
      >
        {isSubmitting ? "Wysyłanie..." : "Wyślij zgłoszenie"}
      </button>
    </form>
  );
}
