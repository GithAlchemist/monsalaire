import nodemailer from 'nodemailer';

/** Emails leave through Aconta's Mailgun account (same variables as the Aconta app), from noreply@aconta.io. */
const FROM = 'monsalaire <noreply@aconta.io>';
export const CONTACT_INBOX = 'monsalaire@aconta.io';

function transport() {
  const user = process.env.MAILGUN_SMTP_USER;
  const pass = process.env.MAILGUN_SMTP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ host: process.env.MAILGUN_SMTP_HOST || 'smtp.mailgun.org', port: 587, secure: false, auth: { user, pass } });
}

export async function sendMail(to: string, subject: string, text: string, replyTo?: string): Promise<void> {
  const t = transport();
  if (!t) {
    console.warn(`[monsalaire] email not sent (no SMTP settings): ${subject}`);
    return;
  }
  await t.sendMail({ from: FROM, to, subject, text, replyTo });
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
