import { TicketForm } from "@/components/ticket-form";

export const metadata = {
  title: "Zgłoś poprawkę — VST Wedding",
  description: "Formularz zgłoszenia poprawki do filmu ślubnego",
};

export default function ZgloszeniePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-10 text-center">
          <h1 className="mb-2 font-serif text-4xl font-semibold tracking-wide text-[var(--gold)]">
            VST Wedding
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Formularz zgłoszenia poprawki do filmu
          </p>
        </div>
        <TicketForm />
      </div>
    </main>
  );
}
