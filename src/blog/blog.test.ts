import { describe, expect, it } from 'vitest';
import { articlePath, countWords, DASH_RE, pickFeatured, readingMinutes, relatedTo, RESERVED_SLUGS, SLUG_RE, themePath, typo, type PostLike } from './lib';
import { THEMES } from './themes';

const post = (slug: string, date: string, extra: Partial<PostLike> = {}): PostLike => ({
  slug,
  lang: 'fr',
  date: new Date(date),
  theme: 'smig',
  featured: false,
  translationKey: slug,
  ...extra,
});

describe('article helpers', () => {
  it('counts readable words only', () => {
    expect(countWords('# Titre\n\nUn [lien](https://x.org) et ![une image](./a.png "x").\n\n```\ncode ignored here\n```')).toBe(6);
    expect(readingMinutes('mot '.repeat(10))).toBe(1);
    expect(readingMinutes('mot '.repeat(880))).toBe(4);
  });

  it('picks the latest featured article, else the latest one', () => {
    const a = post('a', '2026-01-01', { featured: true });
    const b = post('b', '2026-03-01');
    expect(pickFeatured([a, b])).toBe(a);
    expect(pickFeatured([post('c', '2026-01-01'), b])).toBe(b);
    expect(pickFeatured([])).toBeUndefined();
  });

  it('suggests the same theme first, never the article itself or another language', () => {
    const self = post('self', '2026-05-01');
    const same = post('same', '2026-01-01');
    const other = post('other', '2026-04-01', { theme: 'impot' });
    const en = post('en', '2026-06-01', { lang: 'en' });
    expect(relatedTo(self, [self, other, same, en]).map((p) => p.slug)).toEqual(['same', 'other']);
  });

  it('builds addresses in both languages', () => {
    expect(articlePath('fr', 'smig-togo-2026')).toBe('/articles/smig-togo-2026');
    expect(articlePath('en', 'togo-minimum-wage-2026')).toBe('/en/articles/togo-minimum-wage-2026');
    expect(themePath('en', 'impot')).toBe('/en/articles/theme/tax-and-contributions');
  });

  it('keeps French punctuation on the same line as its word', () => {
    expect(typo('SMIG au Togo : le texte ?', 'fr')).toBe('SMIG au Togo : le texte ?');
    expect(typo('Togo: the law', 'en')).toBe('Togo: the law');
  });

  it('has unique theme ids and slugs, in both languages', () => {
    for (const key of ['id', 'fr', 'en'] as const) {
      const values = THEMES.map((t) => (key === 'id' ? t.id : t[key].slug));
      expect(new Set(values).size).toBe(values.length);
      values.forEach((v) => expect(v).toMatch(SLUG_RE));
    }
  });
});

// The article files themselves: checked here as well as by the build, so `npm test` catches them early.
const files = import.meta.glob('../content/articles/**/*.{md,mdx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('article files', () => {
  it('finds the articles', () => {
    expect(Object.keys(files).length).toBeGreaterThan(0);
  });
  for (const [path, raw] of Object.entries(files)) {
    const [, folder, name] = path.match(/articles\/([^/]+)\/([^/]+)\.mdx?$/) ?? [];
    it(`${folder}/${name}: folder, name and language agree, no dashes`, () => {
      expect(['fr', 'en']).toContain(folder);
      expect(name).toMatch(SLUG_RE);
      expect(RESERVED_SLUGS).not.toContain(name);
      expect(raw).toMatch(new RegExp(`^lang: ${folder}$`, 'm'));
      const line = raw.split('\n').findIndex((l) => DASH_RE.test(l));
      expect(line, `em or en dash on line ${line + 1}`).toBe(-1);
    });
  }
});
