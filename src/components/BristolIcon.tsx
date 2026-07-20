import type { Bristol } from '../db/types';

// Neutrale, schematische Piktogramme (monochrom, keine Emojis).
export function BristolIcon({ typ, className }: { typ: Bristol; className?: string }) {
  const c = 'currentColor';
  const common = { width: 40, height: 28, viewBox: '0 0 40 28', className, 'aria-hidden': true };
  switch (typ) {
    case 1: // einzelne harte Klümpchen
      return (
        <svg {...common}>
          {[8, 20, 32].map((x) => (
            <circle key={x} cx={x} cy={14} r={4} fill={c} />
          ))}
        </svg>
      );
    case 2: // wurstartig, klumpig
      return (
        <svg {...common}>
          <rect x={5} y={9} width={30} height={10} rx={5} fill={c} />
          {[12, 20, 28].map((x) => (
            <line key={x} x1={x} y1={9} x2={x} y2={19} stroke="var(--bg,#0f172a)" strokeWidth={1.5} />
          ))}
        </svg>
      );
    case 3: // wurstartig mit Rissen
      return (
        <svg {...common}>
          <rect x={4} y={10} width={32} height={8} rx={4} fill={c} />
          {[13, 20, 27].map((x) => (
            <line key={x} x1={x} y1={10} x2={x} y2={18} stroke="var(--bg,#0f172a)" strokeWidth={1} />
          ))}
        </svg>
      );
    case 4: // wurstartig, glatt
      return (
        <svg {...common}>
          <rect x={3} y={11} width={34} height={6} rx={3} fill={c} />
        </svg>
      );
    case 5: // weiche Klümpchen
      return (
        <svg {...common}>
          {[10, 20, 30].map((x) => (
            <circle key={x} cx={x} cy={14} r={5} fill={c} />
          ))}
        </svg>
      );
    case 6: // breiig, unförmig
      return (
        <svg {...common}>
          <path
            d="M6 16c0-4 4-6 8-5 2-3 8-3 10 0 4-1 8 1 8 5 0 3-3 5-6 4-3 2-9 2-12 0-4 1-8-1-8-4z"
            fill={c}
          />
        </svg>
      );
    case 7: // flüssig
      return (
        <svg {...common}>
          <path d="M3 12c6-3 10 3 17 0s11 2 17 0v5c-6 2-10-3-17 0s-11-2-17 0z" fill={c} />
        </svg>
      );
  }
}
