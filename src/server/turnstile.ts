/**
 * Cloudflare Turnstile on sign-up and the contact form (security audit MS-01, 5 November 2026). Off unless both
 * PUBLIC_TURNSTILE_SITE_KEY (the widget, read at build time by the browser code) and TURNSTILE_SECRET_KEY (the check
 * below) are set: with only one of them, nothing changes, so a half-done setup never locks people out.
 */
type Env = Record<string, string | undefined>;

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const siteKey = (env: Env) => env.PUBLIC_TURNSTILE_SITE_KEY || import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;

export function turnstileOn(env: Env = process.env): boolean {
  return Boolean(env.TURNSTILE_SECRET_KEY && siteKey(env));
}

/**
 * True when the token is accepted by Cloudflare, or when Turnstile is off. A missing token, a refusal, or Cloudflare
 * out of reach all refuse: the form says to try again, the per-IP limits stay as before.
 */
export async function turnstileOk(token: unknown, ip: string, env: Env = process.env, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  if (!turnstileOn(env)) return true;
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  try {
    const r = await fetchImpl(VERIFY_URL, {
      method: 'POST',
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY as string, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000),
    });
    const d = (await r.json()) as { success?: boolean };
    return d.success === true;
  } catch (e) {
    console.error('[monsalaire] Turnstile unreachable', e instanceof Error ? e.message : e);
    return false;
  }
}
