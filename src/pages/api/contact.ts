import type { APIContext } from 'astro';
import { db } from '../../server/db';
import { CONTACT_INBOX, sendMail } from '../../server/email';
import { clientIp, json, langOf, readBody } from '../../server/http';
import { allow, EMAIL_RE, ipHash, normEmail, str } from '../../server/security';

export const prerender = false;

/** Contact form: the message is kept in the database and forwarded to monsalaire@aconta.io (reply goes to the sender). */
export async function POST(ctx: APIContext) {
  const body = await readBody(ctx);
  if (!body) return json({ error: 'bad_request' }, 400);
  if (str(body.website, 200)) return json({ ok: true });
  const name = str(body.name, 120);
  const email = normEmail(body.email);
  const message = str(body.message, 5000);
  const lang = langOf(body.lang);
  if (!name) return json({ error: 'name' }, 400);
  if (!EMAIL_RE.test(email)) return json({ error: 'email' }, 400);
  if (message.length < 10) return json({ error: 'message' }, 400);
  try {
    const ip = ipHash(clientIp(ctx));
    if (!(await allow(`contact:${ip}`, 5, 60))) return json({ error: 'too_many' }, 429);
    await db().query('insert into messages (name, email, body, lang, ip_hash) values ($1, $2, $3, $4, $5)', [name, email, message, lang, ip]);
    await sendMail(CONTACT_INBOX, `[monsalaire] Message de ${name}`, `${message}\n\n${name} <${email}> · ${lang}`, email);
    return json({ ok: true });
  } catch (e) {
    console.error('[monsalaire] contact', e instanceof Error ? e.message : e);
    return json({ error: 'server' }, 500);
  }
}
