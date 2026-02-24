import { useEffect, useMemo, useState } from "react";

// ─── Commonplace accent ───────────────────────────────────────────────────────
// Desaturated slate-blue. Cool enough to cut through the warm sand palette,
// dark enough to feel grounded rather than "tech-blue".
export const CP_ACCENT = "#3C5775";
export const CP_ACCENT_MUTED = "rgba(60,87,117,0.12)"; // for borders / tints

const RAW_LINES = [
  "you miss 100% of the shots you don't take",
  "all those moments will be lost in time",
  "the unexamined life is not worth living",
  '"Be the change" (Gandhi)',
  "is this the real life is this just fantasy",
];

const RESULT_CARDS = [
  { tag: "Person", tagBg: "#EEF2F7", tagColor: CP_ACCENT,    text: "You miss 100% of the shots you don't take", source: "Wayne Gretzky" },
  { tag: "Film",   tagBg: "#F3E8FF", tagColor: "#7C3AED",    text: "All those moments will be lost in time",    source: "Blade Runner (1982)" },
  { tag: "Person", tagBg: "#EEF2F7", tagColor: CP_ACCENT,    text: "The unexamined life is not worth living",   source: "Socrates" },
  { tag: "Person", tagBg: "#EEF2F7", tagColor: CP_ACCENT,    text: "Be the change",                            source: "Mahatma Gandhi" },
  { tag: "Music",  tagBg: "#FFE4E6", tagColor: "#E11D48",    text: "Is this the real life, is this just fantasy", source: "Queen" },
];

// ─── Inner animation — remounts each loop via key prop ────────────────────────
function AnimInner({ onComplete = () => {} }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [visibleCards, setVisibleCards] = useState([]);
  const [phase, setPhase]   = useState("before");  // before | processing | after
  const [lightness, setLightness] = useState(0);   // 0 = dark, 1 = light (drives interpolation)

  useEffect(() => {
    const ts = [];
    const t = (ms, fn) => { const id = setTimeout(fn, ms); ts.push(id); return id; };

    setVisibleLines([]);
    setVisibleCards([]);
    setPhase("before");
    setLightness(0);

    // Stagger raw lines in
    RAW_LINES.forEach((_, i) => t(300 + i * 500, () => {
      setVisibleLines(p => [...p, i]);
    }));

    const doneTyping = 300 + RAW_LINES.length * 500 + 900;

    t(doneTyping, () => setPhase("processing"));

    const showAt = doneTyping + 1200;

    // Ease the surface toward light *before* the cards arrive so the flip
    // is smooth and not competing with card animations
    t(showAt - 500, () => setLightness(0.45));  // midpoint
    t(showAt,       () => {
      setPhase("after");
      t(60,  () => setLightness(1));            // finish the fade once cards start

      RESULT_CARDS.forEach((_, i) => t(i * 230, () => {
        setVisibleCards(p => [...p, i]);
      }));
    });

    t(showAt + RESULT_CARDS.length * 230 + 2600, () => onComplete?.());

    return () => ts.forEach(clearTimeout);
  }, [onComplete]);

  // ── Dot animation ──
  const dotStyle = (delay, color) => ({
    width: 6, height: 6, borderRadius: "50%",
    background: color, display: "inline-block",
    animation: "tpDot 1.2s ease-in-out infinite",
    animationDelay: delay,
  });

  // ── Interpolate between dark (0) and light (1) ────────────────────────────
  // Using a hand-rolled lerp so we control exactly which values cross-fade,
  // avoiding the jarring instant snap that happened before.
  const ui = useMemo(() => {
    const l = lightness; // 0–1

    const lerp = (a, b) => {
      // Accepts hex strings and rgba — for simplicity we just return one or the other
      // and let the CSS transition handle the actual visual smoothing.
      return l < 0.5 ? a : b;
    };

    // Outer surface: dark warm → page background
    const surfaceBg = l === 0
      ? "#1A1918"
      : l < 0.5
        ? "#252220"
        : "#FFFFFF";  // Pure white — distinct from the #FAF8F4 page, gives real lift

    // Chrome bar
    const chromeBg = l < 0.5 ? "#141312" : "#F5F1EB";

    return {
      surfaceBg,
      surfaceShadow: l < 0.5
        ? "0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.14)"
        : "0 2px 0 rgba(60,87,117,0.06), 0 8px 40px rgba(60,87,117,0.10), 0 2px 12px rgba(26,24,20,0.06)",

      chromeBg,
      chromeBorder: l < 0.5 ? "#2A2826" : "rgba(60,87,117,0.10)",
      chromeText:   l < 0.5 ? "#6B6764" : CP_ACCENT,

      dots: l < 0.5 ? "#9A9591" : CP_ACCENT,

      caret:   l < 0.5 ? "#3D3B38" : "rgba(55,53,47,0.25)",
      rawText: l < 0.5 ? "#8A8581" : "#6A6660",

      // ── After cards: white with accent-tinted border + soft shadow ──
      // This is the key fix — white bg floats off the page, accent border
      // provides identity, shadow gives depth without being heavy.
      cardBg:     "#FFFFFF",
      cardBorder: `rgba(60,87,117,0.14)`,
      cardShadow: "0 1px 4px rgba(60,87,117,0.07), 0 0 0 1px rgba(60,87,117,0.08)",
      cardText:   l < 0.5 ? "#C8C3BC" : "#37352F",
      cardSrc:    l < 0.5 ? "#5A5855" : "#9B9A97",
    };
  }, [lightness]);

  return (
    <>
      <style>{`
        @keyframes tpDot{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: 800,
          margin: "52px auto 0",
          borderRadius: 14,
          overflow: "hidden",
          background: ui.surfaceBg,
          boxShadow: ui.surfaceShadow,
          // Longer transition so the surface eases in over 600ms instead of snapping
          transition: "background 600ms ease, box-shadow 600ms ease",
        }}
      >
        {/* Chrome bar */}
        <div
          style={{
            padding: "11px 18px",
            background: ui.chromeBg,
            borderBottom: `1px solid ${ui.chromeBorder}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            transition: "background 600ms ease, border-color 600ms ease",
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            {["#FF5F57", "#FFBD2E", "#28C840"].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.9 }} />
            ))}
          </div>

          <span
            style={{
              fontFamily: "'SF Mono','DM Mono',Menlo,monospace",
              fontSize: 14,
              fontWeight: 500,
              color: ui.chromeText,
              marginLeft: 6,
              transition: "color 600ms ease",
            }}
          >
            {phase === "before"
              ? "quotes.txt"
              : phase === "processing"
                ? "identifying…"
                : "collection — organized ✓"}
          </span>

          {phase === "processing" && (
            <div style={{ marginLeft: "auto", display: "flex", gap: 5, alignItems: "center" }}>
              <span style={dotStyle("0s",   ui.dots)} />
              <span style={dotStyle("0.2s", ui.dots)} />
              <span style={dotStyle("0.4s", ui.dots)} />
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "22px 26px", minHeight: 228 }}>

          {/* BEFORE / PROCESSING */}
          {phase !== "after" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {RAW_LINES.map((line, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    opacity: visibleLines.includes(i)
                      ? (phase === "processing" ? 0.3 : 1)
                      : 0,
                    transform: visibleLines.includes(i) ? "translateY(0)" : "translateY(8px)",
                    transition: "opacity 0.4s ease, transform 0.4s ease",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'SF Mono','DM Mono',Menlo,monospace",
                      color: ui.caret,
                      fontSize: 12,
                      flexShrink: 0,
                      transition: "color 600ms ease",
                    }}
                  >
                    ›
                  </span>
                  <span
                    style={{
                      fontFamily: "'SF Mono','DM Mono',Menlo,monospace",
                      fontSize: 12.5,
                      color: ui.rawText,
                      lineHeight: 1.4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      transition: "color 600ms ease",
                    }}
                  >
                    {line}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* AFTER — result cards */}
          {phase === "after" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {RESULT_CARDS.map((card, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 13px",
                    background: ui.cardBg,
                    borderRadius: 8,
                    border: `1px solid ${ui.cardBorder}`,
                    boxShadow: ui.cardShadow,
                    opacity: visibleCards.includes(i) ? 1 : 0,
                    transform: visibleCards.includes(i) ? "translateY(0)" : "translateY(10px)",
                    transition: "opacity 0.38s ease, transform 0.38s ease",
                  }}
                >
                  {/* Category tag — now uses accent for "Person" */}
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: card.tagBg,
                      color: card.tagColor,
                      letterSpacing: 0.6,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      textTransform: "uppercase",
                      fontFamily: "'SF Mono','DM Mono',Menlo,monospace",
                    }}
                  >
                    {card.tag}
                  </span>

                  <span
                    style={{
                      fontFamily: "'SF Mono','DM Mono',Menlo,monospace",
                      fontSize: 12,
                      color: ui.cardText,
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      transition: "color 600ms ease",
                    }}
                  >
                    "{card.text}"
                  </span>

                  <span
                    style={{
                      fontFamily: "'SF Mono','DM Mono',Menlo,monospace",
                      fontSize: 11,
                      color: ui.cardSrc,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "color 600ms ease",
                    }}
                  >
                    {card.source}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function TransformPreview() {
  const [key, setKey] = useState(0);
  return <AnimInner key={key} onComplete={() => setKey(k => k + 1)} />;
}