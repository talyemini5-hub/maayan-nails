import { createHmac, timingSafeEqual } from "crypto";
import { getServerEnv } from "@/lib/env";

export type EmailAction = "confirm" | "decline";

/**
 * Stateless, signed links used by the "confirm / decline" buttons inside the
 * admin_new_booking alert email, so Maayan can approve or decline a pending
 * booking request straight from her inbox without logging into /admin.
 *
 * No token table: a link stays valid for EXPIRY_SECONDS, and — because the
 * action route only ever acts while the appointment is still
 * "pending_approval" — clicking an already-used or stale link is a harmless
 * no-op rather than a double action.
 */
const EXPIRY_SECONDS = 60 * 60 * 24 * 60; // 60 days — comfortably longer than any booking lead time.

function sign(appointmentId: string, action: EmailAction, exp: number, secret: string): string {
  return createHmac("sha256", secret).update(`${appointmentId}:${action}:${exp}`).digest("hex");
}

/** Returns null when EMAIL_ACTION_SECRET isn't configured — callers should just omit the buttons. */
export function buildEmailActionUrl(appointmentId: string, action: EmailAction): string | null {
  const env = getServerEnv();
  if (!env.EMAIL_ACTION_SECRET) return null;
  const exp = Math.floor(Date.now() / 1000) + EXPIRY_SECONDS;
  const token = sign(appointmentId, action, exp, env.EMAIL_ACTION_SECRET);
  const url = new URL(`/api/email-actions/${appointmentId}`, env.NEXT_PUBLIC_SITE_URL);
  url.searchParams.set("action", action);
  url.searchParams.set("exp", String(exp));
  url.searchParams.set("token", token);
  return url.toString();
}

export function verifyEmailActionToken(params: {
  appointmentId: string;
  action: string | null;
  exp: string | null;
  token: string | null;
}): { ok: true; action: EmailAction } | { ok: false; reason: "MISCONFIGURED" | "INVALID" | "EXPIRED" } {
  const env = getServerEnv();
  if (!env.EMAIL_ACTION_SECRET) return { ok: false, reason: "MISCONFIGURED" };

  const { appointmentId, action, exp, token } = params;
  if (!action || (action !== "confirm" && action !== "decline") || !exp || !token) {
    return { ok: false, reason: "INVALID" };
  }
  const expNum = Number(exp);
  if (!Number.isFinite(expNum)) return { ok: false, reason: "INVALID" };

  const expected = sign(appointmentId, action, expNum, env.EMAIL_ACTION_SECRET);
  const expectedBuf = Buffer.from(expected, "hex");
  const tokenBuf = Buffer.from(token, "hex");
  if (expectedBuf.length !== tokenBuf.length || !timingSafeEqual(expectedBuf, tokenBuf)) {
    return { ok: false, reason: "INVALID" };
  }
  if (Math.floor(Date.now() / 1000) > expNum) {
    return { ok: false, reason: "EXPIRED" };
  }
  return { ok: true, action };
}
