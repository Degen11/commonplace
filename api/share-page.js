import { withApiHandler, RATE_LIMITS } from './_shared.js';
import { loadShare, pickFeaturedQuote, SHARE_ID_RE, SITE_URL } from './_shareData.js';

// GET /c/:id (rewritten here by vercel.json) — serves the normal app shell
// with collection-specific <title>, description, canonical and Open Graph /
// Twitter tags, so a shared link unfurls as its own card (og:image comes from
// /api/og?id=…) instead of the generic homepage one. The client then loads the
// collection from the path (see QuotesContext.jsx). Shared collections are
// user content with a 30-day lifetime, so the page is always noindex.

const TEMPLATE_TTL_MS = 5 * 60 * 1000;
let template = null;
let templateFetchedAt = 0;

// The built index.html (prerendered landing markup, hashed asset URLs). Fetched
// from the deployment's own origin, since dist/ isn't on the function's disk.
async function loadTemplate(origin) {
  if (template && Date.now() - templateFetchedAt < TEMPLATE_TTL_MS) return template;
  const r = await fetch(`${origin}/`, { headers: { accept: 'text/html' } });
  if (!r.ok) throw new Error(`Template fetch failed (${r.status})`);
  template = await r.text();
  templateFetchedAt = Date.now();
  return template;
}

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const clip = (s, max) => (s.length <= max ? s : s.slice(0, max - 1).trimEnd() + '…');

// Tags this page overrides. Everything else in <head> (icons, JSON-LD, the
// app's scripts and preloads) is left as the template has it.
const OVERRIDDEN_TAG_RE = new RegExp(
  '\\s*<meta (?:name|property)="(?:description|robots|og:type|og:title|og:description|og:url|og:image|og:image:[a-z]+|twitter:[a-z:]+)"[^>]*>'
  + '|\\s*<link rel="canonical"[^>]*>',
  'g',
);

export function buildMeta({ id, quotes }) {
  const url = `${SITE_URL}/c/${id}`;
  if (!quotes) {
    return {
      title: 'Shared collection not found — Commonplace',
      description: 'This shared quote collection has expired or doesn’t exist. Commonplace links last 30 days.',
      url,
      image: `${SITE_URL}/og-image.png`,
      imageAlt: 'Commonplace, the free AI quote organizer',
    };
  }
  if (quotes.length === 0) {
    // Lookup failed transiently — keep the tags generic rather than wrong.
    return {
      title: 'A shared quote collection \u2014 Commonplace',
      description: 'A quote collection shared from Commonplace, the free AI quote organizer.',
      url,
      image: `${SITE_URL}/og-image.png`,
      imageAlt: 'Commonplace, the free AI quote organizer',
    };
  }
  const count = quotes.length;
  const noun = count === 1 ? 'quote' : 'quotes';
  const featured = pickFeaturedQuote(quotes);
  const lead = featured
    ? `“${clip(featured.text, 110)}”${featured.source ? ` — ${clip(featured.source, 60)}` : ''}`
    : '';
  return {
    title: `A shared collection of ${count} ${noun} — Commonplace`,
    description: clip(`${lead}${lead ? '. ' : ''}Browse ${count} ${noun} organized with Commonplace, the free AI quote organizer.`, 200),
    url,
    image: `${SITE_URL}/api/og?id=${id}`,
    imageAlt: featured ? clip(`${featured.text}${featured.source ? ` — ${featured.source}` : ''}`, 200) : 'A shared quote collection on Commonplace',
  };
}

export function injectMeta(html, meta) {
  const tags = [
    `<meta name="description" content="${esc(meta.description)}" />`,
    '<meta name="robots" content="noindex, follow" />',
    `<link rel="canonical" href="${esc(meta.url)}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(meta.url)}" />`,
    `<meta property="og:image" content="${esc(meta.image)}" />`,
    '<meta property="og:image:type" content="image/png" />',
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${esc(meta.imageAlt)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${esc(meta.image)}" />`,
    `<meta name="twitter:image:alt" content="${esc(meta.imageAlt)}" />`,
  ].join('\n    ');
  return html
    .replace(OVERRIDDEN_TAG_RE, '')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace('</head>', `    ${tags}\n  </head>`);
}

// Fallback if the template can't be fetched: a bare page that still carries
// the share's meta tags for crawlers and bounces people into the app, which
// understands the legacy #p= form.
function fallbackPage(meta, id) {
  const head = injectMeta(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><title></title>
    <meta http-equiv="refresh" content="0;url=/#p=${id}" />
  </head>`, meta);
  return `${head}<body><p><a href="/#p=${id}">Open this shared collection on Commonplace</a></p></body></html>`;
}

export default withApiHandler(async (req, res, { supabase }) => {
  const id = String(req.query?.id || '');
  if (!SHARE_ID_RE.test(id)) {
    res.setHeader('Location', '/');
    return res.status(308).end();
  }

  let status = 200;
  let meta;
  let cacheable = true;
  try {
    if (!supabase) throw new Error('Storage not configured');
    const result = await loadShare(supabase, id);
    if (result.status === 'ok') {
      meta = buildMeta({ id, quotes: Array.isArray(result.data.quotes) ? result.data.quotes : [] });
    } else {
      status = result.status === 'expired' ? 410 : 404;
      meta = buildMeta({ id, quotes: null });
    }
  } catch (err) {
    console.error('Share page lookup error:', err?.message || err);
    // Still serve the app shell (the client does its own lookup), but don't
    // let the edge cache the generic tags.
    cacheable = false;
    meta = buildMeta({ id, quotes: [] });
  }

  // Host only (not X-Forwarded-Host): Vercel routes on it, so it's always one
  // of this project's own domains.
  const host = String(req.headers.host || '');
  const origin = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? `http://${host}` : (host ? `https://${host}` : SITE_URL);
  let html;
  try {
    html = injectMeta(await loadTemplate(origin), meta);
  } catch (err) {
    console.error('Share page template error:', err?.message || err);
    html = fallbackPage(meta, id);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', !cacheable ? 'no-store'
    : status === 200 ? 'public, max-age=0, s-maxage=3600' : 'public, max-age=0, s-maxage=300');
  return res.status(status).send(html);
}, {
  methods: ['GET'],
  // A page navigation (and link-preview crawlers) — no Origin/CSRF header.
  requireAuth: false,
  rateLimit: RATE_LIMITS.SHARE_PAGE,
});
