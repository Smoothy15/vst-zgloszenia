import Image from "next/image";
import { getServiceSupabase } from "@/lib/supabase/server";
import { TeamTicketList } from "@/components/team-ticket-list";
import { UserButton } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel — VST Wedding",
};

export default async function PanelPage() {
  const supabase = getServiceSupabase();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Image
              src="/logo.png"
              alt="VST Wedding"
              width={160}
              height={29}
              className="mb-1 invert"
            />
            <p className="text-sm text-[var(--muted-foreground)]">
              Panel zgłoszeń
            </p>
          </div>
          <UserButton />
        </div>

        <TeamTicketList tickets={tickets || []} />
      </div>
    </main>
  );
}
