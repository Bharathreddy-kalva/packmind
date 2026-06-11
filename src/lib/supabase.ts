import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser client, safe to use in Client Components. Subject to RLS policies.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-only client using the service role key, bypasses RLS.
 * Create a new instance per request/handler rather than reusing a singleton.
 */
export function createSupabaseServerClient() {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
