import Image from "next/image";
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
          <Image
            src="/logo-horizontal.png"
            alt="VST Wedding"
            width={200}
            height={36}
            className="mx-auto mb-4"
          />
          <p className="text-sm text-[var(--muted-foreground)]">
            Formularz zgłoszenia poprawki do filmu
          </p>
        </div>
        <TicketForm />
      </div>
    </main>
  );
}
