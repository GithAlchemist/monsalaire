import { createHash, createHmac, randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { db } from './db';

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** Passwords: scrypt with a random salt, stored as `scrypt$<salt>$<hash>` (base64url). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64, SCRYPT);
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function checkPassword(password: string, stored: string): Promise<boolean> {
  const [kind, salt, hash] = stored.split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  const got = await scrypt(password, Buffer.from(salt, 'base64url'), expected.length, SCRYPT);
  return timingSafeEqual(got, expected);
}

/** A hash to compare against when the account does not exist, so both cases take the same time. */
export const DUMMY_HASH = 'scrypt$AAAAAAAAAAAAAAAAAAAAAA$' + 'A'.repeat(86);

const secret = () => {
  const s = process.env.MONSALAIRE_SECRET;
  if (!s || s.length < 32) throw new Error('MONSALAIRE_SECRET is not set');
  return s;
};

/** Six-digit codes sent by email; only their keyed hash is stored. */
export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0');
export const codeHash = (email: string, purpose: string, code: string) => createHmac('sha256', secret()).update(`${purpose}:${email}:${code}`).digest('hex');

/** Session tokens: 32 random bytes in the cookie, their SHA-256 in the database. */
export const newToken = () => randomBytes(32).toString('base64url');
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

/** The visitor's IP is never stored, only a keyed hash, for rate limiting. */
export const ipHash = (ip: string) => createHmac('sha256', secret()).update(`ip:${ip}`).digest('hex').slice(0, 32);

/** At most `max` events of `key` per `minutes`; records the event when allowed. */
export async function allow(key: string, max: number, minutes: number): Promise<boolean> {
  const { rows } = await db().query('select count(*)::int as n from rate_events where key = $1 and created_at > now() - make_interval(mins => $2)', [key, minutes]);
  if (rows[0].n >= max) return false;
  await db().query('insert into rate_events (key) values ($1)', [key]);
  return true;
}

export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
export const normEmail = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
export const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
