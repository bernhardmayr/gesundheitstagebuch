import type { Bristol } from '../db/types';
import { bristolKurz } from '../lib/format';
import { BristolIcon } from './BristolIcon';

const TYPEN: Bristol[] = [1, 2, 3, 4, 5, 6, 7];

export function BristolPicker({
  value,
  onChange,
}: {
  value: Bristol | null;
  onChange: (b: Bristol) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {TYPEN.map((t) => {
        const active = value === t;
        return (
          <button
            key={t}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(t)}
            className={[
              'min-h-touch flex items-center gap-3 rounded-xl px-3 py-2 text-left border transition-colors',
              t === 7 ? 'col-span-2' : '',
              active
                ? 'bg-sky-600 border-sky-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100',
            ].join(' ')}
          >
            <BristolIcon typ={t} className="shrink-0" />
            <span className="min-w-0">
              <span className="block font-semibold leading-tight">Typ {t}</span>
              <span
                className={[
                  'block text-xs leading-tight truncate',
                  active ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400',
                ].join(' ')}
              >
                {bristolKurz[t]}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
