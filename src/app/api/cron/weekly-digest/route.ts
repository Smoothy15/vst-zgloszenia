import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { sendWeeklyDigest } from "@/lib/resend/emails";
import { formatDate } from "@/lib/utils";

export async function GET(req: NextRequest) {
  // Weryfikacja cron secret (Vercel Cron Jobs)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  // Zlicz nowe
  const { count: newCount } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  // Zlicz w trakcie
  const { count: inProgressCount } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("status", "in_progress");

  // Aktywne pary (new + in_progress)
  const { data: activePairs } = await supabase
    .from("tickets")
    .select("client_name, wedding_date")
    .in("status", ["new", "in_progress"])
    .order("wedding_date", { ascending: true });

  await sendWeeklyDigest({
    newCount: newCount || 0,
    inProgressCount: inProgressCount || 0,
    activePairs: (activePairs || []).map((p) => ({
      name: p.client_name,
      date: formatDate(p.wedding_date),
    })),
  });

  return NextResponse.json({ success: true });
}
