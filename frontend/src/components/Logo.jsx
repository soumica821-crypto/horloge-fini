import { Link } from "react-router-dom";

export const ClockMark = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
    <circle cx="20" cy="20" r="17" fill="none" stroke="#FF2A85" strokeWidth="3" />
    {[...Array(12)].map((_, i) => (
      <line key={i} x1="20" y1="5.5" x2="20" y2={i % 3 === 0 ? 9.5 : 7.5} stroke="#FF75A8" strokeWidth="1.6"
        transform={`rotate(${i * 30} 20 20)`} />
    ))}
    <line x1="20" y1="20" x2="20" y2="11" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    <line x1="20" y1="20" x2="27" y2="23" stroke="#FF2A85" strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="20" cy="20" r="2.2" fill="#fff" />
  </svg>
);

export const Logo = () => (
  <Link to="/" className="flex items-center gap-2.5 shrink-0" data-testid="logo-link">
    <ClockMark />
    <span className="font-display text-lg font-bold text-[#FF2A85] leading-none">Horloge</span>
    <span className="rounded-full bg-[#FF2A85]/15 px-2.5 py-1 text-xs font-semibold text-[#FF75A8]">Joiner</span>
  </Link>
);
