import library from '../../sources/sources.json';
import type { Rules } from '../engine';

interface Doc {
  id: string;
  title: string;
  publisher: string;
  date: string;
  pages?: number;
  method: string;
  used_for: string[];
  short_fr: string;
  use_fr: string;
}

const REPO = 'https://github.com/GithAlchemist/monsalaire/blob/main/sources';
const accent = (id: string) => (id.startsWith('cgi') || id.startsWith('otr') ? '#c8102e' : id.startsWith('ccit') || id.startsWith('code-travail') || id.startsWith('arrete-3790') ? '#e9b730' : '#0d6b47');
const year = (d: string) => d.slice(0, 4);

export function Library({ rules }: { rules: Rules }) {
  const docs = (library as Doc[]).filter((d) => d.id !== 'ccit-2011');
  return (
    <>
      <div className="lib">
        {docs.map((d) => (
          <a key={d.id} className="doc" href={`${REPO}/text/${d.id}.md`} target="_blank" rel="noreferrer" style={{ ['--accent' as string]: accent(d.id) }}>
            <span className="thumb" aria-hidden="true" />
            <span style={{ minWidth: 0 }}>
              <span className="d-title">{d.short_fr}</span>
              <span className="d-meta" style={{ display: 'block' }}>
                {d.publisher} · {year(d.date)}
                {d.pages ? ` · ${d.pages} p.` : ''}
              </span>
              <span className="d-use" style={{ display: 'block' }}>
                {d.use_fr}
              </span>
            </span>
          </a>
        ))}
      </div>
      <div className="limits">
        <div className="card">
          <h3>Ce qui reste à trancher</h3>
          <p className="lead">Les textes laissent ces points ouverts. Le choix du simulateur est indiqué.</p>
          <ul>
            {rules.open_questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Ce que le simulateur ne couvre pas encore</h3>
          <p className="lead">Pour un salarié du privé au régime général, le reste est pris en compte.</p>
          <ul>
            {rules.not_modeled.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
