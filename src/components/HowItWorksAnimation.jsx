import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Zap, CheckCircle } from "lucide-react";
import { CP_ACCENT } from "./styles";

// ── Data ────────────────────────────────────────────────────────────────────
const RAW_LINES = [
  "you miss 100% of the shots you don't take",
  "all those moments will be lost in time",
  "the unexamined life is not worth living",
  "be the change — Gandhi",
];

const RESULT_CARDS = [
  { tag: "Person", tagBg: "#EEF2F7", tagColor: CP_ACCENT,  text: "You miss 100% of the shots you don't take", source: "Wayne Gretzky" },
  { tag: "Film",   tagBg: "#F3E8FF", tagColor: "#7C3AED",  text: "All those moments will be lost in time",    source: "Blade Runner" },
  { tag: "Person", tagBg: "#EEF2F7", tagColor: CP_ACCENT,  text: "The unexamined life is not worth living",   source: "Socrates" },
  { tag: "Person", tagBg: "#EEF2F7", tagColor: CP_ACCENT,  text: "Be the change",                            source: "Mahatma Gandhi" },
];

const STEPS = [
  { label: "Paste",    Icon: ClipboardList },
  { label: "Identify", Icon: Zap },
  { label: "Organize", Icon: CheckCircle },
];

// ── Styles ──────────────────────────────────────────────────────────────────
const S = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  stepRow: {
    display: "flex",
    gap: 0,
  },
  stepItem: (active, done) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: active || done ? 600 : 400,
    color: active ? CP_ACCENT : done ? "#1A1814" : "#C8C4BC",
    background: active ? "rgba(60,87,117,0.08)" : "transparent",
    transition: "all 0.35s ease",
    whiteSpace: "nowrap",
  }),
  stepDivider: {
    width: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#D3D3D0",
    fontSize: 10,
  },
  stage: {
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid #E8E3DA",
    background: "#fff",
    minHeight: 160,
    position: "relative",
  },
  linesWrap: {
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  line: (visible, processing) => ({
    fontFamily: "'SF Mono','DM Mono',Menlo,monospace",
    fontSize: 11.5,
    color: processing ? CP_ACCENT : "#6A6660",
    lineHeight: 1.4,
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(6px)",
    transition: "opacity 0.35s ease, transform 0.35s ease, color 0.4s ease",
    display: "flex",
    alignItems: "center",
    gap: 8,
  }),
  lineCaret: (processing) => ({
    fontFamily: "'SF Mono','DM Mono',Menlo,monospace",
    fontSize: 11,
    color: processing ? CP_ACCENT : "#C8C4BC",
    flexShrink: 0,
    transition: "color 0.4s ease",
  }),
  processingOverlay: (show) => ({
    position: "absolute",
    inset: 0,
    background: "rgba(60,87,117,0.03)",
    opacity: show ? 1 : 0,
    transition: "opacity 0.4s ease",
    pointerEvents: "none",
  }),
  cardsWrap: {
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  card: (visible) => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    background: "#fff",
    borderRadius: 7,
    border: "1px solid rgba(60,87,117,0.12)",
    boxShadow: "0 1px 3px rgba(60,87,117,0.06)",
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(8px)",
    transition: "opacity 0.3s ease, transform 0.3s ease",
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
    fontFamily: "'DM Sans',-apple-system,sans-serif",
    fontSize: 12,
    color: "#37352F",
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardSrc: {
    fontFamily: "'DM Sans',-apple-system,sans-serif",
    fontSize: 11,
    color: "#9B9A97",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
};

// ── Component ───────────────────────────────────────────────────────────────
export default function HowItWorksAnimation() {
  // 0 = idle, 1 = paste, 2 = identify, 3 = organize, 4 = done
  const [step, setStep] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [cardCount, setCardCount] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const ts = [];
    const t = (ms, fn) => { const id = setTimeout(fn, ms); ts.push(id); };

    // Step 1 — Paste: lines appear one by one
    t(400, () => setStep(1));
    RAW_LINES.forEach((_, i) => {
      t(600 + i * 400, () => setLineCount(i + 1));
    });

    const pasteDone = 600 + RAW_LINES.length * 400 + 300;

    // Step 2 — Identify: lines shimmer
    t(pasteDone, () => {
      setStep(2);
      setProcessing(true);
    });

    const identifyDone = pasteDone + 1200;

    // Step 3 — Organize: cards appear
    t(identifyDone, () => {
      setStep(3);
      setProcessing(false);
    });

    RESULT_CARDS.forEach((_, i) => {
      t(identifyDone + 200 + i * 200, () => setCardCount(i + 1));
    });

    const organizeDone = identifyDone + 200 + RESULT_CARDS.length * 200 + 400;
    t(organizeDone, () => setStep(4));

    return () => ts.forEach(clearTimeout);
  }, []);

  const activeStep = step >= 4 ? 3 : step;

  return (
    <div style={S.root}>
      {/* Step indicators */}
      <div style={S.stepRow}>
        {STEPS.map((s, i) => {
          const stepNum = i + 1;
          const active = activeStep === stepNum;
          const done = activeStep > stepNum || step >= 4;
          return (
            <div key={s.label} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <div style={S.stepDivider}>→</div>}
              <div style={S.stepItem(active, done)}>
                <s.Icon size={14} strokeWidth={active ? 2 : 1.5} />
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Animation stage */}
      <div style={S.stage}>
        <div style={S.processingOverlay(processing)} />

        {step < 3 ? (
          /* Paste / Identify phase — raw lines */
          <div style={S.linesWrap}>
            {RAW_LINES.map((line, i) => (
              <div key={i} style={S.line(i < lineCount, processing)}>
                <span style={S.lineCaret(processing)}>›</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{line}</span>
              </div>
            ))}
          </div>
        ) : (
          /* Organize phase — result cards */
          <div style={S.cardsWrap}>
            {RESULT_CARDS.map((card, i) => (
              <div key={i} style={S.card(i < cardCount)}>
                <span style={S.cardTag(card.tagBg, card.tagColor)}>{card.tag}</span>
                <span style={S.cardText}>"{card.text}"</span>
                <span style={S.cardSrc}>{card.source}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
