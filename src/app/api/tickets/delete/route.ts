import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export async function DELETE(req: NextRequest) {
  try {
    const { ticketId, deleteAll } = await req.json();
    const supabase = getServiceSupabase();

    if (deleteAll) {
      // Usuń wszystkie zarchiwizowane
      const { error } = await supabase
        .from("tickets")
        .delete()
        .eq("status", "archived");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (ticketId) {
      // Usuń pojedynczy ticket (tylko jeśli archived)
      const { error } = await supabase
        .from("tickets")
        .delete()
        .eq("id", ticketId)
        .eq("status", "archived");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: "Brak danych." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
