export function Pip({ mood = "wave" }: { mood?: "wave" | "think" | "cheer" }) {
  return (
    <svg viewBox="0 0 160 170" className="bob h-36 w-36" role="img" aria-label="Pip, a round piggy-bank guide">
      <ellipse cx="80" cy="150" rx="36" ry="8" fill="#efd7b4" />
      <path d="M28 78c0-32 22-54 52-54s52 22 52 54v28c0 28-22 48-52 48S28 134 28 106Z" fill="#ffb4c8" stroke="#241c33" strokeWidth="3" />
      <path d="M46 48c6-22 18-30 34-30 4 0 8 8 6 16" fill="#ff8fab" stroke="#241c33" strokeWidth="3" />
      <path d="M114 48c-6-22-18-30-34-30-4 0-8 8-6 16" fill="#ff8fab" stroke="#241c33" strokeWidth="3" />
      <rect x="58" y="62" width="44" height="8" rx="4" fill="#241c33" />
      <circle cx="62" cy="92" r="6" fill="#241c33" />
      <circle cx="98" cy="92" r="6" fill="#241c33" />
      <circle cx="64" cy="90" r="2" fill="#fff8ef" />
      <circle cx="100" cy="90" r="2" fill="#fff8ef" />
      <ellipse cx="48" cy="108" rx="8" ry="5" fill="#ff8fab" />
      <ellipse cx="112" cy="108" rx="8" ry="5" fill="#ff8fab" />
      {mood === "think" ? (
        <path d="M68 118h24" stroke="#241c33" strokeWidth="3" strokeLinecap="round" />
      ) : (
        <path d="M66 116c8 12 20 12 28 0" fill="none" stroke="#241c33" strokeWidth="3" strokeLinecap="round" />
      )}
      <circle cx="80" cy="128" r="6" fill="#ff7a59" stroke="#241c33" strokeWidth="2" />
      {mood === "cheer" ? (
        <path d="M118 70c16-8 28 8 16 20" fill="none" stroke="#241c33" strokeWidth="3" strokeLinecap="round" />
      ) : (
        <path d="M112 78c18-16 32 2 18 16" fill="none" stroke="#241c33" strokeWidth="3" strokeLinecap="round" />
      )}
      <ellipse cx="34" cy="112" rx="10" ry="8" fill="#ffb4c8" stroke="#241c33" strokeWidth="3" />
    </svg>
  );
}

export function TownScene() {
  return (
    <svg viewBox="0 0 640 280" className="h-auto w-full" aria-hidden="true">
      <rect width="640" height="280" fill="#c8ecf8" />
      <circle cx="540" cy="54" r="28" fill="#ffc857" stroke="#241c33" strokeWidth="3" />
      <path d="M80 70c18 10 18 10 36 0M130 48c18 10 18 10 36 0" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" />
      <path d="M0 190c80-40 120-10 180-28s90-40 140-20 90 10 140-16 110-10 180 24v130H0Z" fill="#8fd18d" />
      <path d="M0 230c90-24 140 10 210-8 80-20 100 16 180 4 70-10 120 20 250-6v60H0Z" fill="#5eaf72" />
      <g stroke="#241c33" strokeWidth="3">
        <rect x="70" y="132" width="86" height="70" rx="6" fill="#fff6e4" />
        <path d="M62 136 113 96l51 40" fill="#ff7a59" />
        <rect x="98" y="162" width="22" height="40" fill="#efd7b4" />
        <rect x="250" y="118" width="110" height="86" rx="8" fill="#fffdf8" />
        <path d="M242 122 305 78l63 44" fill="#ffc857" />
        <rect x="292" y="150" width="28" height="54" fill="#7ec8e3" />
        <rect x="430" y="146" width="78" height="58" rx="6" fill="#fff6e4" />
        <path d="M424 150h90l-8-18H432z" fill="#14695a" />
        <circle cx="454" cy="168" r="8" fill="#ffc857" />
        <rect x="500" y="168" width="70" height="8" fill="#241c33" />
        <circle cx="520" cy="196" r="14" fill="#241c33" />
        <circle cx="520" cy="196" r="6" fill="#fff8ef" />
      </g>
      <circle cx="560" cy="214" r="16" fill="#ffc857" stroke="#241c33" strokeWidth="3" />
      <path d="M560 206v16M552 214h16" stroke="#14695a" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
