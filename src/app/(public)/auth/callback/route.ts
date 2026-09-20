import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * PKCE callback for magic-link sign-in (see LoginForm's signInWithOtp call).
 * Supabase redirects the browser here with a one-time `code` after the
 * customer clicks the link in their email; we exchange it for a session
 * cookie and send them on to wherever they were headed (default:
 * "my appointments").
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/my-appointments";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  const failureUrl = new URL("/auth", url.origin);
  failureUrl.searchParams.set("error", "link_invalid");
  return NextResponse.redirect(failureUrl);
}
