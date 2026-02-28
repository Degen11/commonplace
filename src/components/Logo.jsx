// ── Logo — Open book with bookmark ribbon ──
export default function Logo({ size = 28, color = "#3C5775" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0, position: "relative", top: 1 }}
    >
      {/* Left page */}
      <path
        d="M16 7C13.5 5.5 10 5 7 5C5.5 5 4 5.8 4 7.5V23.5C4 25 5.5 25.5 7 25.5C10 25.5 13.5 26.2 16 28"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right page */}
      <path
        d="M16 7C18.5 5.5 22 5 25 5C26.5 5 28 5.8 28 7.5V23.5C28 25 26.5 25.5 25 25.5C22 25.5 18.5 26.2 16 28"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Spine */}
      <path
        d="M16 7V28"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Bookmark ribbon */}
      <path
        d="M21 5V14L23 12.5L25 14V5"
        fill={color}
        opacity="0.2"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
