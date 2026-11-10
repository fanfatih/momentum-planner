import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { REMOTE, SUPABASE_KEY, SUPABASE_URL } from "./mode";

/** Klien browser. Null di mode demo. Sesi login disimpan supabase-js di localStorage. */
export const sb: SupabaseClient | null = REMOTE
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
