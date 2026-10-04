import { CP_ACCENT } from "./styles";
import { LOGO_BUBBLE_PATH, LOGO_FLAP_PATH, LOGO_FLAP_OPACITY } from "./logoPaths";

// ── Logo — Speech bubble with a folded paper corner ──
export default function Logo({ size = 28, color = CP_ACCENT }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0, position: "relative", top: 1 }}
    >
      <path d={LOGO_BUBBLE_PATH} fill={color} fillRule="evenodd" />
      <path d={LOGO_FLAP_PATH} fill={color} fillOpacity={LOGO_FLAP_OPACITY} />
    </svg>
  );
}
