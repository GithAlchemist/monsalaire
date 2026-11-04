import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { Link, useRoute, type Lang } from '../i18n';
import { Icon } from './fields';

export type Account = { email: string; lang: string; newsletter: boolean; picture?: string | null };
type Step = 'signup' | 'login' | 'verify' | 'forgot' | 'reset' | 'done';
type Me = { loaded: boolean; off: boolean; google: string | null; account: Account | null };

async function call(action: string, body: Record<string, unknown> = {}) {
  const r = await fetch(`/api/account/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: r.status, data: (await r.json().catch(() => ({}))) as { error?: string; step?: Step; account?: Account } };
}

/* One account state for the whole page (header button, profile menu, offer under the payslip). */
let me: Me = { loaded: false, off: true, google: null, account: null };
const listeners = new Set<() => void>();
const setMe = (patch: Partial<Me>) => {
  me = { ...me, ...patch };
  listeners.forEach((l) => l());
};
let started = false;
function load() {
  if (started) return;
  started = true;
  fetch('/api/account/me')
    .then((r) => (r.ok ? r.json() : { off: true }))
    .then((d) => setMe({ loaded: true, off: Boolean(d.off), google: d.google ?? null, account: d.account ?? null }))
    .catch(() => setMe({ loaded: true, off: true }));
}
const SERVER_ME: Me = { loaded: false, off: true, google: null, account: null };
export function useMe(): Me {
  useEffect(load, []);
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => me,
    () => SERVER_ME,
  );
}

/** Signup, login, code, forgotten password and Google: shared by the header dialog and the offer under the payslip. */
function AuthForms({ start, onDone }: { start: 'signup' | 'login'; onDone?: () => void }) {
  const { t, lang } = useRoute();
  const { google } = useMe();
  const googleBox = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>(start);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const messages: Record<string, string> = {
    email: t('Cette adresse email ne semble pas valide.', 'That email address does not look right.'),
    password: t('Le mot de passe doit faire au moins 8 caractères.', 'The password needs at least 8 characters.'),
    code: t('Ce code n’est pas bon ou a expiré.', 'That code is wrong or has expired.'),
    credentials: t('Email ou mot de passe incorrect.', 'Wrong email or password.'),
    too_many: t('Trop d’essais. Réessayez dans quelques minutes.', 'Too many attempts. Try again in a few minutes.'),
    server: t('Le service ne répond pas. Réessayez plus tard.', 'The service is not responding. Try again later.'),
    google: t('La connexion avec Google n’a pas abouti.', 'Signing in with Google did not work.'),
  };

  const signedIn = (a: Account) => {
    setMe({ account: a });
    setStep('done');
    onDone?.();
  };

  // "Continue with Google": Google's own button; its ID token is checked by our server (not by Supabase Auth).
  const showGoogle = Boolean(google) && (step === 'signup' || step === 'login');
  useEffect(() => {
    if (!showGoogle || !google || !googleBox.current) return;
    const box = googleBox.current;
    const render = () => {
      const g = (window as unknown as { google?: { accounts: { id: { initialize: (o: object) => void; renderButton: (el: HTMLElement, o: object) => void } } } }).google;
      if (!g) return;
      g.accounts.id.initialize({
        client_id: google,
        callback: async (res: { credential: string }) => {
          setBusy(true);
          setError('');
          const { data } = await call('google', { credential: res.credential, lang });
          if (data.account) signedIn(data.account);
          else setError(messages[data.error ?? ''] ?? messages.google);
          setBusy(false);
        },
      });
      g.accounts.id.renderButton(box, { theme: 'outline', size: 'large', text: step === 'login' ? 'signin_with' : 'continue_with', locale: lang, width: Math.min(320, box.clientWidth || 280) });
    };
    if ((window as unknown as { google?: unknown }).google) render();
    else {
      const sc = document.createElement('script');
      sc.src = 'https://accounts.google.com/gsi/client';
      sc.async = true;
      sc.onload = render;
      document.head.appendChild(sc);
    }
  }, [showGoogle, google, step, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = async (e: FormEvent, action: string, body: Record<string, unknown>) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await call(action, { ...body, lang });
      if (data.error) setError(messages[data.error] ?? messages.server);
      else if (data.account) signedIn(data.account);
      else if (data.step) {
        setCode('');
        setStep(data.step);
      }
    } catch {
      setError(messages.server);
    }
    setBusy(false);
  };

  const googleBlock = google && (
    <>
      <div className="acct-google" ref={googleBox} />
      <p className="acct-or">{t('ou avec votre email', 'or with your email')}</p>
    </>
  );
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
    <div className="auth">
      {step === 'signup' && (
        <form className="acct-form" onSubmit={(e) => go(e, 'signup', { email, password, website: (e.currentTarget.elements.namedItem('website') as HTMLInputElement)?.value })}>
          {googleBlock}
          {emailField}
          {passwordField(t('Mot de passe (8 caractères au moins)', 'Password (at least 8 characters)'), 'new-password')}
          <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
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
          {googleBlock}
          {emailField}
          {passwordField(t('Mot de passe', 'Password'), 'current-password')}
          <button className="btn primary" disabled={busy}>
            {t('Se connecter', 'Log in')}
          </button>
          <p className="acct-alt">
            {t('Pas encore de compte ?', 'No account yet?')}{' '}
            <button type="button" className="linkish" onClick={() => setStep('signup')}>
              {t('Créer un compte', 'Create one')}
            </button>
            {' · '}
            <button type="button" className="linkish" onClick={() => setStep('forgot')}>
              {t('Mot de passe oublié', 'Forgot your password')}
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
    </div>
  );
}

async function logout() {
  await call('logout');
  setMe({ account: null });
}
async function removeAccount(confirmText: string) {
  if (!window.confirm(confirmText)) return;
  await call('delete');
  setMe({ account: null });
}

/** Round avatar: the Google photo when there is one, else the first letter of the email. */
function Avatar({ account, size = 32 }: { account: Account; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (account.picture && !broken) {
    return <img className="avatar" src={account.picture} alt="" width={size} height={size} referrerPolicy="no-referrer" onError={() => setBroken(true)} />;
  }
  return (
    <span className="avatar letter" style={{ width: size, height: size }} aria-hidden="true">
      {account.email.charAt(0).toUpperCase()}
    </span>
  );
}

/** The other language, as a menu item: on phones the language lives in the account menu (Kévin, 4 November 2026). */
function LangItem({ onPick }: { onPick: () => void }) {
  const { lang, page, altHref } = useRoute();
  const other: Lang = lang === 'fr' ? 'en' : 'fr';
  const inner = (
    <>
      <Icon.globe />
      <span>{other === 'en' ? 'Read in English' : 'Lire en français'}</span>
    </>
  );
  if (altHref)
    return (
      <a className="pop-item" href={altHref} hrefLang={other} lang={other} onClick={onPick}>
        {inner}
      </a>
    );
  return (
    <Link className="pop-item" to={page} lang={other} hrefLang={other} onClick={onPick}>
      {inner}
    </Link>
  );
}

const isPhone = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 520px)').matches;

/**
 * Header: "Se connecter" when signed out (opens a dialog, login first, signup one click away);
 * the avatar and a small menu (email, log out, delete) when signed in.
 */
export function AccountButton() {
  const { t } = useRoute();
  const { loaded, off, account } = useMe();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menu.current && !menu.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!loaded || off) return null;

  if (account) {
    return (
      <div className="acct-menu" ref={menu}>
        <button type="button" className="btn icon avatar-btn acct-entry" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} title={account.email}>
          <Avatar account={account} />
        </button>
        {open && (
          <div className="acct-pop" role="menu">
            <div className="acct-pop-head">
              <Avatar account={account} size={40} />
              <div>
                <strong>{t('Votre compte', 'Your account')}</strong>
                <span>{account.email}</span>
              </div>
            </div>
            <p className="acct-pop-note">{t('Vous recevez nos analyses salariales par email.', 'You receive our salary analyses by email.')}</p>
            <div className="phone-only">
              <LangItem onPick={() => setOpen(false)} />
            </div>
            <button type="button" role="menuitem" onClick={() => logout().then(() => setOpen(false))}>
              {t('Se déconnecter', 'Log out')}
            </button>
            <button type="button" role="menuitem" className="danger" onClick={() => removeAccount(t('Supprimer votre compte et votre adresse email ? Vous ne recevrez plus rien.', 'Delete your account and email address? You will no longer receive anything.'))}>
              {t('Supprimer mon compte', 'Delete my account')}
            </button>
          </div>
        )}
      </div>
    );
  }

  const openDialog = () => {
    setOpen(false);
    dialog.current?.showModal();
  };
  return (
    <div className="acct-menu acct-entry" ref={menu}>
      <button type="button" className="btn has-label signin-btn" aria-label={t('Se connecter', 'Log in')} onClick={() => (isPhone() ? setOpen(!open) : openDialog())}>
        <Icon.user />
        <span className="label-md">{t('Se connecter', 'Log in')}</span>
      </button>
      {open && (
        <div className="acct-pop" role="menu">
          <button type="button" role="menuitem" className="pop-item" onClick={openDialog}>
            <Icon.user />
            <span>{t('Se connecter ou créer un compte', 'Log in or create an account')}</span>
          </button>
          <LangItem onPick={() => setOpen(false)} />
        </div>
      )}
      <dialog className="auth-dialog" ref={dialog} onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
        <div className="auth-dialog-in">
          <div className="auth-dialog-head">
            <h2>{t('Votre compte monsalaire', 'Your monsalaire account')}</h2>
            <button type="button" className="btn icon" onClick={() => dialog.current?.close()} aria-label={t('Fermer', 'Close')}>
              <Icon.x />
            </button>
          </div>
          <p className="acct-note">{t('Le simulateur reste libre, sans compte. Le compte sert à recevoir nos analyses salariales.', 'The simulator stays free, with no account. The account is for receiving our salary analyses.')}</p>
          <AuthForms start="login" onDone={() => dialog.current?.close()} />
        </div>
      </dialog>
    </div>
  );
}

/**
 * The discreet offer under the payslip: it pushes people to sign up to receive the salary analyses. Hidden when the
 * visitor is already signed in.
 */
export function AccountOffer() {
  const { t } = useRoute();
  const { loaded, off, account } = useMe();
  if (!loaded || off || account) return null;
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
      <AuthForms start="signup" />
    </section>
  );
}
