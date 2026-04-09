import { notFound } from "next/navigation";
import { getServiceSupabase } from "@/lib/supabase/server";
import { TeamChat } from "@/components/team-chat";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Zgłoszenie — VST Wedding Panel",
};

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const supabase = getServiceSupabase();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (!ticket) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("*, attachments(*)")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/panel"
          className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--gold)]"
        >
          ← Wróć do listy
        </Link>

        <TeamChat ticket={ticket} messages={messages || []} />
      </div>
    </main>
  );
}
