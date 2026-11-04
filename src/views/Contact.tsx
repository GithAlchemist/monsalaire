import { useState, type FormEvent } from 'react';
import { Icon } from '../components/fields';
import { useRoute } from '../i18n';

/** Contact page: the message is stored and forwarded to monsalaire@aconta.io; the reply comes back to the sender. */
/** The contact form itself, used on the Contact page and at the end of the Legal texts page. */
export function ContactForm() {
  const { t, lang } = useRoute();
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState('busy');
    setError('');
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: f.get('name'), email: f.get('email'), message: f.get('message'), website: f.get('website'), lang }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) return setState('sent');
      const m: Record<string, string> = {
        name: t('Indiquez votre nom.', 'Please give your name.'),
        email: t('Cette adresse email ne semble pas valide.', 'That email address does not look right.'),
        message: t('Votre message est un peu court.', 'Your message is a little short.'),
        too_many: t('Trop de messages envoyés. Réessayez dans une heure.', 'Too many messages sent. Try again in an hour.'),
      };
      setError(m[d.error] ?? t('L’envoi a échoué. Écrivez-nous directement à monsalaire@aconta.io.', 'Sending failed. Write to us directly at monsalaire@aconta.io.'));
    } catch {
      setError(t('L’envoi a échoué. Écrivez-nous directement à monsalaire@aconta.io.', 'Sending failed. Write to us directly at monsalaire@aconta.io.'));
    }
    setState('idle');
  };

  return (
    <>
      {state === 'sent' ? (
        <p className="contact-sent" role="status">
          {t('Merci, votre message est bien parti. Nous vous répondons par email.', 'Thank you, your message is on its way. We will reply by email.')}
        </p>
      ) : (
        <form className="contact-form" onSubmit={submit}>
          <label className="acct-field">
            <span>{t('Votre nom', 'Your name')}</span>
            <input name="name" required maxLength={120} autoComplete="name" />
          </label>
          <label className="acct-field">
            <span>{t('Votre email', 'Your email')}</span>
            <input name="email" type="email" required maxLength={254} autoComplete="email" />
          </label>
          <label className="acct-field wide">
            <span>{t('Votre message', 'Your message')}</span>
            <textarea name="message" required minLength={10} maxLength={5000} rows={7} />
          </label>
          <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <div className="wide">
            <button className="btn primary" disabled={state === 'busy'}>
              {t('Envoyer', 'Send')}
            </button>
          </div>
          {error && (
            <p className="acct-error wide" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </>
  );
}

export function Contact() {
  const { t } = useRoute();
  return (
    <article className="doc-page narrow">
      <header className="page-hero">
        <h1>{t('Nous écrire', 'Contact us')}</h1>
        <p className="lead">{t('Une question, une règle qui vous semble fausse, une idée pour le simulateur ? Nous lisons chaque message et répondons par email.', 'A question, a rule that looks wrong, an idea for the simulator? We read every message and reply by email.')}</p>
      </header>
      <div className="ecrire-grid">
        <div>
          <ContactForm />
        </div>
        <Creator />
      </div>
    </article>
  );
}

/** The card about the person behind monsalaire, next to the contact form (under it on phones). */
export function Creator() {
  const { t } = useRoute();
  return (
    <aside className="creator" aria-label={t('Derrière monsalaire', 'Behind monsalaire')}>
      <div className="creator-head">
        <img src="/brand/kevin.jpg" alt="Kévin Amoussou" width="88" height="88" loading="lazy" />
        <div>
          <span className="creator-k">{t('Derrière monsalaire', 'Behind monsalaire')}</span>
          <strong>Kévin Amoussou</strong>
          <span className="creator-role">{t('Fondateur d’Aconta · Lomé', 'Founder of Aconta · Lomé')}</span>
        </div>
      </div>
      <p>
        {t(
          'Formé en comptabilité, contrôle et audit, il travaille entre stratégie business et data. Il a créé Aconta pour que les petites entreprises suivent leur argent sans cahier, et monsalaire parce que trop de salariés découvrent leur net le jour de la paie.',
          'Trained in accounting, control and audit, he works between business strategy and data. He built Aconta so small businesses can track their money without a notebook, and monsalaire because too many employees only discover their net pay on payday.',
        )}
      </p>
      <ul className="creator-facts">
        <li>{t('Master en comptabilité, contrôle et audit', 'Master’s in accounting, control and audit')}</li>
        <li>{t('Stratégie, market intelligence et data', 'Strategy, market intelligence and data')}</li>
        <li>{t('Outils libres et gratuits, publiés par Aconta', 'Free, open-source tools, published by Aconta')}</li>
      </ul>
      <div className="creator-links">
        <a className="btn primary" href="https://kevin.aconta.io" target="_blank" rel="author noopener">
          {t('Voir son parcours', 'See his story')}
          <Icon.arrow />
        </a>
        <a className="creator-in" href="https://www.linkedin.com/in/kevin-amoussou" target="_blank" rel="noopener">
          LinkedIn
        </a>
      </div>
    </aside>
  );
}
