import { DASH_RE, typo } from './lib';

/**
 * Build-time rules for the Markdown of the articles (Sätteri plugins, registered in astro.config.mjs). They apply to
 * the files under src/content/articles only, and stop the build with the file and the line when a rule is broken.
 *
 * - every image has an alt text and a caption: `![What the image shows](./chart.png "Caption. Source: ...")`
 * - no em or en dash anywhere in the text
 * - an image alone in its paragraph becomes <figure> + <figcaption> (the caption is the Markdown title)
 * - tables are wrapped in a scrolling block, so a wide table never widens the page on a phone
 */

interface Pos {
  position?: { start?: { line?: number } };
}
interface Ctx {
  fileURL: URL | undefined;
}
interface HNode extends Pos {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HNode[];
}
interface HCtx extends Ctx {
  replaceNode(node: HNode, next: HNode): void;
  wrapNode(node: HNode, parent: HNode): void;
}

const ARTICLES_DIR = '/src/content/articles/';
const pathOf = (ctx: Ctx) => (ctx.fileURL ? decodeURIComponent(ctx.fileURL.pathname) : '');
const isArticle = (ctx: Ctx) => pathOf(ctx).includes(ARTICLES_DIR);
const where = (ctx: Ctx, node: Pos) => {
  const file = pathOf(ctx).split('/src/').pop() || 'article';
  const line = node.position?.start?.line;
  return `src/${file}${line ? ` (line ${line} after the front matter)` : ''}`;
};

export const articleRules = {
  name: 'monsalaire-article-rules',
  options: { position: true },
  image(node: Pos & { alt?: string | null; title?: string | null; url: string }, ctx: Ctx) {
    if (!isArticle(ctx)) return;
    if (!node.alt?.trim()) throw new Error(`${where(ctx, node)}: image ${node.url} has no alt text. Write ![what the image shows](${node.url} "Caption. Source: ...").`);
    if (!node.title?.trim()) throw new Error(`${where(ctx, node)}: image ${node.url} has no caption. Add it in quotes after the path: ![${node.alt}](${node.url} "Caption. Source: ...").`);
  },
  text(node: Pos & { value: string }, ctx: Ctx) {
    if (!isArticle(ctx)) return;
    if (DASH_RE.test(node.value)) throw new Error(`${where(ctx, node)}: em or en dash in "${node.value.trim().slice(0, 80)}". Use a colon, a comma or brackets.`);
  },
};

const isBlank = (n: HNode) => n.type === 'text' && !n.value?.trim();

export const articleFigures = {
  name: 'monsalaire-article-figures',
  // French text: non-breaking space before : ; ! ? » and after « (a colon never starts a line).
  text(node: HNode, ctx: HCtx) {
    if (!isArticle(ctx) || !pathOf(ctx).includes(`${ARTICLES_DIR}fr/`)) return;
    const value = typo(node.value ?? '', 'fr');
    if (value !== node.value) ctx.replaceNode(node, { type: 'text', value });
  },
  element: [
    {
      filter: ['p'],
      visit(node: HNode, ctx: HCtx) {
        if (!isArticle(ctx)) return;
        const kids = (node.children ?? []).filter((c) => !isBlank(c));
        const img = kids[0];
        if (kids.length !== 1 || img.type !== 'element' || img.tagName !== 'img') return;
        const caption = String(img.properties?.title ?? '').trim();
        if (!caption) return;
        const { title: _title, ...props } = img.properties ?? {};
        ctx.replaceNode(node, {
          type: 'element',
          tagName: 'figure',
          properties: { className: ['figure'] },
          children: [
            { ...img, properties: props },
            { type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: caption }] },
          ],
        });
      },
    },
    {
      filter: ['table'],
      visit(node: HNode, ctx: HCtx) {
        if (!isArticle(ctx)) return;
        ctx.wrapNode(node, { type: 'element', tagName: 'div', properties: { className: ['table-wrap'] }, children: [] });
      },
    },
  ],
};
