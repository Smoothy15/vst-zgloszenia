"use server";

import { getServiceSupabase } from "@/lib/supabase/server";
import {
  sendClientMessageNotification,
  sendTeamReplyNotification,
} from "@/lib/resend/emails";
import { truncate } from "@/lib/utils";

interface SendMessageInput {
  ticketId: string;
  sender: "client" | "team";
  content: string;
  audioUrl?: string;
  fileUrls?: string[];
  fileNames?: string[];
}

export async function sendMessage(input: SendMessageInput) {
  const supabase = getServiceSupabase();

  // 1. Utwórz wiadomość
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert({
      ticket_id: input.ticketId,
      sender: input.sender,
      content: input.content,
      audio_url: input.audioUrl || null,
    })
    .select("id")
    .single();

  if (msgError || !message) {
    throw new Error(`Nie udało się wysłać wiadomości: ${msgError?.message}`);
  }

  // 2. Dodaj załączniki
  if (input.fileUrls && input.fileUrls.length > 0) {
    const attachments = input.fileUrls.map((url, i) => ({
      message_id: message.id,
      file_url: url,
      file_name: input.fileNames?.[i] || null,
    }));

    await supabase.from("attachments").insert(attachments);
  }

  // 3. Aktualizuj updated_at na tickecie
  await supabase
    .from("tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.ticketId);

  // 4. Wyślij powiadomienie email
  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, client_name, access_token")
    .eq("id", input.ticketId)
    .single();

  if (!ticket) return message;

  try {
    if (input.sender === "client") {
      // Klient napisał → powiadom team
      await sendClientMessageNotification({
        id: ticket.id,
        clientName: ticket.client_name,
        messageContent: truncate(input.content),
      });
    } else {
      // Team odpowiedział → powiadom klienta
      // Pobierz email klienta z pierwszej wiadomości (lub z ticketu)
      // Na razie używamy team email bo klient nie ma konta
      // Email klienta jest w messages flow — trzeba go znaleźć
      // W przyszłości: dodamy email do tickets
    }
  } catch {
    console.error("Błąd wysyłki powiadomienia email");
  }

  return message;
}

export async function getMessagesByTicketId(ticketId: string) {
  const supabase = getServiceSupabase();

  const { data: messages, error } = await supabase
    .from("messages")
    .select(
      `
      *,
      attachments (*)
    `
    )
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return messages;
}
