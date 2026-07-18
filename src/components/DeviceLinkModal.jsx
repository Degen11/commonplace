import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Cloud, Copy, Check, Link2, RefreshCw } from "lucide-react";
import ModalShell from "./ModalShell";
import { styles, CP_ACCENT } from "./styles";
import { loadString, saveString } from "../utils/storage";
import { LS_DEVICE_ID } from "../config";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Cloud-sync panel — opened from the SyncPill. Surfaces the anonymous device code
 * (previously invisible, making "cloud sync" effectively single-device) so users
 * can view/copy it and link a second device to the same synced data.
 *
 * Linking writes the pasted code to LS_DEVICE_ID and reloads; on reload useSync
 * pulls that code's cloud data and merges it (by timestamp) with the local quotes,
 * so nothing is lost — the two devices converge on one record.
 */
export default function DeviceLinkModal({ onClose, syncStatus, onRetry, showToast }) {
  const deviceId = loadString(LS_DEVICE_ID);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState("");

  const copyCode = () => {
    if (!deviceId) return;
    navigator.clipboard.writeText(deviceId)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })
      .catch(() => showToast?.("Couldn't copy — select the code manually.", null, null, "error"));
  };

  const link = () => {
    const cleaned = code.trim().toLowerCase();
    if (!UUID_RE.test(cleaned)) {
      showToast?.("That doesn't look like a valid device code.", null, null, "error");
      return;
    }
    if (cleaned === deviceId) {
      showToast?.("That's already this device's code.", null, null, "info");
      return;
    }
    // Persist the new code and reload — useSync reads LS_DEVICE_ID at module load,
    // so a reload is the clean way to re-point sync at the linked device.
    if (!saveString(LS_DEVICE_ID, cleaned)) {
      showToast?.("Couldn't save the code — storage may be blocked.", null, null, "error");
      return;
    }
    window.location.reload();
  };

  const label = { fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--cp-text-muted)", marginBottom: 6 };
  const boxRow = { display: "flex", gap: 8, alignItems: "center" };

  return (
    <ModalShell onClose={onClose} popupStyle={{ ...styles.confirmBox, maxWidth: "min(92vw, 440px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 6, background: "var(--cp-bg-tab)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Cloud size={20} color={CP_ACCENT} strokeWidth={2} />
        </div>
        <Dialog.Title render={<p />} style={{ fontSize: 15, fontWeight: 600 }}>Cloud sync</Dialog.Title>
      </div>

      <Dialog.Description style={{ fontSize: 13, color: "var(--cp-text-muted)", marginBottom: 18, lineHeight: 1.5 }}>
        Your quotes back up to the cloud under an anonymous device code — no account needed. To see them on another device, link it with this code.
      </Dialog.Description>

      {deviceId ? (
        <>
          <div style={{ marginBottom: 18 }}>
            <div style={label}>This device's code</div>
            <div style={boxRow}>
              <code style={{ flex: 1, minWidth: 0, fontSize: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: "var(--cp-text-secondary)", background: "var(--cp-bg-panel)", border: "1px solid var(--cp-border)", borderRadius: 4, padding: "8px 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {deviceId}
              </code>
              <button
                type="button"
                aria-label="Copy device code"
                className="ui-tip ui-tip-below"
                data-tip={copied ? "Copied" : "Copy"}
                style={{ ...styles.confirmCancel, padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}
                onClick={copyCode}
              >
                {copied ? <Check size={14} strokeWidth={2.5} color="var(--cp-conf-high)" /> : <Copy size={14} strokeWidth={2} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 4 }}>
            <div style={label}>Link another device</div>
            <div style={boxRow}>
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") link(); }}
                placeholder="Paste a device code…"
                aria-label="Device code to link"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                style={{ ...styles.editIn, flex: 1, minWidth: 0, padding: "8px 10px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
              />
              <button
                type="button"
                style={{ ...styles.confirmYes, background: CP_ACCENT, display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}
                onClick={link}
              >
                <Link2 size={14} strokeWidth={2} /> Link
              </button>
            </div>
            <p style={{ fontSize: 11.5, color: "var(--cp-text-muted)", marginTop: 8, lineHeight: 1.5 }}>
              Paste the code from your other device. This device's quotes stay and merge with the linked device's — nothing is deleted. The page will reload to sync.
            </p>
          </div>
        </>
      ) : (
        <p style={{ fontSize: 13, color: "var(--cp-warning-text)", background: "var(--cp-warning-bg)", border: "1px solid var(--cp-warning-border)", borderRadius: 4, padding: "10px 12px", lineHeight: 1.5 }}>
          Cloud sync is unavailable — this browser is blocking local storage (e.g. private mode), so no device code could be created.
        </p>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
        {syncStatus === "error" && onRetry ? (
          <button
            type="button"
            style={{ ...styles.confirmCancel, padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => { onRetry(); onClose(); }}
          >
            <RefreshCw size={13} strokeWidth={2} /> Retry sync now
          </button>
        ) : <span />}
        <button type="button" className="confirm-cancel" style={{ ...styles.confirmCancel, padding: "8px 20px" }} onClick={onClose}>Done</button>
      </div>
    </ModalShell>
  );
}
