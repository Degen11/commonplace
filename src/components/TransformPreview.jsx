import { useEffect, useMemo, useState, useCallback } from "react";

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
  const [phase, setPhase] = useState("before");  // before | processing | after
  const [lightness, setLightness] = useState(0);   // 0 = dark, 1 = light

  // Cleaner timeout management
  useEffect(() => {
    const timeouts = [];
    const setDelay = (ms, fn) => {
      const id = setTimeout(fn, ms);
      timeouts.push(id);
      return id;
    };

    setVisibleLines([]);
    setVisibleCards([]);
    setPhase("before");
    setLightness(0);

    // Stagger raw lines in with spring-like easing
    RAW_LINES.forEach((_, i) => {
      setDelay(300 + i * 500, () => {
        setVisibleLines(p => [...p, i]);
      });
    });

    const doneTyping = 300 + RAW_LINES.length * 500 + 900;

    setDelay(doneTyping, () => setPhase("processing"));

    const showAt = doneTyping + 1200;

    // Smoother lightness transitions
    setDelay(showAt - 600, () => setLightness(0.3));
    setDelay(showAt - 300, () => setLightness(0.6));
    setDelay(showAt, () => {
      setPhase("after");
      setLightness(1);
      
      // Stagger cards with subtle delay
      RESULT_CARDS.forEach((_, i) => {
        setDelay(i * 180, () => {
          setVisibleCards(p => [...p, i]);
        });
      });
    });

    setDelay(showAt + RESULT_CARDS.length * 180 + 2600, () => onComplete?.());

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  // ── Dot animation with smoother keyframes ──
  const dotStyle = (delay, color) => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: color,
    display: "inline-block",
    animation: "pulseDot 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite",
    animationDelay: delay,
  });

  // ── Interpolate between dark and light with more nuance ───────────────────
  const ui = useMemo(() => {
    const l = lightness;
    
    // Smoother transitions with mid-values
    const surfaceBg = l === 0 
      ? "#1A1918"
      : l < 0.3
        ? "#252220"
        : l < 0.6
          ? "#F8F6F2"
          : "#FFFFFF";

    const chromeBg = l < 0.3 
      ? "#141312" 
      : l < 0.6
        ? "#E8E4DE"
        : "#F5F1EB";

    return {
      surfaceBg,
      surfaceShadow: l < 0.3
        ? "0 20px 60px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.2)"
        : "0 2px 0 rgba(60,87,117,0.06), 0 20px 60px rgba(60,87,117,0.12), 0 8px 24px rgba(26,24,20,0.08)",

      chromeBg,
      chromeBorder: l < 0.3 ? "#2A2826" : `rgba(60,87,117,${0.06 + l * 0.1})`,
      chromeText: l < 0.3 ? "#6B6764" : CP_ACCENT,

      dots: l < 0.3 ? "#9A9591" : CP_ACCENT,

      caret: l < 0.3 ? "#3D3B38" : "rgba(55,53,47,0.35)",
      rawText: l < 0.3 ? "#8A8581" : "#4A4640",

      // Card styles with micro-interactions
      cardBg: "#FFFFFF",
      cardBorder: `rgba(60,87,117,0.14)`,
      cardShadow: "0 4px 12px rgba(60,87,117,0.08), 0 0 0 1px rgba(60,87,117,0.06)",
      cardHoverShadow: "0 8px 24px rgba(60,87,117,0.12), 0 0 0 1px rgba(60,87,117,0.1)",
      cardText: l < 0.3 ? "#C8C3BC" : "#2A2825",
      cardSrc: l < 0.3 ? "#5A5855" : "#8A8885",
    };
  }, [lightness]);

  return (
    <>
      <style>{`
        @keyframes pulseDot {
          0%, 100% { 
            opacity: 0.25; 
            transform: scale(0.8);
            filter: blur(0px);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.2);
            filter: blur(0.5px);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        
        @keyframes glowPulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(60,87,117,0);
          }
          50% { 
            box-shadow: 0 0 20px 4px rgba(60,87,117,0.1);
          }
        }
        
        .chrome-bar {
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .result-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .result-card:hover {
          transform: translateY(-2px) scale(1.01);
          box-shadow: ${ui.cardHoverShadow};
          cursor: default;
        }
        
        .result-card:hover .card-source {
          color: ${CP_ACCENT};
          transition: color 0.2s ease;
        }
        
        .raw-line {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .processing-glow {
          animation: glowPulse 2s ease-in-out infinite;
        }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: 800,
          margin: "52px auto 0",
          borderRadius: 16,
          overflow: "hidden",
          background: ui.surfaceBg,
          boxShadow: ui.surfaceShadow,
          transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Chrome bar with improved design */}
        <div
          className="chrome-bar"
          style={{
            padding: "14px 20px",
            background: ui.chromeBg,
            borderBottom: `1px solid ${ui.chromeBorder}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {["#FF5F57", "#FFBD2E", "#28C840"].map((c, i) => (
              <div 
                key={i} 
                style={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: "50%", 
                  background: c, 
                  opacity: 0.8,
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              />
            ))}
          </div>

          <span
            style={{
              fontFamily: "'SF Mono', 'DM Mono', Menlo, monospace",
              fontSize: 13,
              fontWeight: 500,
              color: ui.chromeText,
              marginLeft: 8,
              letterSpacing: -0.2,
              transition: "color 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {phase === "before"
              ? "quotes.txt"
              : phase === "processing"
                ? "identifying sources..."
                : "collection — 5 quotes organized"}
          </span>

          {phase === "processing" && (
            <div 
              className="processing-glow"
              style={{ 
                marginLeft: "auto", 
                display: "flex", 
                gap: 6, 
                alignItems: "center",
                padding: "4px 8px",
                borderRadius: 20,
                background: "rgba(60,87,117,0.04)",
              }}
            >
              <span style={dotStyle("0s", ui.dots)} />
              <span style={dotStyle("0.2s", ui.dots)} />
              <span style={dotStyle("0.4s", ui.dots)} />
            </div>
          )}
        </div>

        {/* Content with improved spacing */}
        <div style={{ padding: "28px 30px", minHeight: 260 }}>

          {/* BEFORE / PROCESSING */}
          {phase !== "after" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {RAW_LINES.map((line, i) => (
                <div
                  key={i}
                  className="raw-line"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    opacity: visibleLines.includes(i)
                      ? (phase === "processing" ? 0.25 : 1)
                      : 0,
                    transform: visibleLines.includes(i) 
                      ? "translateY(0)" 
                      : "translateY(12px)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'SF Mono', 'DM Mono', monospace",
                      color: ui.caret,
                      fontSize: 14,
                      flexShrink: 0,
                      fontWeight: 300,
                      transition: "color 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {phase === "processing" ? "⋯" : "›"}
                  </span>
                  <span
                    style={{
                      fontFamily: "'SF Mono', 'DM Mono', monospace",
                      fontSize: 13,
                      color: ui.rawText,
                      lineHeight: 1.5,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      transition: "color 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                      fontStyle: phase === "processing" ? "italic" : "normal",
                    }}
                  >
                    {line}
                    {phase === "processing" && i === visibleLines.length - 1 && (
                      <span style={{ 
                        marginLeft: 4, 
                        opacity: 0.5,
                        animation: "pulseDot 1s infinite",
                      }}>_</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* AFTER — result cards with hover effects */}
          {phase === "after" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {RESULT_CARDS.map((card, i) => (
                <div
                  key={i}
                  className="result-card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    background: ui.cardBg,
                    borderRadius: 10,
                    border: `1px solid ${ui.cardBorder}`,
                    boxShadow: ui.cardShadow,
                    opacity: visibleCards.includes(i) ? 1 : 0,
                    transform: visibleCards.includes(i) 
                      ? "translateY(0)" 
                      : "translateY(20px)",
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  {/* Category tag with improved styling */}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: card.tagBg,
                      color: card.tagColor,
                      letterSpacing: 0.5,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      textTransform: "uppercase",
                      fontFamily: "'SF Mono', 'DM Mono', monospace",
                      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
                    }}
                  >
                    {card.tag}
                  </span>

                  <span
                    style={{
                      fontFamily: "'SF Mono', 'DM Mono', monospace",
                      fontSize: 13,
                      color: ui.cardText,
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: 450,
                      transition: "color 0.3s ease",
                    }}
                  >
                    “{card.text}”
                  </span>

                  <span
                    className="card-source"
                    style={{
                      fontFamily: "'SF Mono', 'DM Mono', monospace",
                      fontSize: 11,
                      color: ui.cardSrc,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "color 0.3s ease",
                      opacity: 0.8,
                    }}
                  >
                    — {card.source}
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
  
  const handleComplete = useCallback(() => {
    setKey(k => k + 1);
  }, []);
  
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #F5F2ED 0%, #EAE7E2 100%)",
      padding: "20px",
    }}>
      <AnimInner key={key} onComplete={handleComplete} />
    </div>
  );
}