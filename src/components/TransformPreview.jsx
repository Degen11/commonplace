import { useState, useEffect } from "react";

const RAW_LINES = [
  "you miss 100% of the shots you don't take",
  "all those moments will be lost in time",
  "the unexamined life is not worth living",
  '"Be the change" (Gandhi)',
  "is this the real life is this just fantasy",
];

const RESULT_CARDS = [
  { tag: "Person", tagBg: "#F0ABFC22", tagColor: "#A21CAF", text: "You miss 100% of the shots you don't take", source: "Wayne Gretzky" },
  { tag: "Film",   tagBg: "#F3E8FF",   tagColor: "#7C3AED", text: "All those moments will be lost in time",    source: "Blade Runner (1982)" },
  { tag: "Person", tagBg: "#F0ABFC22", tagColor: "#A21CAF", text: "The unexamined life is not worth living",   source: "Socrates" },
  { tag: "Person", tagBg: "#F0ABFC22", tagColor: "#A21CAF", text: "Be the change",                            source: "Mahatma Gandhi" },
  { tag: "Music",  tagBg: "#FFE4E6",   tagColor: "#E11D48", text: "Is this the real life, is this just fantasy", source: "Queen" },
];

// Inner animation — remounts each loop via key prop
function AnimInner({ onComplete }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [visibleCards, setVisibleCards] = useState([]);
  const [phase, setPhase] = useState("before"); // before | processing | after

  useEffect(() => {
    const ts = [];
    const t = (ms, fn) => { const id = setTimeout(fn, ms); ts.push(id); };

    // Type lines in one by one
    RAW_LINES.forEach((_, i) => t(300 + i * 500, () => setVisibleLines(p => [...p, i])));

    const doneTyping = 300 + RAW_LINES.length * 500 + 900;

    // Show processing state
    t(doneTyping, () => setPhase("processing"));

    // Swap to results
    const showAt = doneTyping + 1100;
    t(showAt, () => {
      setPhase("after");
      RESULT_CARDS.forEach((_, i) => t(showAt + i * 300, () => setVisibleCards(p => [...p, i])));
    });

    // Hold then loop
    t(showAt + RESULT_CARDS.length * 300 + 2600, onComplete);

    return () => ts.forEach(clearTimeout);
  }, []);

  const dotStyle = (delay) => ({
    width: 6, height: 6, borderRadius: "50%", background: "#9A9591",
    display: "inline-block",
    animation: "tpDot 1.2s ease-in-out infinite",
    animationDelay: delay,
  });

  return (
    <div style={{
      width: "100%", maxWidth: 800, margin: "52px auto 0",
      background: "#1A1918", borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 8px 40px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.12)",
    }}>
      {/* Terminal chrome */}
      <div style={{
        padding: "11px 18px",
        background: "#141312",
        borderBottom: "1px solid #2A2826",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#FF5F57","#FFBD2E","#28C840"].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.9 }} />
          ))}
        </div>
        <span style={{
          fontFamily: "'SF Mono', 'DM Mono', Menlo, monospace",
          fontSize: 11, color: "#6B6764", marginLeft: 6,
          transition: "color 0.4s",
        }}>
          {phase === "before"      ? "quotes.txt"                 :
           phase === "processing"  ? "identifying…"               :
                                     "collection — organized ✓"}
        </span>
        {phase === "processing" && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 5, alignItems: "center" }}>
            <span style={dotStyle("0s")} />
            <span style={dotStyle("0.2s")} />
            <span style={dotStyle("0.4s")} />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "22px 26px", minHeight: 228 }}>

        {/* BEFORE / PROCESSING: raw lines */}
        {phase !== "after" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {RAW_LINES.map((line, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                opacity: visibleLines.includes(i) ? (phase === "processing" ? 0.35 : 1) : 0,
                transform: visibleLines.includes(i) ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.35s, transform 0.35s",
              }}>
                <span style={{
                  fontFamily: "'SF Mono', 'DM Mono', Menlo, monospace",
                  color: "#3D3B38", fontSize: 12, flexShrink: 0,
                }}>›</span>
                <span style={{
                  fontFamily: "'SF Mono', 'DM Mono', Menlo, monospace",
                  fontSize: 12.5, color: "#8A8581", lineHeight: 1.4,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
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
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 13px",
                background: "#222120",
                borderRadius: 8,
                border: "1px solid #2D2B28",
                opacity: visibleCards.includes(i) ? 1 : 0,
                transform: visibleCards.includes(i) ? "translateY(0)" : "translateY(10px)",
                transition: "opacity 0.4s, transform 0.4s",
              }}>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  padding: "2px 7px", borderRadius: 4,
                  background: card.tagBg, color: card.tagColor,
                  letterSpacing: 0.6, whiteSpace: "nowrap", flexShrink: 0,
                  textTransform: "uppercase",
                  fontFamily: "'SF Mono', 'DM Mono', Menlo, monospace",
                }}>
                  {card.tag}
                </span>
                <span style={{
                  fontFamily: "'SF Mono', 'DM Mono', Menlo, monospace",
                  fontSize: 12, color: "#C8C3BC",
                  flex: 1, minWidth: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  "{card.text}"
                </span>
                <span style={{
                  fontFamily: "'SF Mono', 'DM Mono', Menlo, monospace",
                  fontSize: 11, color: "#5A5855",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  {card.source}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TransformPreview() {
  const [key, setKey] = useState(0);
  return <AnimInner key={key} onComplete={() => setKey(k => k + 1)} />;
}
