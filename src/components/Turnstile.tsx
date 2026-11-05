import { useEffect, useRef, useState } from 'react';

/**
 * Cloudflare Turnstile widget for sign-up and the contact form (security audit MS-01). Most people never see it.
 * Renders nothing without PUBLIC_TURNSTILE_SITE_KEY (read at build time: redeploy after setting it); the server only
 * checks the token when TURNSTILE_SECRET_KEY is set too (src/server/turnstile.ts).
 */
type TurnstileApi = {
  render: (el: HTMLElement, o: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

export const TURNSTILE_KEY: string | undefined = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || undefined;

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading: Promise<void> | null = null;

function api(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
}

function load(): Promise<void> {
  if (api()) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const sc = document.createElement('script');
      sc.src = SCRIPT;
      sc.async = true;
      sc.onload = () => resolve();
      sc.onerror = () => {
        loading = null;
        reject(new Error('turnstile'));
      };
      document.head.appendChild(sc);
    });
  }
  return loading;
}

/** `version`: change it to ask for a new token (a token is good for one submission only). */
export function Turnstile({ onToken, version, lang }: { onToken: (token: string | null) => void; version: number; lang: 'fr' | 'en' }) {
  const box = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    cb.current = onToken;
  });

  useEffect(() => {
    if (!TURNSTILE_KEY) return;
    load().then(
      () => setReady(true),
      () => cb.current(null),
    );
  }, []);

  useEffect(() => {
    const t = api();
    if (!TURNSTILE_KEY || !ready || !box.current || !t) return;
    cb.current(null);
    const id = t.render(box.current, {
      sitekey: TURNSTILE_KEY,
      language: lang,
      appearance: 'interaction-only',
      callback: (token: string) => cb.current(token),
      'expired-callback': () => cb.current(null),
      'error-callback': () => cb.current(null),
    });
    return () => api()?.remove(id);
  }, [ready, version, lang]);

  if (!TURNSTILE_KEY) return null;
  return <div ref={box} className="wide" />;
}
