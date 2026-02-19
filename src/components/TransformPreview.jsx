import { useEffect, useMemo, useState } from "react";

const RAW_LINES = [
  "you miss 100% of the shots you don't take",
  "all those moments will be lost in time",
  "the unexamined life is not worth living",
  '"Be the change" (Gandhi)',
  "is this the real life is this just fantasy",
];

// “After” pills use your table-ish palette
const RESULT_CARDS = [
  { tag: "Person", tagBg: "#FEF3C7", tagColor: "#B45309", text: "You miss 100% of the shots you don't take", source: "Wayne Gretzky" },
  { tag: "Film",   tagBg: "#F3E8FF", tagColor: "#7C3AED", text: "All those moments will be lost in time", source: "Blade Runner (1982)" },
  { tag: "Person", tagBg: "#FEF3C7", tagColor: "#B45309", text: "The unexamined life is not worth living", source: "Socrates" },
  { tag: "Person", tagBg: "#FEF3C7", tagColor: "#B45309", text: "Be the change", source: "Mahatma Gandhi" },
  { tag: "Music",  tagBg: "#FFE4E6", tagColor: "#E11D48", text: "Is this the real life, is this just fantasy", source: "Queen" },
];

// Inner animation — remounts each loop via key prop
function AnimInner({ onComplete = () => {} }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [visibleCards, setVisibleCards] = useState([]);
  const [phase, setPhase] = useState("before"); // before | processing | after
  const [theme, setTheme] = useState("dark");   // dark -> mix -> light (smooth crossfade)

  useEffect(() => {
    const ts = [];
    const t = (ms, fn) => { const id = setTimeout(fn, ms); ts.push(id); };

    setVisibleLines([]);
    setVisibleCards([]);
    setPhase("before");
    setTheme("dark");

    RAW_LINES.forEach((_, i) => t(300 + i * 500, () => {
      setVisibleLines(p => [...p, i]);
    }));

    const doneTyping = 300 + RAW_LINES.length * 500 + 900;
    t(doneTyping, () => setPhase("processing"));

    const showAt = doneTyping + 1100;

    // Start a “mix” phase *slightly before* cards appear so the flip isn’t jarring
    t(showAt - 300, () => setTheme("mix"));

    t(showAt, () => {
      setPhase("after");
      // Fade the surface to light over a short ramp, instead of instant
      t(120, () => setTheme("light"));

      RESULT_CARDS.forEach((_, i) => t(i * 220, () => {
        setVisibleCards(p => [...p, i]);
      }));
    });

    t(showAt + RESULT_CARDS.length * 220 + 2400, () => onComplete?.());

    return () => ts.forEach(clearTimeout);
  }, [onComplete]);

  const dotStyle = (delay, color) => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: color,
    display: "inline-block",
    animation: "tpDot 1.2s ease-in-out infinite",
    animationDelay: delay,
  });

  const ui = useMemo(() => {
    const isDark = theme === "dark";
    const isMix = theme === "mix";

    // Light theme uses your app background (#FAF8F4), not pure white
    return {
      // Outer surface (animates instead of hard switch)
      surfaceBg: isDark ? "#1A1918" : isMix ? "#2A2826" : "#FAF8F4",
      surfaceShadow: isDark
        ? "0 8px 40px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.12)"
        : "0 8px 40px rgba(26,24,20,0.10), 0 2px 8px rgba(26,24,20,0.08)",

      // Chrome (keep it “terminal-ish” but soften in light theme)
      chromeBg: isDark ? "#141312" : isMix ? "#1B1A19" : "#F5F1EB",
      chromeBorder: isDark ? "#2A2826" : "rgba(55,53,47,0.08)",
      chromeText: isDark ? "#6B6764" : "#9B9A97",
      dots: isDark ? "#9A9591" : "#9B9A97",

      // Before list
      caret: isDark ? "#3D3B38" : "rgba(55,53,47,0.28)",
      rawText: isDark ? "#8A8581" : "#6A6660",

      // After “table-ish” cards
      cardBg: isDark ? "#222120" : "#FBFBFA",
      cardBorder: isDark ? "#2D2B28" : "rgba(55,53,47,0.08)",
      cardText: isDark ? "#C8C3BC" : "#37352F",
      cardSrc: isDark ? "#5A5855" : "#9B9A97",
    };
  }, [theme]);

  return (
    <>
      {/* fallback keyframes in case baseCSS isn't present on the page */}
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
          transition: "background 520ms ease, box-shadow 520ms ease",
        }}
      >
        {/* “Terminal chrome” (also transitions) */}
        <div
          style={{
            padding: "11px 18px",
            background: ui.chromeBg,
            borderBottom: `1px solid ${ui.chromeBorder}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            transition: "background 520ms ease, border-color 520ms ease",
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            {["#FF5F57", "#FFBD2E", "#28C840"].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.9 }} />
            ))}
          </div>

          <span
            style={{
              fontFamily: "'SF Mono', 'DM Mono', Menlo, monospace",
              fontSize: 14,
              fontWeight: 500,
              color: ui.chromeText,
              marginLeft: 6,
              transition: "color 520ms ease",
            }}
          >
            {phase === "before" ? "quotes.txt" : phase === "processing" ? "identifying…" : "collection — organized ✓"}
          </span>

          {phase === "processing" && (
            <div style={{ marginLeft: "auto", display: "flex", gap: 5, alignItems: "center" }}>
              <span style={dotStyle("0s", ui.dots)} />
              <span style={dotStyle("0.2s", ui.dots)} />
              <span style={dotStyle("0.4s", ui.dots)} />
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "22px 26px", minHeight: 228 }}>
          {/* BEFORE / PROCESSING: raw lines */}
          {phase !== "after" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {RAW_LINES.map((line, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    opacity: visibleLines.includes(i) ? (phase === "processing" ? 0.35 : 1) : 0,
                    transform: visibleLines.includes(i) ? "translateY(0)" : "translateY(8px)",
                    transition: "opacity 0.35s, transform 0.35s",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'SF Mono', 'DM Mono', Menlo, monospace",
                      color: ui.caret,
                      fontSize: 12,
                      flexShrink: 0,
                      transition: "color 520ms ease",
                    }}
                  >
                    ›
                  </span>

                  <span
                    style={{
                      fontFamily: "'SF Mono', 'DM Mono', Menlo, monospace",
                      fontSize: 12.5,
                      color: ui.rawText,
                      lineHeight: 1.4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      transition: "color 520ms ease",
                    }}
                  >
                    {line}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* AFTER: result cards */}
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
                    opacity: visibleCards.includes(i) ? 1 : 0,
                    transform: visibleCards.includes(i) ? "translateY(0)" : "translateY(10px)",
                    transition: "opacity 0.35s ease, transform 0.35s ease, background 520ms ease, border-color 520ms ease",
                  }}
                >
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
                      fontFamily: "'SF Mono', 'DM Mono', Menlo, monospace",
                    }}
                  >
                    {card.tag}
                  </span>

                  <span
                    style={{
                      fontFamily: "'SF Mono', 'DM Mono', Menlo, monospace",
                      fontSize: 12,
                      color: ui.cardText,
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      transition: "color 520ms ease",
                    }}
                  >
                    "{card.text}"
                  </span>

                  <span
                    style={{
                      fontFamily: "'SF Mono', 'DM Mono', Menlo, monospace",
                      fontSize: 11,
                      color: ui.cardSrc,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "color 520ms ease",
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