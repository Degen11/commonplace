import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const THEMES = {
  classic: {
    bg: '#FAF8F4',
    accent: '#3C5775',
    text: '#1A1814',
    attr: '#9A9590',
    border: '#E8E3DA',
    quoteMark: 'rgba(60,87,117,0.07)',
    brand: '#3C5775',
  },
  dark: {
    bg: '#1A1D23',
    accent: '#C9A87C',
    text: '#E8E3DA',
    attr: '#8A8580',
    border: '#2E3238',
    quoteMark: 'rgba(201,168,124,0.08)',
    brand: '#C9A87C',
  },
  minimal: {
    bg: '#FFFFFF',
    accent: '#222222',
    text: '#222222',
    attr: '#888888',
    border: '#E5E5E5',
    quoteMark: 'rgba(0,0,0,0.03)',
    brand: '#222222',
  },
};

function truncate(str, max) {
  if (!str || str.length <= max) return str || '';
  return str.slice(0, max - 1) + '\u2026';
}

// Cache font data between invocations
let fontData;
async function loadFont() {
  if (fontData) return fontData;
  const res = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff');
  fontData = Buffer.from(await res.arrayBuffer());
  return fontData;
}

// Helper to build virtual DOM nodes (satori expects React.createElement format)
function h(type, props, ...children) {
  return { type, props: { ...props, children: children.length === 1 ? children[0] : children } };
}

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const text = url.searchParams.get('text') || 'Your personal library of ideas';
  const source = url.searchParams.get('source') || '';
  const styleName = url.searchParams.get('style') || 'classic';

  const theme = THEMES[styleName] || THEMES.classic;
  const displayText = truncate(text, 280);
  const displaySource = truncate(source, 120);
  const fontSize = displayText.length > 200 ? 32 : displayText.length > 100 ? 38 : 46;

  const font = await loadFont();

  // Build the card layout as virtual DOM
  const markup = h('div', {
    style: {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      backgroundColor: theme.bg, fontFamily: 'Inter', position: 'relative',
    },
  },
    // Top accent bar
    h('div', { style: { width: '100%', height: 6, backgroundColor: theme.accent } }),
    // Border
    h('div', { style: {
      position: 'absolute', top: 28, left: 28, right: 28, bottom: 28,
      border: `1.5px solid ${theme.border}`, borderRadius: 2,
    } }),
    // Content area
    h('div', { style: {
      flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '60px 72px', gap: 0,
    } },
      // Opening quote mark
      h('div', { style: {
        fontSize: 180, fontWeight: 700, color: theme.quoteMark,
        lineHeight: 0.8, marginBottom: -20, marginLeft: -8,
      } }, '\u201C'),
      // Quote text
      h('div', { style: {
        fontSize, fontStyle: 'italic', color: theme.text,
        lineHeight: 1.45, paddingLeft: 8, paddingRight: 16,
      } }, displayText),
      // Attribution
      ...(displaySource ? [
        h('div', { style: {
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 32, paddingLeft: 8,
        } },
          h('span', { style: { fontSize: 22, color: theme.accent } }, '\u2014'),
          h('span', { style: { fontSize: 22, color: theme.attr, fontWeight: 400 } }, displaySource),
        ),
      ] : []),
    ),
    // Branding
    h('div', { style: {
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      padding: '0 72px 40px', gap: 10,
    } },
      h('span', { style: { fontSize: 20, fontWeight: 700, color: theme.brand } }, 'Commonplace'),
    ),
  );

  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts: [{ name: 'Inter', data: font, weight: 400, style: 'normal' }],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const png = resvg.render().asPng();

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.send(png);
}
