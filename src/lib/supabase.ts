import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Shop } from "./types";

export type Database = {
  public: {
    Tables: {
      shops: {
        Row: Shop;
        Insert: Partial<Shop> & Pick<Shop, "name">;
        Update: Partial<Shop>;
      };
    };
  };
};

export function createBrowserSupabaseClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key);
}

/** Server Components / Route Handlers 用（Anon）。Workers でも @supabase/supabase-js の fetch ベースで動作 */
export function createServerSupabaseClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** バッチ書き込み専用。ブラウザや公開 API から呼ばないこと */
export function createServiceRoleSupabaseClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required",
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
