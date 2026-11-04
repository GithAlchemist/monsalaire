import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRoute } from '../i18n';
import { Icon } from './fields';

type Account = { email: string; lang: string; newsletter: boolean };
type Step = 'signup' | 'login' | 'verify' | 'forgot' | 'reset' | 'done';

async function call(action: string, body: Record<string, unknown> = {}) {
  const r = await fetch(`/api/account/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: r.status, data: (await r.json().catch(() => ({}))) as { error?: string; step?: Step; account?: Account } };
}

/**
 * The account offer shown under the payslip. The simulator never needs an account; this only signs people up to
 * receive monsalaire's salary analyses. Email and password, email confirmed by a six-digit code.
 */
export function AccountOffer() {
  const { t, lang } = useRoute();
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [off, setOff] = useState(false);
  const [googleId, setGoogleId] = useState<string | null>(null);
  const googleBox = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/account/me')
      .then((r) => (r.ok ? r.json() : { account: null, off: true }))
      .then((d) => {
        setOff(Boolean(d.off));
        setGoogleId(d.google ?? null);
        setAccount(d.account ?? null);
      })
      .catch(() => setOff(true));
  }, []);

  const messages: Record<string, string> = {
    email: t('Cette adresse email ne semble pas valide.', 'That email address does not look right.'),
    password: t('Le mot de passe doit faire au moins 8 caractères.', 'The password needs at least 8 characters.'),
    code: t('Ce code n’est pas bon ou a expiré.', 'That code is wrong or has expired.'),
    credentials: t('Email ou mot de passe incorrect.', 'Wrong email or password.'),
    too_many: t('Trop d’essais. Réessayez dans quelques minutes.', 'Too many attempts. Try again in a few minutes.'),
    server: t('Le service ne répond pas. Réessayez plus tard.', 'The service is not responding. Try again later.'),
    google: t('La connexion avec Google n’a pas abouti.', 'Signing in with Google did not work.'),
  };

  // "Continue with Google": Google's own button; its ID token is checked by our server (not by Supabase Auth).
  const showGoogle = Boolean(googleId) && (step === 'signup' || step === 'login') && !account;
  useEffect(() => {
    if (!showGoogle || !googleId || !googleBox.current) return;
    const box = googleBox.current;
    const render = () => {
      const g = (window as unknown as { google?: { accounts: { id: { initialize: (o: object) => void; renderButton: (el: HTMLElement, o: object) => void } } } }).google;
      if (!g) return;
      g.accounts.id.initialize({
        client_id: googleId,
        callback: async (res: { credential: string }) => {
          setBusy(true);
          setError('');
          const { data } = await call('google', { credential: res.credential, lang });
          if (data.account) {
            setAccount(data.account);
            setStep('done');
          } else setError(messages[data.error ?? ''] ?? messages.google);
          setBusy(false);
        },
      });
      g.accounts.id.renderButton(box, { theme: 'outline', size: 'large', text: step === 'login' ? 'signin_with' : 'continue_with', locale: lang, width: 280 });
    };
    if ((window as unknown as { google?: unknown }).google) render();
    else {
      const sc = document.createElement('script');
      sc.src = 'https://accounts.google.com/gsi/client';
      sc.async = true;
      sc.onload = render;
      document.head.appendChild(sc);
    }
  }, [showGoogle, googleId, step, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = async (e: FormEvent, action: string, body: Record<string, unknown>) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await call(action, { ...body, lang });
      if (data.error) setError(messages[data.error] ?? messages.server);
      else if (data.account) {
        setAccount(data.account);
        setStep('done');
      } else if (data.step) {
        setCode('');
        setStep(data.step);
      }
    } catch {
      setError(messages.server);
    }
    setBusy(false);
  };

  const logout = async () => {
    await call('logout');
    setAccount(null);
    setStep('login');
  };
  const remove = async () => {
    if (!window.confirm(t('Supprimer votre compte et votre adresse email ? Vous ne recevrez plus rien.', 'Delete your account and email address? You will no longer receive anything.'))) return;
    await call('delete');
    setAccount(null);
    setStep('signup');
  };

  if (off || account === undefined) return null;

  if (account) {
    return (
      <section className="acct acct-in" aria-label={t('Votre compte', 'Your account')}>
        <p>
          {step === 'done' ? t('C’est fait. ', 'All set. ') : ''}
          {t('Vous recevrez nos analyses salariales sur', 'You will receive our salary analyses at')} <b>{account.email}</b>.
        </p>
        <div className="acct-links">
          <button type="button" className="linkish" onClick={logout}>
            {t('Se déconnecter', 'Log out')}
          </button>
          <button type="button" className="linkish" onClick={remove}>
            {t('Supprimer mon compte', 'Delete my account')}
          </button>
        </div>
      </section>
    );
  }

  const honeypot = <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />;
  const emailField = (
    <label className="acct-field">
      <span>{t('Email', 'Email')}</span>
      <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
    </label>
  );
  const passwordField = (label: string, auto: string) => (
    <label className="acct-field">
      <span>{label}</span>
      <input type="password" required minLength={8} autoComplete={auto} value={password} onChange={(e) => setPassword(e.target.value)} />
    </label>
  );
  const codeField = (
    <label className="acct-field">
      <span>{t('Code reçu par email', 'Code from the email')}</span>
      <input inputMode="numeric" pattern="\d{6}" maxLength={6} required autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
    </label>
  );

  return (
    <section className="acct" aria-labelledby="acct-title">
      <div className="acct-pitch">
        <h2 id="acct-title">
          <Icon.book />
          {t('Recevez nos analyses salariales', 'Get our salary analyses')}
        </h2>
        <p>
          {t(
            'SMIG, impôts, comparaisons entre pays : nos articles et nos analyses par email, deux fois par mois au plus. Il suffit de votre compte Google ou d’un email et d’un mot de passe, et vous pouvez supprimer votre compte en un clic. Le simulateur reste libre, sans compte.',
            'Minimum wages, tax, country comparisons: our articles and analyses by email, twice a month at most. All it takes is your Google account or an email and a password, and you can delete your account in one click. The simulator stays free, with no account.',
          )}
        </p>
      </div>

      {step === 'signup' && (
        <form className="acct-form" onSubmit={(e) => go(e, 'signup', { email, password, website: (e.currentTarget.elements.namedItem('website') as HTMLInputElement)?.value })}>
          {googleId && (
            <>
              <div className="acct-google" ref={googleBox} />
              <p className="acct-or">{t('ou avec votre email', 'or with your email')}</p>
            </>
          )}
          {emailField}
          {passwordField(t('Mot de passe (8 caractères au moins)', 'Password (at least 8 characters)'), 'new-password')}
          {honeypot}
          <button className="btn primary" disabled={busy}>
            {t('Créer mon compte', 'Create my account')}
          </button>
          <p className="acct-alt">
            {t('Déjà inscrit ?', 'Already signed up?')}{' '}
            <button type="button" className="linkish" onClick={() => setStep('login')}>
              {t('Se connecter', 'Log in')}
            </button>
          </p>
        </form>
      )}

      {step === 'login' && (
        <form className="acct-form" onSubmit={(e) => go(e, 'login', { email, password })}>
          {googleId && (
            <>
              <div className="acct-google" ref={googleBox} />
              <p className="acct-or">{t('ou avec votre email', 'or with your email')}</p>
            </>
          )}
          {emailField}
          {passwordField(t('Mot de passe', 'Password'), 'current-password')}
          <button className="btn primary" disabled={busy}>
            {t('Se connecter', 'Log in')}
          </button>
          <p className="acct-alt">
            <button type="button" className="linkish" onClick={() => setStep('forgot')}>
              {t('Mot de passe oublié', 'Forgot your password')}
            </button>
            {' · '}
            <button type="button" className="linkish" onClick={() => setStep('signup')}>
              {t('Créer un compte', 'Create an account')}
            </button>
          </p>
        </form>
      )}

      {step === 'verify' && (
        <form className="acct-form" onSubmit={(e) => go(e, 'verify', { email, code })}>
          <p className="acct-note">
            {t('Si cette adresse n’a pas encore de compte, un code à six chiffres vient de partir vers', 'If this address has no account yet, a six-digit code has just been sent to')} <b>{email}</b>.{' '}
            {t('Déjà inscrit ? Connectez-vous plutôt.', 'Already signed up? Log in instead.')}
          </p>
          {codeField}
          <button className="btn primary" disabled={busy}>
            {t('Confirmer', 'Confirm')}
          </button>
          <p className="acct-alt">
            <button type="button" className="linkish" onClick={() => setStep('login')}>
              {t('Se connecter', 'Log in')}
            </button>
          </p>
        </form>
      )}

      {step === 'forgot' && (
        <form className="acct-form" onSubmit={(e) => go(e, 'forgot', { email })}>
          {emailField}
          <button className="btn primary" disabled={busy}>
            {t('Recevoir un code', 'Send me a code')}
          </button>
          <p className="acct-alt">
            <button type="button" className="linkish" onClick={() => setStep('login')}>
              {t('Retour', 'Back')}
            </button>
          </p>
        </form>
      )}

      {step === 'reset' && (
        <form className="acct-form" onSubmit={(e) => go(e, 'reset', { email, code, password })}>
          <p className="acct-note">
            {t('Si un compte existe pour', 'If an account exists for')} <b>{email}</b>, {t('un code vient de lui être envoyé.', 'a code has just been sent to it.')}
          </p>
          {codeField}
          {passwordField(t('Nouveau mot de passe', 'New password'), 'new-password')}
          <button className="btn primary" disabled={busy}>
            {t('Changer le mot de passe', 'Change the password')}
          </button>
        </form>
      )}

      {error && (
        <p className="acct-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
