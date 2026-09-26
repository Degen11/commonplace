import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { withApiHandler, RATE_LIMITS } from './_shared.js';
import { loadShare, pickFeaturedQuote, SHARE_ID_RE } from './_shareData.js';
import { WORDMARK_PATH, WORDMARK_VIEWBOX, WORDMARK_ASPECT_RATIO } from '../src/components/wordmarkPath.js';
import { CAT_COLORS } from '../src/data/constants.js';

// GET /api/og?id=<shareId> — 1200×630 share card for a public collection,
// used as og:image by /c/:id pages (see share-page.js). It only renders
// quotes that were actually shared: there are deliberately no free-text
// params, so the endpoint can't be used to mint branded cards with arbitrary
// (e.g. fabricated) quotes on them.

const C = {
  bg: '#FAF8F4',
  accent: '#3C5775',
  text: '#1A1814',
  muted: '#767470',
  faint: '#A5A29B',
};

// Brand fonts, bundled with the function (see api/_fonts/ and the
// includeFiles entry in vercel.json) — no runtime CDN fetch.
const font = (file) => readFileSync(new URL(`./_fonts/${file}`, import.meta.url));
let fonts;
function loadFonts() {
  fonts ??= [
    { name: 'Satoshi', data: font('Satoshi-Regular.ttf'), weight: 400, style: 'normal' },
    { name: 'Satoshi', data: font('Satoshi-Medium.ttf'), weight: 500, style: 'normal' },
    { name: 'Satoshi', data: font('Satoshi-Bold.ttf'), weight: 700, style: 'normal' },
    { name: 'Playfair Display', data: font('PlayfairDisplay-Italic.ttf'), weight: 400, style: 'italic' },
  ];
  return fonts;
}

function truncate(str, max) {
  if (!str || str.length <= max) return str || '';
  const cut = str.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.—-]+$/, '') + '…';
}

// Helper to build virtual DOM nodes (satori expects React.createElement format).
// A childless node must get `children: undefined`, not `[]` — satori treats an
// array-typed `children` (even empty) as requiring an explicit `display` on
// every such node.
function h(type, props, ...children) {
  const kids = children.flat().filter(c => c !== null && c !== false && c !== undefined);
  return { type, props: { ...props, children: kids.length === 0 ? undefined : kids.length === 1 ? kids[0] : kids } };
}

const BOOK_ICON = [
  'M16 7C13.5 5.5 10 5 7 5C5.5 5 4 5.8 4 7.5V23.5C4 25 5.5 25.5 7 25.5C10 25.5 13.5 26.2 16 28',
  'M16 7C18.5 5.5 22 5 25 5C26.5 5 28 5.8 28 7.5V23.5C28 25 26.5 25.5 25 25.5C22 25.5 18.5 26.2 16 28',
  'M16 7V28',
];

function card({ text, source, category, count }) {
  const quote = truncate(text, 220);
  const fontSize = quote.length > 160 ? 38 : quote.length > 90 ? 46 : 56;
  const pill = CAT_COLORS[category];
  const wordmarkHeight = 36;

  return h('div', {
    style: {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      backgroundColor: C.bg, fontFamily: 'Satoshi', borderTop: `6px solid ${C.accent}`,
      borderBottom: `6px solid ${C.accent}`, padding: '52px 80px 44px',
    },
  },
    // Brand row: book icon + traced wordmark
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 14 } },
      h('svg', { width: 44, height: 44, viewBox: '0 0 32 32', fill: 'none' },
        ...BOOK_ICON.map(d => h('path', { d, stroke: C.accent, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' })),
        h('path', { d: 'M21 5V14L23 12.5L25 14V5', fill: C.accent, fillOpacity: 0.2, stroke: C.accent, strokeWidth: 1.4, strokeLinejoin: 'round' }),
      ),
      h('svg', { width: Math.round(wordmarkHeight * WORDMARK_ASPECT_RATIO), height: wordmarkHeight, viewBox: WORDMARK_VIEWBOX },
        h('path', { d: WORDMARK_PATH, fill: C.text }),
      ),
    ),

    // Featured quote
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' } },
      pill && h('div', { style: { display: 'flex' } },
        h('div', {
          style: {
            display: 'flex', fontSize: 16, fontWeight: 700, letterSpacing: '0.04em',
            color: pill.text, backgroundColor: pill.bg, borderRadius: 4, padding: '5px 12px', marginBottom: 22,
          },
        }, category.toUpperCase()),
      ),
      h('div', {
        style: { display: 'flex', fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize, lineHeight: 1.3, color: C.text },
      }, `“${quote}”`),
      source && h('div', {
        style: { display: 'flex', marginTop: 24, fontSize: 26, fontWeight: 500, color: C.muted },
      }, truncate(source, 90)),
    ),

    // Footer
    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 22, fontWeight: 500 } },
      h('div', { style: { display: 'flex', color: C.accent } },
        `A shared collection of ${count} ${count === 1 ? 'quote' : 'quotes'}`),
      h('div', { style: { display: 'flex', color: C.faint } }, 'commonplace.pro'),
    ),
  );
}

export async function renderShareCard(props) {
  const svg = await satori(card(props), { width: 1200, height: 630, fonts: loadFonts() });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}

export default withApiHandler(async (req, res, { supabase }) => {
  const id = String(req.query?.id || '');
  if (!SHARE_ID_RE.test(id)) return res.status(400).json({ error: 'Invalid share ID' });

  try {
    const result = await loadShare(supabase, id);
    if (result.status !== 'ok') {
      res.setHeader('Cache-Control', 'public, s-maxage=3600');
      return res.status(404).json({ error: 'Shared collection not found' });
    }
    const quotes = Array.isArray(result.data.quotes) ? result.data.quotes : [];
    const featured = pickFeaturedQuote(quotes);
    if (!featured) return res.status(404).json({ error: 'Shared collection is empty' });

    const png = await renderShareCard({ ...featured, count: quotes.length });
    res.setHeader('Content-Type', 'image/png');
    // Shared collections are immutable once created, so the card can be
    // cached at the edge until the share's 30-day expiry is long past.
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    return res.send(png);
  } catch (err) {
    console.error('OG image generation failed:', err?.message || err);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ error: 'Image generation failed' });
  }
}, {
  methods: ['GET'],
  // Fetched by link-preview crawlers, which send no Origin or CSRF header.
  requireAuth: false,
  rateLimit: RATE_LIMITS.OG,
  requireSupabase: true,
});
