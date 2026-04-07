import { createClient } from "@supabase/supabase-js";

// Klient przeglądarkowy — używa anon key (RLS)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
