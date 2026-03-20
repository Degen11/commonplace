import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Layers, Keyboard, CheckCircle, ArrowRight } from "lucide-react";
import { LS_ONBOARDED } from "../config";
import { CP_ACCENT, FONT_SANS } from "./styles";

const STEPS = [
  {
    Icon: Sparkles,
    title: "Paste anything",
    body: "Drop in messy quotes — one per line, with or without sources. We'll identify who said it and sort by category.",
    example: '"be the change — Gandhi"\n"you miss 100% of the shots"\nthe unexamined life is not worth living',
  },
  {
    Icon: Layers,
    title: "Confidence levels",
    body: "Each quote gets a confidence score: high (matched locally), medium (found online), or low (needs review). Filter by confidence to clean up unknowns.",
  },
  {
    Icon: Keyboard,
    title: "Stay organized",
    body: "Drag quotes into collections, bulk-select with Shift+click, and export your collection anytime. Press ? to see all keyboard shortcuts.",
  },
];

export default function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(LS_ONBOARDED)) setShow(true);
    } catch { /* ignore */ }
  }, []);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(LS_ONBOARDED, "1"); } catch { /* ignore */ }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else dismiss();
  };

  if (!show) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 20, fontFamily: FONT_SANS,
      }}
      onClick={dismiss}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            background: "var(--cp-bg-card)", borderRadius: 6, padding: 28,
            maxWidth: 420, width: "100%",
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 6,
              background: `${CP_ACCENT}14`, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <current.Icon size={20} color={CP_ACCENT} strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--cp-text)", letterSpacing: "-0.02em" }}>
              {current.title}
            </h3>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--cp-text-secondary)", marginBottom: current.example ? 14 : 24 }}>
            {current.body}
          </p>
          {current.example && (
            <pre style={{
              fontSize: 12, lineHeight: 1.6, padding: "10px 12px",
              background: "var(--cp-bg-panel)", border: "1px solid var(--cp-border-light)",
              borderRadius: 4, color: "var(--cp-text-muted)", marginBottom: 24,
              whiteSpace: "pre-wrap", fontFamily: "'SF Mono','DM Mono',Menlo,monospace",
            }}>
              {current.example}
            </pre>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: i === step ? CP_ACCENT : "var(--cp-border)",
                  transition: "background .2s",
                }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={dismiss}
                style={{
                  padding: "8px 14px", borderRadius: 6, border: "1px solid var(--cp-border)",
                  background: "var(--cp-bg-card)", color: "var(--cp-text-muted)",
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Skip
              </button>
              <button
                onClick={next}
                style={{
                  padding: "8px 18px", borderRadius: 6, border: "none",
                  background: CP_ACCENT, color: "#fff",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                {isLast ? <><CheckCircle size={14} strokeWidth={2} /> Got it</> : <>Next <ArrowRight size={14} strokeWidth={2} /></>}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
