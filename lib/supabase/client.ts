import { createBrowserClient } from "@supabase/ssr";

import { assertSupabaseEnv } from "@/lib/supabase/env";

export function createBrowserSupabaseClient() {
  const { url, key } = assertSupabaseEnv();
  return createBrowserClient(url, key);
}
