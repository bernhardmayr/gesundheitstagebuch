interface Option<T extends string> {
  value: T;
  label: string;
  sub?: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T | null; // null = noch nichts gewählt (keine Vorauswahl)
  onChange: (v: T) => void;
  columns?: number;
  ariaLabel?: string;
  // Aktiver Wert wurde vorbelegt (nicht in diesem Formular getippt) -> abgesetzt darstellen.
  carried?: boolean;
}

export function SegmentGroup<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
  ariaLabel,
  carried = false,
}: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={[
              'min-h-touch rounded-xl px-3 py-3 text-center transition-colors border',
              active && carried
                ? 'bg-sky-100 dark:bg-sky-950 border-sky-500 border-dashed border-2 text-sky-900 dark:text-sky-100'
                : active
                ? 'bg-sky-600 border-sky-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100',
            ].join(' ')}
          >
            <div className="font-medium leading-tight">{o.label}</div>
            {o.sub && (
              <div
                className={
                  active && !carried
                    ? 'text-xs text-sky-100'
                    : 'text-xs text-slate-500 dark:text-slate-400'
                }
              >
                {o.sub}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
