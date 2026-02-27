import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const DOT_STYLE_BASE = {
  width: 6, height: 6, borderRadius: "50%",
  display: "inline-block",
  animation: "tpDot 1.2s ease-in-out infinite",
};

// ─── Inner animation — remounts each loop via key prop ────────────────────────
function AnimInner({ onComplete }) {
  const [lineCount, setLineCount] = useState(0);
  const [cardCount, setCardCount] = useState(0);
  const [phase, setPhase]   = useState("before");  // before | processing | after
  const [lightness, setLightness] = useState(0);   // 0 = dark, 1 = light (drives interpolation)
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const ts = [];
    const t = (ms, fn) => { const id = setTimeout(fn, ms); ts.push(id); return id; };

    // Stagger raw lines in
    RAW_LINES.forEach((_, i) => t(300 + i * 500, () => {
      setLineCount(i + 1);
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
        setCardCount(i + 1);
      }));
    });

    t(showAt + RESULT_CARDS.length * 230 + 2600, () => onCompleteRef.current?.());

    return () => ts.forEach(clearTimeout);
  }, []);

  // ── Interpolate between dark (0) and light (1) ────────────────────────────
  const ui = useMemo(() => {
    const l = lightness; // 0–1

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

      cardBg:     "#FFFFFF",
      cardBorder: `rgba(60,87,117,0.14)`,
      cardShadow: "0 1px 4px rgba(60,87,117,0.07), 0 0 0 1px rgba(60,87,117,0.08)",
      cardText:   l < 0.5 ? "#C8C3BC" : "#37352F",
      cardSrc:    l < 0.5 ? "#5A5855" : "#9B9A97",
    };
  }, [lightness]);

  const isAfter = phase === "after";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 800,
        margin: "52px auto 0",
        borderRadius: 14,
        overflow: "hidden",
        background: ui.surfaceBg,
        boxShadow: ui.surfaceShadow,
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
            <span style={{ ...DOT_STYLE_BASE, background: ui.dots, animationDelay: "0s" }} />
            <span style={{ ...DOT_STYLE_BASE, background: ui.dots, animationDelay: "0.2s" }} />
            <span style={{ ...DOT_STYLE_BASE, background: ui.dots, animationDelay: "0.4s" }} />
          </div>
        )}
      </div>

      {/* Content — both phases always mounted, crossfade via opacity */}
      <div style={{ padding: "22px 26px", minHeight: 228, position: "relative" }}>

        {/* BEFORE / PROCESSING — fades out when "after" */}
        <div
          style={{
            display: "flex", flexDirection: "column", gap: 11,
            opacity: isAfter ? 0 : 1,
            position: isAfter ? "absolute" : "relative",
            inset: isAfter ? "22px 26px" : undefined,
            transition: "opacity 0.4s ease",
            pointerEvents: isAfter ? "none" : undefined,
          }}
        >
          {RAW_LINES.map((line, i) => {
            const visible = i < lineCount;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  opacity: visible
                    ? (phase === "processing" ? 0.3 : 1)
                    : 0,
                  transform: visible ? "translateY(0)" : "translateY(8px)",
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
            );
          })}
        </div>

        {/* AFTER — result cards, always mounted but invisible until phase flips */}
        <div
          style={{
            display: "flex", flexDirection: "column", gap: 7,
            opacity: isAfter ? 1 : 0,
            position: isAfter ? "relative" : "absolute",
            inset: isAfter ? undefined : "22px 26px",
            transition: "opacity 0.4s ease",
            pointerEvents: isAfter ? undefined : "none",
          }}
        >
          {RESULT_CARDS.map((card, i) => {
            const visible = i < cardCount;
            return (
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
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(10px)",
                  transition: "opacity 0.38s ease, transform 0.38s ease",
                }}
              >
                {/* Category tag */}
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
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function TransformPreview() {
  const [key, setKey] = useState(0);
  const handleComplete = useCallback(() => setKey(k => k + 1), []);
  return <AnimInner key={key} onComplete={handleComplete} />;
}
