import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  try {
    const { ticketId, status } = await req.json();

    const validStatuses = ["new", "in_progress", "done", "sent", "archived"];
    if (!ticketId || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from("tickets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", ticketId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
