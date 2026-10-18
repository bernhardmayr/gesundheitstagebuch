import type { StuhlEintrag } from '../db/types';
import { EmptyState } from './ui';
import { istInkontinenzEpisode } from '../lib/derive';
import { formatDate, inkontinenzLabel } from '../lib/format';

const farbe: Record<string, string> = {
  stuhlschmieren: '#eab308',
  teilverlust: '#f97316',
  vollverlust: '#dc2626',
};

export function InkontinenzTimeline({
  eintraege,
  vonMs,
  bisMs,
}: {
  eintraege: StuhlEintrag[];
  vonMs: number;
  bisMs: number;
}) {
  const episoden = eintraege.filter(istInkontinenzEpisode);
  if (episoden.length === 0) {
    return <EmptyState>Keine Inkontinenzereignisse im Zeitraum erfasst.</EmptyState>;
  }
  const span = Math.max(1, bisMs - vonMs);

  return (
    <div>
      <div className="relative h-10 rounded-lg bg-slate-100 dark:bg-slate-800">
        {episoden.map((e) => {
          const left = ((e.zeitpunkt - vonMs) / span) * 100;
          return (
            <span
              key={e.id}
              title={`${formatDate(e.zeitpunkt)} – ${inkontinenzLabel[e.inkontinenz]}`}
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-white dark:ring-slate-900"
              style={{ left: `${Math.min(99, Math.max(1, left))}%`, background: farbe[e.inkontinenz] }}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>{formatDate(vonMs)}</span>
        <span>{formatDate(bisMs)}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
        {Object.entries(farbe).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
            {inkontinenzLabel[k as keyof typeof inkontinenzLabel]}
          </span>
        ))}
      </div>
    </div>
  );
}
