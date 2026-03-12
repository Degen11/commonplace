import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

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

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text') || '';
  const source = searchParams.get('source') || '';
  const styleName = searchParams.get('style') || 'classic';

  if (!text) {
    return new Response('Missing "text" query parameter', { status: 400 });
  }

  const theme = THEMES[styleName] || THEMES.classic;
  const displayText = truncate(text, 280);
  const displaySource = truncate(source, 120);

  // Scale font size based on text length
  const fontSize = displayText.length > 200 ? 32 : displayText.length > 100 ? 38 : 46;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.bg,
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div style={{ width: '100%', height: 6, backgroundColor: theme.accent }} />

        {/* Border */}
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            border: `1.5px solid ${theme.border}`,
            borderRadius: 2,
          }}
        />

        {/* Content area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '60px 72px',
            gap: 0,
          }}
        >
          {/* Opening quote mark */}
          <div
            style={{
              fontSize: 180,
              fontWeight: 700,
              color: theme.quoteMark,
              lineHeight: 0.8,
              marginBottom: -20,
              marginLeft: -8,
            }}
          >
            {'\u201C'}
          </div>

          {/* Quote text */}
          <div
            style={{
              fontSize,
              fontStyle: 'italic',
              color: theme.text,
              lineHeight: 1.45,
              paddingLeft: 8,
              paddingRight: 16,
            }}
          >
            {displayText}
          </div>

          {/* Attribution */}
          {displaySource && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 32,
                paddingLeft: 8,
              }}
            >
              <span style={{ fontSize: 22, color: theme.accent }}>{'\u2014'}</span>
              <span
                style={{
                  fontSize: 22,
                  color: theme.attr,
                  fontFamily: 'sans-serif',
                  fontWeight: 400,
                }}
              >
                {displaySource}
              </span>
            </div>
          )}
        </div>

        {/* Branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 72px 40px',
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: theme.brand,
              fontFamily: 'Georgia, serif',
            }}
          >
            Commonplace
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
