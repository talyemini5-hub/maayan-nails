import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 renamed the `middleware` convention to `proxy` to clarify its
 * role at the network boundary. This runs the Supabase session refresh on
 * every request and enforces /admin route protection server-side.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image optimization
     * files, so the Supabase auth cookie stays fresh on every navigation.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|.*\\.(?:svg|png|jpg|jpeg|webp|avif)$).*)",
  ],
};
