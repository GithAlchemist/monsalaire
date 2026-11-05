import type { APIContext } from 'astro';
import { db } from './db';
import { codeEmail, sendMailInSlot, takeMailSlot } from './email';
import { codeHash, newCode, newToken, tokenHash } from './security';

export const COOKIE = 'ms_session';
const DAYS = 60;

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/** Same-origin JSON requests only (with SameSite cookies, this closes cross-site request forgery). */
export async function readBody(ctx: APIContext): Promise<Record<string, unknown> | null> {
  const origin = ctx.request.headers.get('origin');
  if (origin && origin !== new URL(ctx.request.url).origin) return null;
  if (!ctx.request.headers.get('content-type')?.includes('application/json')) return null;
  try {
    const b = await ctx.request.json();
    return b && typeof b === 'object' ? (b as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const clientIp = (ctx: APIContext) => ctx.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
export const langOf = (v: unknown): 'fr' | 'en' => (v === 'en' ? 'en' : 'fr');

export async function openSession(ctx: APIContext, accountId: string) {
  const token = newToken();
  await db().query(`insert into sessions (token_hash, account_id, expires_at) values ($1, $2, now() + interval '${DAYS} days')`, [tokenHash(token), accountId]);
  ctx.cookies.set(COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: DAYS * 86400 });
}

export type Account = { id: string; email: string; lang: string; newsletter: boolean; picture: string | null };

export async function currentAccount(ctx: APIContext): Promise<Account | null> {
  const token = ctx.cookies.get(COOKIE)?.value;
  if (!token) return null;
  const { rows } = await db().query(
    // to_jsonb(a) reads optional columns (picture_url) without failing before their migration has run.
    "select a.id, a.email, a.lang, a.newsletter, to_jsonb(a)->>'picture_url' as picture from sessions s join accounts a on a.id = s.account_id where s.token_hash = $1 and s.expires_at > now() and a.verified_at is not null",
    [tokenHash(token)],
  );
  return rows[0] ?? null;
}

/** Per-member visit stats: one visit counted per 30 minutes of activity (docs/db/003). Silent if not migrated yet. */
export async function countVisit(accountId: string) {
  try {
    await db().query(
      "update accounts set visits = visits + 1, last_seen_at = now() where id = $1 and (last_seen_at is null or last_seen_at < now() - interval '30 minutes')",
      [accountId],
    );
  } catch {
    /* columns not there yet */
  }
}

export async function closeSession(ctx: APIContext) {
  const token = ctx.cookies.get(COOKIE)?.value;
  if (token) await db().query('delete from sessions where token_hash = $1', [tokenHash(token)]);
  ctx.cookies.delete(COOKIE, { path: '/' });
}

/**
 * Sends a fresh six-digit code (15 minutes) and voids the previous ones of the same purpose. The daily email cap is
 * checked first: once it is reached, nothing changes and the code already received stays valid.
 */
export async function sendCode(email: string, purpose: 'verify' | 'reset', lang: 'fr' | 'en'): Promise<'sent' | 'off' | 'capped'> {
  const slot = await takeMailSlot(`code ${purpose}`);
  if (slot === 'capped') return 'capped';
  const code = newCode();
  await db().query('update codes set used_at = now() where email = $1 and purpose = $2 and used_at is null', [email, purpose]);
  await db().query(`insert into codes (email, purpose, code_hash, expires_at) values ($1, $2, $3, now() + interval '15 minutes')`, [email, purpose, codeHash(email, purpose, code)]);
  if (slot === 'off') return 'off';
  const m = codeEmail(lang, purpose, code);
  await sendMailInSlot(email, m.subject, m.text);
  return 'sent';
}

/** Checks a code: five tries at most, then the code is void. Marks it used on success. */
export async function useCode(email: string, purpose: 'verify' | 'reset', code: string): Promise<boolean> {
  const { rows } = await db().query(
    'select id, code_hash, attempts from codes where email = $1 and purpose = $2 and used_at is null and expires_at > now() order by created_at desc limit 1',
    [email, purpose],
  );
  const row = rows[0];
  if (!row || row.attempts >= 5) return false;
  if (row.code_hash !== codeHash(email, purpose, code)) {
    await db().query('update codes set attempts = attempts + 1 where id = $1', [row.id]);
    return false;
  }
  await db().query('update codes set used_at = now() where id = $1', [row.id]);
  return true;
}
