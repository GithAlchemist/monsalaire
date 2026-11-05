import { beforeEach, describe, expect, it, vi } from 'vitest';

const query = vi.fn(async (_sql: string, _params?: unknown[]) => ({ rows: [] }));
vi.mock('./db', () => ({ db: () => ({ query }) }));

const slot = vi.fn<(label: string) => Promise<'ok' | 'off' | 'capped'>>();
const send = vi.fn(async (_to: string, _subject: string, _text: string) => {});
vi.mock('./email', () => ({
  takeMailSlot: (label: string) => slot(label),
  sendMailInSlot: (to: string, subject: string, text: string) => send(to, subject, text),
  codeEmail: () => ({ subject: 'Votre code monsalaire : 123456', text: 'code' }),
}));
vi.mock('./security', () => ({ newCode: () => '123456', codeHash: () => 'hash', newToken: () => 't', tokenHash: () => 'h' }));

import { sendCode } from './http';

describe('sendCode and the daily email cap', () => {
  beforeEach(() => {
    query.mockClear();
    slot.mockReset();
    send.mockClear();
  });

  it('keeps the code already received when the cap is reached', async () => {
    slot.mockResolvedValue('capped');
    expect(await sendCode('a@b.co', 'verify', 'fr')).toBe('capped');
    expect(query).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('voids the old codes, stores the new one and sends it within the cap', async () => {
    slot.mockResolvedValue('ok');
    expect(await sendCode('a@b.co', 'verify', 'fr')).toBe('sent');
    expect(query).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenCalledWith('a@b.co', 'Votre code monsalaire : 123456', 'code');
  });

  it('still stores the code without SMTP settings, as in local development', async () => {
    slot.mockResolvedValue('off');
    expect(await sendCode('a@b.co', 'reset', 'fr')).toBe('off');
    expect(query).toHaveBeenCalledTimes(2);
    expect(send).not.toHaveBeenCalled();
  });
});
