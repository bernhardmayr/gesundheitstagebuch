import { useState } from 'react';
import type { MahlzeitArt, MahlzeitEintrag } from '../db/types';
import { SegmentGroup } from './SegmentGroup';
import { BigButton, Field, inputClass } from './ui';
import { toDatetimeLocal, fromDatetimeLocal } from '../lib/format';

export type MahlzeitFormData = Omit<MahlzeitEintrag, 'id'>;

const artOpts: { value: MahlzeitArt; label: string }[] = [
  { value: 'fruehstueck', label: 'Frühstück' },
  { value: 'mittag', label: 'Mittag' },
  { value: 'abend', label: 'Abend' },
  { value: 'snack', label: 'Snack' },
];

const ZUTATEN = ['Milch', 'Rohkost', 'Fett', 'Kaffee', 'Alkohol', 'Zucker', 'Gluten', 'Scharf'];

export function MahlzeitForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Speichern',
}: {
  initial?: Partial<MahlzeitEintrag>;
  onSubmit: (data: MahlzeitFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [zeitpunkt, setZeitpunkt] = useState(initial?.zeitpunkt ?? Date.now());
  const [art, setArt] = useState<MahlzeitArt>(initial?.art ?? 'mittag');
  const [beschreibung, setBeschreibung] = useState(initial?.beschreibung ?? '');
  const [zutaten, setZutaten] = useState<string[]>(initial?.verdaechtige_zutaten ?? []);

  function toggleZutat(z: string) {
    setZutaten((prev) => (prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z]));
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-2 font-semibold">Mahlzeit</h2>
        <SegmentGroup ariaLabel="Art" options={artOpts} value={art} onChange={setArt} />
      </div>

      <Field label="Beschreibung (optional)">
        <input className={inputClass} value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} />
      </Field>

      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          Verdächtige Zutaten
        </h3>
        <div className="flex flex-wrap gap-2">
          {ZUTATEN.map((z) => {
            const active = zutaten.includes(z);
            return (
              <button
                key={z}
                type="button"
                aria-pressed={active}
                onClick={() => toggleZutat(z)}
                className={[
                  'min-h-touch rounded-full px-4 py-2 text-sm border',
                  active
                    ? 'bg-sky-600 border-sky-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
                ].join(' ')}
              >
                {z}
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Zeitpunkt">
        <input
          type="datetime-local"
          className={inputClass}
          value={toDatetimeLocal(zeitpunkt)}
          onChange={(e) => setZeitpunkt(fromDatetimeLocal(e.target.value))}
        />
      </Field>

      <div className="flex gap-2">
        {onCancel && (
          <BigButton variant="secondary" onClick={onCancel} className="flex-1">
            Abbrechen
          </BigButton>
        )}
        <BigButton
          onClick={() =>
            onSubmit({
              zeitpunkt,
              art,
              beschreibung: beschreibung.trim() || undefined,
              verdaechtige_zutaten: zutaten.length ? zutaten : undefined,
            })
          }
          className="flex-1"
        >
          {submitLabel}
        </BigButton>
      </div>
    </div>
  );
}
