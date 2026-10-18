import type { StuhlEintrag } from '../db/types';
import { EmptyState } from './ui';
import { toDatum } from '../db/repo';
import { formatDatum } from '../lib/format';

// Heatmap Stunde (Spalten 0–23) × Tag (Zeilen). Macht Nachtstühle und Mahlzeitenkopplung sichtbar.
export function Heatmap({ eintraege }: { eintraege: StuhlEintrag[] }) {
  const map = new Map<string, number[]>();
  for (const e of eintraege) {
    const d = toDatum(e.zeitpunkt);
    if (!map.has(d)) map.set(d, new Array(24).fill(0));
    map.get(d)![new Date(e.zeitpunkt).getHours()] += 1;
  }
  const tage = [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  const max = Math.max(1, ...[...map.values()].flat());

  if (tage.length === 0) {
    return <EmptyState>Noch keine Stuhlgänge erfasst.</EmptyState>;
  }

  function color(n: number): string {
    if (n === 0) return 'transparent';
    const t = n / max;
    const alpha = 0.25 + 0.75 * t;
    return `rgba(14,165,233,${alpha})`;
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-[10px]">
        <thead>
          <tr>
            <th className="sticky left-0 bg-inherit" />
            {Array.from({ length: 24 }, (_, h) => (
              <th key={h} className="w-4 px-0 text-center font-normal text-slate-400">
                {h % 6 === 0 ? h : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tage.map(([datum, stunden]) => (
            <tr key={datum}>
              <td className="whitespace-nowrap pr-2 text-slate-500 dark:text-slate-400">
                {formatDatum(datum).slice(0, 5)}
              </td>
              {stunden.map((n, h) => {
                const nacht = h >= 23 || h < 6;
                return (
                  <td
                    key={h}
                    title={n ? `${formatDatum(datum)} ${h}:00 – ${n}×` : undefined}
                    className={`h-4 w-4 border ${nacht ? 'border-slate-300/50 dark:border-slate-600/50' : 'border-slate-200/40 dark:border-slate-700/40'}`}
                    style={{ background: color(n) }}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-[10px] text-slate-400">
        Spalten = Uhrzeit (0–23). Umrandete Spalten = Nacht (23–06 Uhr).
      </p>
    </div>
  );
}
