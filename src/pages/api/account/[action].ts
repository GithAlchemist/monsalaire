import type { APIContext } from 'astro';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { db } from '../../../server/db';
import { clientIp, closeSession, currentAccount, json, langOf, openSession, readBody, sendCode, useCode } from '../../../server/http';
import { allow, checkPassword, DUMMY_HASH, EMAIL_RE, hashPassword, ipHash, normEmail, str } from '../../../server/security';

export const prerender = false;

/**
 * Subscriber accounts of monsalaire (separate from Aconta accounts): email and password, email confirmed by a
 * six-digit code, password reset by code. Answers never reveal whether an email has an account.
 *
 * POST /api/account/signup  { email, password, lang }      -> { step: 'verify' }
 * POST /api/account/verify  { email, code }                -> { account }
 * POST /api/account/login   { email, password }            -> { account } | { step: 'verify' }
 * POST /api/account/forgot  { email, lang }                -> { step: 'reset' }
 * POST /api/account/reset   { email, code, password }      -> { account }
 * POST /api/account/google  { credential }               -> { account }  (Google ID token, verified here)
 * POST /api/account/logout  {}                             -> { ok }
 * POST /api/account/delete  {}                             -> { ok }
 * GET  /api/account/me                                     -> { account | null }
 */

const fail = (error: string, status = 400) => json({ error }, status);
const GOOGLE_KEYS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const goodPassword = (p: string) => p.length >= 8 && p.length <= 200;
const pub = (a: { email: string; lang: string; newsletter: boolean }) => ({ email: a.email, lang: a.lang, newsletter: a.newsletter });

export async function GET(ctx: APIContext) {
  if (ctx.params.action !== 'me') return fail('not_found', 404);
  // Accounts switched off until the database is configured: the offer stays hidden.
  if (!process.env.MONSALAIRE_DATABASE_URL || !process.env.MONSALAIRE_SECRET) return json({ account: null, off: true });
  const google = process.env.GOOGLE_CLIENT_ID || null;
  try {
    const a = await currentAccount(ctx);
    return json({ account: a ? pub(a) : null, google });
  } catch {
    return json({ account: null });
  }
}

export async function POST(ctx: APIContext) {
  const body = await readBody(ctx);
  if (!body) return fail('bad_request');
  // Honeypot: a hidden field that people never fill in.
  if (str(body.website, 200)) return json({ step: 'verify' });
  const ip = ipHash(clientIp(ctx));
  const email = normEmail(body.email);
  const lang = langOf(body.lang);

  try {
    switch (ctx.params.action) {
      case 'signup': {
        const password = typeof body.password === 'string' ? body.password : '';
        if (!EMAIL_RE.test(email)) return fail('email');
        if (!goodPassword(password)) return fail('password');
        if (!(await allow(`signup:${ip}`, 8, 60)) || !(await allow(`mail:${email}`, 5, 60))) return fail('too_many', 429);
        const { rows } = await db().query('select id, verified_at from accounts where email = $1', [email]);
        if (rows[0]?.verified_at) return json({ step: 'verify' }); // already a member: same answer, no email
        const hash = await hashPassword(password);
        if (rows[0]) await db().query('update accounts set password_hash = $2, lang = $3 where id = $1', [rows[0].id, hash, lang]);
        else await db().query('insert into accounts (email, password_hash, lang) values ($1, $2, $3)', [email, hash, lang]);
        await sendCode(email, 'verify', lang);
        return json({ step: 'verify' });
      }

      case 'verify': {
        const code = str(body.code, 6);
        if (!(await allow(`verify:${ip}`, 20, 60))) return fail('too_many', 429);
        if (!/^\d{6}$/.test(code) || !(await useCode(email, 'verify', code))) return fail('code');
        const { rows } = await db().query('update accounts set verified_at = coalesce(verified_at, now()) where email = $1 returning id, email, lang, newsletter', [email]);
        if (!rows[0]) return fail('code');
        await openSession(ctx, rows[0].id);
        return json({ account: pub(rows[0]) });
      }

      case 'login': {
        const password = typeof body.password === 'string' ? body.password : '';
        if (!(await allow(`login:${ip}`, 20, 15)) || !(await allow(`login:${email}`, 8, 15))) return fail('too_many', 429);
        const { rows } = await db().query('select id, email, lang, newsletter, password_hash, verified_at from accounts where email = $1', [email]);
        const a = rows[0];
        const ok = await checkPassword(password, a?.password_hash ?? DUMMY_HASH);
        if (!a || !ok) return fail('credentials', 401);
        if (!a.verified_at) {
          if (await allow(`mail:${email}`, 5, 60)) await sendCode(email, 'verify', langOf(a.lang));
          return json({ step: 'verify' });
        }
        await openSession(ctx, a.id);
        return json({ account: pub(a) });
      }

      case 'forgot': {
        if (!EMAIL_RE.test(email)) return fail('email');
        if (!(await allow(`forgot:${ip}`, 8, 60))) return fail('too_many', 429);
        const { rows } = await db().query('select lang from accounts where email = $1 and verified_at is not null', [email]);
        if (rows[0] && (await allow(`mail:${email}`, 5, 60))) await sendCode(email, 'reset', langOf(rows[0].lang));
        return json({ step: 'reset' });
      }

      case 'reset': {
        const code = str(body.code, 6);
        const password = typeof body.password === 'string' ? body.password : '';
        if (!goodPassword(password)) return fail('password');
        if (!(await allow(`verify:${ip}`, 20, 60))) return fail('too_many', 429);
        if (!/^\d{6}$/.test(code) || !(await useCode(email, 'reset', code))) return fail('code');
        const { rows } = await db().query('update accounts set password_hash = $2 where email = $1 returning id, email, lang, newsletter', [email, await hashPassword(password)]);
        if (!rows[0]) return fail('code');
        await db().query('delete from sessions where account_id = $1', [rows[0].id]);
        await openSession(ctx, rows[0].id);
        return json({ account: pub(rows[0]) });
      }

      case 'google': {
        // Google sign-in: the ID token from Google's button, checked against Google's keys and our client ID.
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const credential = str(body.credential, 4096);
        if (!clientId || !credential) return fail('google');
        if (!(await allow(`google:${ip}`, 20, 15))) return fail('too_many', 429);
        let claims;
        try {
          ({ payload: claims } = await jwtVerify(credential, GOOGLE_KEYS, { audience: clientId, issuer: ['https://accounts.google.com', 'accounts.google.com'] }));
        } catch {
          return fail('google', 401);
        }
        const gEmail = normEmail(claims.email);
        const sub = typeof claims.sub === 'string' ? claims.sub : '';
        if (!sub || !EMAIL_RE.test(gEmail) || claims.email_verified !== true) return fail('google', 401);
        // Same person if the (Google-verified) email is already known. A password set on an address that was never
        // confirmed is dropped: whoever typed it did not prove they own the address.
        const { rows } = await db().query(
          `insert into accounts (email, google_sub, lang, verified_at) values ($1, $2, $3, now())
           on conflict (email) do update set google_sub = coalesce(accounts.google_sub, excluded.google_sub),
             password_hash = case when accounts.verified_at is null then null else accounts.password_hash end,
             verified_at = coalesce(accounts.verified_at, now())
           returning id, email, lang, newsletter, google_sub`,
          [gEmail, sub, lang],
        );
        if (rows[0].google_sub !== sub) return fail('google', 401);
        await openSession(ctx, rows[0].id);
        return json({ account: pub(rows[0]) });
      }

      case 'logout': {
        await closeSession(ctx);
        return json({ ok: true });
      }

      case 'delete': {
        const a = await currentAccount(ctx);
        if (!a) return fail('auth', 401);
        await db().query('delete from accounts where id = $1', [a.id]);
        await db().query('delete from codes where email = $1', [a.email]);
        ctx.cookies.delete('ms_session', { path: '/' });
        return json({ ok: true });
      }

      default:
        return fail('not_found', 404);
    }
  } catch (e) {
    console.error('[monsalaire] account', ctx.params.action, e instanceof Error ? e.message : e);
    return fail('server', 500);
  }
}
