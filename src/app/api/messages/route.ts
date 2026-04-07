import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import {
  sendClientMessageNotification,
  sendTeamReplyNotification,
} from "@/lib/resend/emails";
import { truncate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const ticketId = formData.get("ticketId") as string;
    const sender = formData.get("sender") as "client" | "team";
    const content = formData.get("content") as string;
    const files = formData.getAll("files") as File[];

    if (!ticketId || !sender || !content) {
      return NextResponse.json(
        { error: "Brakuje wymaganych pól." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // 1. Upload plików
    const fileUrls: string[] = [];
    const fileNames: string[] = [];

    for (const file of files) {
      if (file.size === 0 || file.size > 10 * 1024 * 1024) continue;

      const filePath = `${ticketId}/${Date.now()}-${file.name}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from("ticket-files")
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("ticket-files").getPublicUrl(filePath);
        fileUrls.push(publicUrl);
        fileNames.push(file.name);
      }
    }

    // 2. Utwórz wiadomość
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .insert({
        ticket_id: ticketId,
        sender,
        content,
        audio_url: null,
      })
      .select("*, attachments(*)")
      .single();

    if (msgError || !message) {
      return NextResponse.json(
        { error: "Nie udało się wysłać wiadomości." },
        { status: 500 }
      );
    }

    // 3. Dodaj załączniki
    if (fileUrls.length > 0) {
      const attachments = fileUrls.map((url, i) => ({
        message_id: message.id,
        file_url: url,
        file_name: fileNames[i] || null,
      }));
      await supabase.from("attachments").insert(attachments);
    }

    // 4. Aktualizuj updated_at
    await supabase
      .from("tickets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", ticketId);

    // 5. Powiadomienia email
    const { data: ticket } = await supabase
      .from("tickets")
      .select("id, client_name, access_token, email")
      .eq("id", ticketId)
      .single();

    if (ticket) {
      try {
        if (sender === "client") {
          await sendClientMessageNotification({
            id: ticket.id,
            clientName: ticket.client_name,
            messageContent: truncate(content),
          });
        } else if (ticket.email) {
          await sendTeamReplyNotification(
            ticket.email,
            ticket.access_token,
            truncate(content, 100)
          );
        }
      } catch {
        console.error("Błąd wysyłki powiadomienia email");
      }
    }

    // Zwróć wiadomość z załącznikami
    const attachmentsData = fileUrls.map((url, i) => ({
      id: `temp-${i}`,
      file_url: url,
      file_name: fileNames[i] || null,
    }));

    return NextResponse.json({
      message: { ...message, attachments: attachmentsData },
    });
  } catch {
    return NextResponse.json(
      { error: "Wystąpił nieoczekiwany błąd." },
      { status: 500 }
    );
  }
}
