/** Illustration de l'accueil : une étudiante qui lit, devant un sanctuaire à śikhara. Couleurs fixes, lisibles dans les deux thèmes. */
export function Illustration() {
  return (
    <svg className="illustration" viewBox="0 0 200 170" role="img" aria-label="Une étudiante lit devant un temple">
      {/* sanctuaire */}
      <g fill="#e9b872">
        <rect x="118" y="96" width="56" height="48" rx="3" />
        <path d="M124 96 L146 34 L168 96 Z" />
        <rect x="138" y="22" width="16" height="8" rx="4" />
        <circle cx="146" cy="18" r="5" />
      </g>
      <g fill="#d59a4f">
        <path d="M131 78h30M128 88h36" stroke="#d59a4f" strokeWidth="3" />
        <path d="M137 144v-26a9 9 0 0 1 18 0v26z" />
      </g>
      {/* plante */}
      <g fill="#3fa37a">
        <path d="M30 150c-6-20 2-34 12-40-2 14 0 26-4 40z" />
        <path d="M44 150c2-18 14-28 26-30-8 10-12 20-18 30z" />
        <path d="M36 150c-14-10-22-22-22-34 10 8 18 20 26 34z" />
      </g>
      <rect x="26" y="146" width="26" height="16" rx="4" fill="#c96b4b" />
      {/* étudiante */}
      <path d="M70 162c0-26 10-46 34-46s34 20 34 46z" fill="#2f9b8f" />
      <path d="M82 70c0-16 10-26 24-26s24 12 22 30c-2 16-2 30 6 44-16 4-40 2-54-6 4-12 2-26 2-42z" fill="#2b2230" />
      <ellipse cx="105" cy="78" rx="15" ry="18" fill="#c98b62" />
      <path d="M90 72c4-12 14-18 28-14-4 8-14 12-28 14z" fill="#2b2230" />
      <rect x="98" y="94" width="14" height="14" fill="#c98b62" />
      {/* livre */}
      <path d="M78 132l26-8 26 8v20l-26-8-26 8z" fill="#fdf7ee" stroke="#e1d4c2" strokeWidth="1.5" />
      <path d="M104 124v20" stroke="#e1d4c2" strokeWidth="1.5" />
      <circle cx="80" cy="134" r="6" fill="#c98b62" />
      <circle cx="128" cy="134" r="6" fill="#c98b62" />
    </svg>
  );
}
