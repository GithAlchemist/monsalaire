import nodemailer from 'nodemailer';
import { allow } from './security';

type Env = Record<string, string | undefined>;

export const CONTACT_INBOX = 'monsalaire@aconta.io';

/**
 * Every email monsalaire sends in a rolling 24 hours, all purposes together (sign-up and reset codes, contact form).
 * The Mailgun quota of the aconta.io domain is shared with Aconta and BookMe: past this cap, monsalaire stops sending
 * until the window moves on, and says so in the logs (security audit MS-01, 5 November 2026). Change it here.
 */
export const DAILY_EMAIL_CAP = 30;

const DEFAULT_FROM = 'noreply@aconta.io';
const plainAddress = (a: string | undefined) => (a && /^[^\s"<>@,;:\\]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(a.trim()) ? a.trim() : null);

/**
 * Sending account. Optional sender of its own (audit MS-01): with MONSALAIRE_MAILGUN_SMTP_USER and
 * MONSALAIRE_MAILGUN_SMTP_PASSWORD set (for example the SMTP login of a sending subdomain with its own quota), monsalaire
 * stops using the shared MAILGUN_SMTP_* login; MONSALAIRE_EMAIL_FROM sets the sender address (it must belong to that
 * account's domain). Without them, nothing changes: noreply@aconta.io through MAILGUN_SMTP_*.
 */
export function mailSettings(env: Env = process.env) {
  const own = Boolean(env.MONSALAIRE_MAILGUN_SMTP_USER && env.MONSALAIRE_MAILGUN_SMTP_PASSWORD);
  const user = own ? env.MONSALAIRE_MAILGUN_SMTP_USER : env.MAILGUN_SMTP_USER;
  const pass = own ? env.MONSALAIRE_MAILGUN_SMTP_PASSWORD : env.MAILGUN_SMTP_PASSWORD;
  const host = (own && env.MONSALAIRE_MAILGUN_SMTP_HOST) || env.MAILGUN_SMTP_HOST || 'smtp.mailgun.org';
  const from = `monsalaire <${plainAddress(env.MONSALAIRE_EMAIL_FROM) ?? DEFAULT_FROM}>`;
  return user && pass ? { host, user, pass, from } : null;
}

/** Codes are in some subjects: never in the logs. */
const masked = (subject: string) => subject.replace(/\d{6}/g, '******');

/**
 * Takes one place in the daily cap, before anything else is done for the email (a sign-up code is only created once
 * its email can leave): 'ok', 'off' (no SMTP settings, as in local development) or 'capped'. `label` only goes to the logs.
 */
export async function takeMailSlot(label: string): Promise<'ok' | 'off' | 'capped'> {
  if (!mailSettings()) {
    console.warn(`[monsalaire] email not sent (no SMTP settings): ${masked(label)}`);
    return 'off';
  }
  if (!(await allow('mail-global', DAILY_EMAIL_CAP, 24 * 60))) {
    console.error(`[monsalaire] daily email cap reached (${DAILY_EMAIL_CAP} in 24 hours): email not sent: ${masked(label)}`);
    return 'capped';
  }
  return 'ok';
}

/** Sends one email whose place in the daily cap is already taken (takeMailSlot answered 'ok'). */
export async function sendMailInSlot(to: string, subject: string, text: string, replyTo?: string): Promise<void> {
  const m = mailSettings();
  if (!m) return;
  const t = nodemailer.createTransport({ host: m.host, port: 587, secure: false, auth: { user: m.user, pass: m.pass } });
  await t.sendMail({ from: m.from, to, subject, text, replyTo });
}

/** Sends one email within the daily cap: 'sent', 'off' (no SMTP settings, as in local development) or 'capped'. */
export async function sendMail(to: string, subject: string, text: string, replyTo?: string): Promise<'sent' | 'off' | 'capped'> {
  const slot = await takeMailSlot(subject);
  if (slot !== 'ok') return slot;
  await sendMailInSlot(to, subject, text, replyTo);
  return 'sent';
}

export function codeEmail(lang: 'fr' | 'en', purpose: 'verify' | 'reset', code: string) {
  if (lang === 'en') {
    return purpose === 'verify'
      ? { subject: `Your monsalaire code: ${code}`, text: `Your confirmation code is ${code}.\n\nIt is valid for 15 minutes. If you did not create an account on monsalaire.aconta.io, ignore this email.\n\nmonsalaire, by Aconta` }
      : { subject: `Reset your monsalaire password: ${code}`, text: `Your code to choose a new password is ${code}.\n\nIt is valid for 15 minutes. If you did not ask for it, ignore this email: your password stays the same.\n\nmonsalaire, by Aconta` };
  }
  return purpose === 'verify'
    ? { subject: `Votre code monsalaire : ${code}`, text: `Votre code de confirmation est ${code}.\n\nIl est valable 15 minutes. Si vous n’avez pas créé de compte sur monsalaire.aconta.io, ignorez cet email.\n\nmonsalaire, par Aconta` }
    : { subject: `Nouveau mot de passe monsalaire : ${code}`, text: `Votre code pour choisir un nouveau mot de passe est ${code}.\n\nIl est valable 15 minutes. Si vous ne l’avez pas demandé, ignorez cet email : votre mot de passe ne change pas.\n\nmonsalaire, par Aconta` };
}
