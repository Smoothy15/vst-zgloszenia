"use server";

import { getServiceSupabase } from "@/lib/supabase/server";
import {
  sendTicketConfirmation,
  sendNewTicketNotification,
} from "@/lib/resend/emails";
import { formatDate } from "@/lib/utils";

interface CreateTicketInput {
  clientName: string;
  weddingDate: string;
  email: string;
  description: string;
  audioUrl?: string;
  fileUrls?: string[];
  fileNames?: string[];
}

export async function createTicket(input: CreateTicketInput) {
  const supabase = getServiceSupabase();

  // 1. Utwórz ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      client_name: input.clientName,
      wedding_date: input.weddingDate,
      status: "new",
    })
    .select("id, access_token")
    .single();

  if (ticketError || !ticket) {
    throw new Error(`Nie udało się utworzyć zgłoszenia: ${ticketError?.message}`);
  }

  // 2. Utwórz pierwszą wiadomość od klienta
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert({
      ticket_id: ticket.id,
      sender: "client",
      content: input.description,
      audio_url: input.audioUrl || null,
    })
    .select("id")
    .single();

  if (msgError || !message) {
    throw new Error(`Nie udało się dodać wiadomości: ${msgError?.message}`);
  }

  // 3. Dodaj załączniki
  if (input.fileUrls && input.fileUrls.length > 0) {
    const attachments = input.fileUrls.map((url, i) => ({
      message_id: message.id,
      file_url: url,
      file_name: input.fileNames?.[i] || null,
    }));

    await supabase.from("attachments").insert(attachments);
  }

  // 4. Wyślij maile (nie blokujemy na tym — fire and forget)
  try {
    await sendTicketConfirmation(input.email, ticket.access_token);
  } catch {
    console.error("Błąd wysyłki maila do klienta");
  }

  try {
    await sendNewTicketNotification({
      id: ticket.id,
      clientName: input.clientName,
      weddingDate: formatDate(input.weddingDate),
      description: input.description,
      hasFiles: (input.fileUrls?.length ?? 0) > 0,
      hasAudio: !!input.audioUrl,
    });
  } catch {
    console.error("Błąd wysyłki maila do team");
  }

  return { ticketId: ticket.id, accessToken: ticket.access_token };
}

export async function getTicketByToken(token: string) {
  const supabase = getServiceSupabase();

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("access_token", token)
    .single();

  if (error || !ticket) return null;
  return ticket;
}

export async function getAllTickets() {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getTicketById(id: string) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function updateTicketStatus(
  ticketId: string,
  status: "new" | "in_progress" | "done" | "sent"
) {
  const supabase = getServiceSupabase();

  const { error } = await supabase
    .from("tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  if (error) throw new Error(error.message);
}
