import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getServerEnv } from "@/lib/env";

/**
 * Server-side Supabase client for use in Server Components, Route Handlers
 * and Server Actions. Runs with the caller's auth session (RLS applies).
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const env = getServerEnv();

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component (not a Server Action/Route Handler) —
          // safe to ignore because the middleware refreshes the session anyway.
        }
      },
    },
  });
}

/**
 * Admin-privileged client that BYPASSES Row Level Security using the
 * service role key. Server-only. Never import this from client code, never
 * expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 *
 * Legitimate uses: sending transactional emails after a status change,
 * one-off maintenance/admin-bootstrap scripts, scheduled jobs (hold expiry).
 * Every other server operation should use createServerSupabaseClient()
 * so RLS + the SECURITY DEFINER RPCs remain the single source of truth
 * for authorization.
 */
export function createServiceRoleClient() {
  const env = getServerEnv();
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — cannot create a service-role client.");
  }
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
