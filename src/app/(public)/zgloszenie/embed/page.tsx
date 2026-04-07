import { TicketForm } from "@/components/ticket-form";

export const metadata = {
  title: "Zgłoś poprawkę — VST Wedding",
};

// Wersja formularza do embedowania w iframe na WordPress
export default function EmbedZgloszeniePage() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-6">
      <div className="mx-auto max-w-lg">
        <TicketForm />
      </div>
    </main>
  );
}
