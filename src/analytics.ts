import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

/**
 * Vercel Web Analytics (page views) and Speed Insights (load times): anonymous and cookie-free. The hash of the
 * address carries the user's figures (#b=250000...), so it is cut off before anything is sent.
 */
const withoutHash = <T extends { url: string }>(event: T): T => ({ ...event, url: event.url.split('#')[0] });

if (import.meta.env.PROD) {
  inject({ mode: 'production', framework: 'astro', beforeSend: withoutHash });
  injectSpeedInsights({ framework: 'astro', beforeSend: withoutHash });
}
