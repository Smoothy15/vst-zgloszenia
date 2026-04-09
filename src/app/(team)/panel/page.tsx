import Image from "next/image";
import Link from "next/link";
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
    <main className="min-h-screen bg-[var(--background)] px-6 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/logo-horizontal.png"
              alt="VST Wedding"
              width={160}
              height={29}
              priority
            />
            <span className="text-sm text-[var(--muted-foreground)]">
              Panel zgłoszeń
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/panel/ustawienia"
              className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--gold)]"
            >
              Ustawienia
            </Link>
            <div className="clerk-gold">
              <UserButton />
            </div>
          </div>
        </div>

        <TeamTicketList tickets={tickets || []} />
      </div>
    </main>
  );
}
