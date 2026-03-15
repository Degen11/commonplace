import { useEffect, useState, useCallback } from "react";
import { ClipboardList, Zap, CheckCircle, RefreshCw } from "lucide-react";
import { CP_ACCENT, FONT_SANS } from "./styles";

// ── Data ────────────────────────────────────────────────────────────────────
const RAW_LINES = [
  "you miss 100% of the shots you don't take",
  "all those moments will be lost in time",
  "the unexamined life is not worth living",
  "not all those who wander are lost",
  "be the change — Gandhi",
];

const RESULT_CARDS = [
  { tag: "Person", tagBg: "rgba(168,85,247,0.08)", tagColor: "#8B43CC",  text: "You miss 100% of the shots you don't take", source: "Wayne Gretzky" },
  { tag: "Film",   tagBg: "rgba(139,92,246,0.08)", tagColor: "#7A48CE",  text: "All those moments will be lost in time",    source: "Blade Runner" },
  { tag: "Person", tagBg: "rgba(168,85,247,0.08)", tagColor: "#8B43CC",  text: "The unexamined life is not worth living",   source: "Socrates" },
  { tag: "Book",   tagBg: "rgba(217,119,6,0.08)",  tagColor: "#C07621",  text: "Not all those who wander are lost",         source: "J.R.R. Tolkien" },
  { tag: "Speech", tagBg: "rgba(59,130,246,0.08)", tagColor: "#3967CD",  text: "Be the change",                            source: "Mahatma Gandhi" },
];

const STEPS = [
  { label: "Paste",    Icon: ClipboardList },
  { label: "Identify", Icon: Zap },
  { label: "Organize", Icon: CheckCircle },
];

// ── Styles ──────────────────────────────────────────────────────────────────
const DARK_BG = "#1E1E1E";
const DARK_BORDER = "#333";

const S = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "100%",
  },
  stepRow: {
    display: "flex",
    gap: 0,
    justifyContent: "center",
  },
  stepItem: (active, done) => ({
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 14px",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: active || done ? 600 : 400,
    color: active ? CP_ACCENT : done ? "var(--cp-text)" : "var(--cp-text-faint)",
    background: active ? "rgba(60,87,117,0.08)" : "transparent",
    transition: "all 0.4s ease",
    whiteSpace: "nowrap",
  }),
  stepDivider: {
    width: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--cp-text-faint)",
    fontSize: 12,
  },
  stage: (dark) => ({
    borderRadius: 6,
    overflow: "hidden",
    border: `1px solid ${dark ? DARK_BORDER : "var(--cp-border-light)"}`,
    background: dark ? DARK_BG : "var(--cp-bg-card)",
    height: 260,
    position: "relative",
    transition: "background 0.8s ease, border-color 0.8s ease",
    textAlign: "left",
  }),
  linesWrap: (fading) => ({
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 10,
    height: "100%",
    boxSizing: "border-box",
    opacity: fading ? 0 : 1,
    transition: "opacity 0.6s ease",
  }),
  line: (visible, scanning, scanned) => ({
    fontFamily: "'SF Mono','DM Mono',Menlo,monospace",
    fontSize: 11.5,
    color: scanning ? "#7EB8FF" : scanned ? "#7EB8FF" : "rgba(255,255,255,0.55)",
    lineHeight: 1.5,
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(6px)",
    transition: "opacity 0.45s ease, transform 0.45s ease, color 0.5s ease",
    display: "flex",
    alignItems: "center",
    gap: 8,
  }),
  lineCaret: (scanning, scanned) => ({
    fontFamily: "'SF Mono','DM Mono',Menlo,monospace",
    fontSize: 11,
    color: scanning ? "#7EB8FF" : scanned ? "#5A9BDB" : "rgba(255,255,255,0.25)",
    flexShrink: 0,
    transition: "color 0.5s ease",
  }),
  progressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2,
    background: "rgba(126,184,255,0.5)",
    borderRadius: 1,
    transition: "width 0.6s ease",
  },
  cardsWrap: (visible) => ({
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    opacity: visible ? 1 : 0,
    transition: "opacity 0.5s ease 0.3s",
  }),
  card: (visible) => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    background: "var(--cp-bg-card)",
    borderRadius: 6,
    border: "1px solid rgba(60,87,117,0.12)",
    boxShadow: "0 1px 3px rgba(60,87,117,0.06)",
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(8px)",
    transition: "opacity 0.4s ease, transform 0.4s ease",
  }),
  cardTag: (bg, color) => ({
    fontSize: 8,
    fontWeight: 800,
    padding: "2px 6px",
    borderRadius: 3,
    background: bg,
    color: color,
    letterSpacing: 0.5,
    whiteSpace: "nowrap",
    flexShrink: 0,
    textTransform: "uppercase",
    fontFamily: "'SF Mono','DM Mono',Menlo,monospace",
  }),
  cardText: {
    fontFamily: FONT_SANS,
    fontSize: 12,
    color: "var(--cp-text-secondary)",
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardSrc: {
    fontFamily: FONT_SANS,
    fontSize: 11,
    color: "var(--cp-text-muted)",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
};

// ── Component ───────────────────────────────────────────────────────────────
export default function HowItWorksAnimation({ active = true }) {
  // 0 = idle, 1 = paste, 2 = identify, 3 = organize, 4 = done
  const [runKey, setRunKey] = useState(0);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [scanIndex, setScanIndex] = useState(-1); // which line is currently being scanned
  const [scannedLines, setScannedLines] = useState(new Set());
  const [linesFading, setLinesFading] = useState(false); // lines fading out
  const [showCards, setShowCards] = useState(false);      // cards layer mounted
  const [cardCount, setCardCount] = useState(0);
  const [progress, setProgress] = useState(0);

  // Start only when active becomes true for the first time (or on replay)
  useEffect(() => {
    if (active && !started) setStarted(true);
  }, [active, started]);

  const replay = useCallback(() => {
    setStep(0);
    setLineCount(0);
    setScanIndex(-1);
    setScannedLines(new Set());
    setLinesFading(false);
    setShowCards(false);
    setCardCount(0);
    setProgress(0);
    setStarted(true);
    setRunKey(k => k + 1);
  }, []);

  useEffect(() => {
    if (!started) return;
    const ts = [];
    const t = (ms, fn) => { const id = setTimeout(fn, ms); ts.push(id); };

    // Step 1 — Paste: lines appear one by one (slower)
    t(600, () => setStep(1));
    RAW_LINES.forEach((_, i) => {
      t(900 + i * 650, () => setLineCount(i + 1));
    });

    const pasteDone = 900 + RAW_LINES.length * 650 + 500;

    // Step 2 — Identify: scan each line one at a time with a progress bar
    t(pasteDone, () => {
      setStep(2);
      setProgress(5);
    });

    RAW_LINES.forEach((_, i) => {
      const scanStart = pasteDone + 300 + i * 800;
      // Highlight this line
      t(scanStart, () => {
        setScanIndex(i);
        setProgress(Math.round(((i + 0.5) / RAW_LINES.length) * 100));
      });
      // Mark it as scanned
      t(scanStart + 550, () => {
        setScannedLines(prev => new Set([...prev, i]));
        setScanIndex(-1);
        setProgress(Math.round(((i + 1) / RAW_LINES.length) * 100));
      });
    });

    const identifyDone = pasteDone + 300 + RAW_LINES.length * 800 + 600;

    // Transition: fade out lines, start bg transition, then fade in cards
    t(identifyDone, () => {
      setStep(3);
      setLinesFading(true);  // lines fade out (0.6s)
      setProgress(100);
    });

    // Mount cards layer after lines have faded (0.6s), then reveal one by one
    t(identifyDone + 700, () => {
      setShowCards(true);
    });

    RESULT_CARDS.forEach((_, i) => {
      t(identifyDone + 1000 + i * 350, () => setCardCount(i + 1));
    });

    const organizeDone = identifyDone + 1000 + RESULT_CARDS.length * 350 + 500;
    t(organizeDone, () => setStep(4));

    return () => ts.forEach(clearTimeout);
  }, [runKey, started]);

  const activeStep = step >= 4 ? 3 : step;
  const isDark = step >= 1 && step < 3;

  return (
    <div style={S.root}>
      {/* Animation stage — dark bg for paste/identify, transitions to white for organize */}
      <div style={S.stage(isDark)}>

        {/* Lines layer — always mounted, fades out during transition */}
        {!showCards && (
          <div style={S.linesWrap(linesFading)}>
            {RAW_LINES.map((line, i) => (
              <div key={i} style={S.line(i < lineCount, scanIndex === i, scannedLines.has(i))}>
                <span style={S.lineCaret(scanIndex === i, scannedLines.has(i))}>›</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{line}</span>
              </div>
            ))}
          </div>
        )}

        {/* Cards layer — mounted after lines fade, fades in */}
        {showCards && (
          <div style={S.cardsWrap(showCards)}>
            {RESULT_CARDS.map((card, i) => (
              <div key={i} style={S.card(i < cardCount)}>
                <span style={S.cardTag(card.tagBg, card.tagColor)}>{card.tag}</span>
                <span style={S.cardText}>"{card.text}"</span>
                <span style={S.cardSrc}>{card.source}</span>
              </div>
            ))}
          </div>
        )}

        {/* Progress bar during identify */}
        {step === 2 && (
          <div style={{ ...S.progressBar, width: `${progress}%` }} />
        )}

        {/* Replay button — inside the stage, bottom-right corner */}
        {step === 4 && (
          <button onClick={replay} style={{
            position: "absolute", bottom: 8, right: 8,
            background: "none", border: "none", padding: 4,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", color: "var(--cp-text-faint)", transition: "color 0.2s ease",
            zIndex: 10,
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--cp-text-muted)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--cp-text-faint)"; }}
          >
            <RefreshCw size={12} strokeWidth={1.5} />
          </button>
        )}

      </div>

      {/* Step indicators — below animation */}
      <div style={S.stepRow}>
        {STEPS.map((s, i) => {
          const stepNum = i + 1;
          const active = activeStep === stepNum;
          const done = activeStep > stepNum || step >= 4;
          return (
            <div key={s.label} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <div style={S.stepDivider}>→</div>}
              <div style={S.stepItem(active, done)}>
                <s.Icon size={16} strokeWidth={active ? 2 : 1.5} />
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
