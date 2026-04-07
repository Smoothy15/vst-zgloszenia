import { notFound } from "next/navigation";
import { getServiceSupabase } from "@/lib/supabase/server";
import { ClientChat } from "@/components/client-chat";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Twoje zgłoszenie — VST Wedding",
};

export default async function MojeZgloszeniePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = getServiceSupabase();

  // Pobierz ticket po tokenie
  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("access_token", token)
    .single();

  if (!ticket) notFound();

  // Pobierz wiadomości z załącznikami
  const { data: messages } = await supabase
    .from("messages")
    .select("*, attachments(*)")
    .eq("ticket_id", ticket.id)
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-semibold tracking-wide text-[var(--gold)]">
          VST Wedding
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Twoje zgłoszenie
        </p>
      </div>
      <ClientChat ticket={ticket} messages={messages || []} />
    </main>
  );
}
