import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import {
  sendTicketConfirmation,
  sendNewTicketNotification,
} from "@/lib/resend/emails";
import { formatDate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const clientName = formData.get("clientName") as string;
    const weddingDate = formData.get("weddingDate") as string;
    const email = formData.get("email") as string;
    const description = formData.get("description") as string;
    const files = formData.getAll("files") as File[];
    const audio = formData.get("audio") as File | null;

    if (!clientName || !weddingDate || !email || !description) {
      return NextResponse.json(
        { error: "Wypełnij wszystkie wymagane pola." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // 1. Utwórz ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        client_name: clientName,
        wedding_date: weddingDate,
        email,
        status: "new",
      })
      .select("id, access_token")
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: "Nie udało się utworzyć zgłoszenia." },
        { status: 500 }
      );
    }

    // 2. Upload plików do Supabase Storage
    const fileUrls: string[] = [];
    const fileNames: string[] = [];

    // Upload audio
    let audioUrl: string | null = null;
    if (audio && audio.size > 0) {
      const audioPath = `${ticket.id}/audio-${Date.now()}.webm`;
      const audioBuffer = Buffer.from(await audio.arrayBuffer());

      const { error: audioError } = await supabase.storage
        .from("ticket-files")
        .upload(audioPath, audioBuffer, {
          contentType: "audio/webm",
          upsert: false,
        });

      if (!audioError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("ticket-files").getPublicUrl(audioPath);
        audioUrl = publicUrl;
      }
    }

    // Upload załączników
    for (const file of files) {
      if (file.size === 0 || file.size > 10 * 1024 * 1024) continue;

      const filePath = `${ticket.id}/${Date.now()}-${file.name}`;
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

    // 3. Utwórz pierwszą wiadomość
    const { data: message } = await supabase
      .from("messages")
      .insert({
        ticket_id: ticket.id,
        sender: "client",
        content: description,
        audio_url: audioUrl,
      })
      .select("id")
      .single();

    // 4. Dodaj załączniki do wiadomości
    if (message && fileUrls.length > 0) {
      const attachments = fileUrls.map((url, i) => ({
        message_id: message.id,
        file_url: url,
        file_name: fileNames[i] || null,
      }));
      await supabase.from("attachments").insert(attachments);
    }

    // 5. Wyślij maile
    try {
      await sendTicketConfirmation(email, ticket.access_token);
    } catch {
      console.error("Błąd wysyłki potwierdzenia do klienta");
    }

    try {
      await sendNewTicketNotification({
        id: ticket.id,
        clientName,
        weddingDate: formatDate(weddingDate),
        description,
        hasFiles: fileUrls.length > 0,
        hasAudio: !!audioUrl,
      });
    } catch {
      console.error("Błąd wysyłki powiadomienia do team");
    }

    return NextResponse.json({ success: true, ticketId: ticket.id });
  } catch {
    return NextResponse.json(
      { error: "Wystąpił nieoczekiwany błąd." },
      { status: 500 }
    );
  }
}
