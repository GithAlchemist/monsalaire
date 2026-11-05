import { describe, expect, it, vi } from 'vitest';
import { DAILY_EMAIL_CAP, mailSettings } from './email';
import { turnstileOk, turnstileOn } from './turnstile';

describe('mail settings', () => {
  it('keeps the shared Mailgun login and noreply@aconta.io without the monsalaire variables', () => {
    expect(mailSettings({ MAILGUN_SMTP_USER: 'u', MAILGUN_SMTP_PASSWORD: 'p' })).toEqual({ host: 'smtp.mailgun.org', user: 'u', pass: 'p', from: 'monsalaire <noreply@aconta.io>' });
    expect(mailSettings({})).toBeNull();
  });

  it('uses a sender of its own when both of its variables are set', () => {
    const m = mailSettings({ MAILGUN_SMTP_USER: 'u', MAILGUN_SMTP_PASSWORD: 'p', MONSALAIRE_MAILGUN_SMTP_USER: 'm', MONSALAIRE_MAILGUN_SMTP_PASSWORD: 'q', MONSALAIRE_EMAIL_FROM: 'noreply@mail.monsalaire.example' });
    expect(m).toMatchObject({ user: 'm', pass: 'q', from: 'monsalaire <noreply@mail.monsalaire.example>' });
    expect(mailSettings({ MAILGUN_SMTP_USER: 'u', MAILGUN_SMTP_PASSWORD: 'p', MONSALAIRE_MAILGUN_SMTP_USER: 'm' })).toMatchObject({ user: 'u' });
  });

  it('ignores a sender address that is not a plain address', () => {
    expect(mailSettings({ MAILGUN_SMTP_USER: 'u', MAILGUN_SMTP_PASSWORD: 'p', MONSALAIRE_EMAIL_FROM: 'a@b.com\nBcc: c@d.ef' })?.from).toBe('monsalaire <noreply@aconta.io>');
  });

  it('caps at 30 emails a day by default', () => {
    expect(DAILY_EMAIL_CAP).toBe(30);
  });
});

describe('turnstile', () => {
  const on = { PUBLIC_TURNSTILE_SITE_KEY: 'site', TURNSTILE_SECRET_KEY: 'secret' };

  it('stays off unless both keys are set', async () => {
    expect(turnstileOn({ TURNSTILE_SECRET_KEY: 'secret' })).toBe(false);
    expect(turnstileOn({ PUBLIC_TURNSTILE_SITE_KEY: 'site' })).toBe(false);
    expect(await turnstileOk(undefined, '1.2.3.4', { TURNSTILE_SECRET_KEY: 'secret' })).toBe(true);
  });

  it('checks the token with Cloudflare when on', async () => {
    const ok = vi.fn(async () => new Response(JSON.stringify({ success: true })));
    expect(await turnstileOk('tok', '1.2.3.4', on, ok as unknown as typeof fetch)).toBe(true);
    const no = vi.fn(async () => new Response(JSON.stringify({ success: false })));
    expect(await turnstileOk('tok', '1.2.3.4', on, no as unknown as typeof fetch)).toBe(false);
  });

  it('refuses a missing token or an unreachable Cloudflare', async () => {
    expect(await turnstileOk(undefined, '1.2.3.4', on)).toBe(false);
    const down = vi.fn(async () => {
      throw new Error('down');
    });
    expect(await turnstileOk('tok', '1.2.3.4', on, down as unknown as typeof fetch)).toBe(false);
  });
});
