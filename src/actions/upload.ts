"use server";

import { getServiceSupabase } from "@/lib/supabase/server";

export async function uploadFile(
  ticketId: string,
  file: File
): Promise<string> {
  const supabase = getServiceSupabase();
  const fileName = `${ticketId}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("ticket-files")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Błąd uploadu: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("ticket-files").getPublicUrl(fileName);

  return publicUrl;
}

export async function uploadFiles(
  ticketId: string,
  files: File[]
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadFile(ticketId, file);
    urls.push(url);
  }
  return urls;
}
