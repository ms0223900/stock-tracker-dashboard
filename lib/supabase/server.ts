import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import {
  assertSupabaseEnv,
  assertSupabaseServiceRoleEnv,
} from "@/lib/supabase/env";

export async function createServerSupabaseClient() {
  const { url, key } = assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component 內呼叫時可忽略；middleware 會刷新 session。
        }
      },
    },
  });
}

export function createServiceRoleSupabaseClient() {
  const { url, key } = assertSupabaseServiceRoleEnv();
  return createClient(url, key);
}
