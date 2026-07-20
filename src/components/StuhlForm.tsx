import { useState } from 'react';
import type { Bristol, Inkontinenz, Ort, Schmerz, StuhlEintrag, Vorwarnzeit } from '../db/types';
import { BristolPicker } from './BristolPicker';
import { SegmentGroup } from './SegmentGroup';
import { BigButton, Collapsible, Field, Toggle, inputClass } from './ui';
import { toDatetimeLocal, fromDatetimeLocal, schmerzLabel } from '../lib/format';

export type StuhlFormData = Omit<StuhlEintrag, 'id' | 'minuten_nach_mahlzeit'>;

const vorwarnOpts: { value: Vorwarnzeit; label: string; sub?: string }[] = [
  { value: 'sofort', label: 'Sofort', sub: '< 1 Min' },
  { value: 'unter_5min', label: '< 5 Min' },
  { value: 'unter_15min', label: '< 15 Min' },
  { value: 'ueber_15min', label: '> 15 Min' },
];

const inkontOpts: { value: Inkontinenz; label: string; sub?: string }[] = [
  { value: 'keine', label: 'Keine' },
  { value: 'stuhlschmieren', label: 'Schmieren', sub: 'Wäsche' },
  { value: 'teilverlust', label: 'Teilverlust', sub: 'nicht rechtzeitig' },
  { value: 'vollverlust', label: 'Vollverlust' },
];

const ortOpts: { value: Ort; label: string }[] = [
  { value: 'zuhause', label: 'Zuhause' },
  { value: 'unterwegs', label: 'Unterwegs' },
  { value: 'arbeit', label: 'Arbeit' },
];

const schmerzOpts = ([0, 1, 2, 3] as Schmerz[]).map((s) => ({
  value: String(s),
  label: schmerzLabel[s],
}));

export function StuhlForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Speichern',
}: {
  initial?: Partial<StuhlEintrag>;
  onSubmit: (data: StuhlFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [zeitpunkt, setZeitpunkt] = useState(initial?.zeitpunkt ?? Date.now());
  const [bristol, setBristol] = useState<Bristol | null>(initial?.bristol ?? null);
  const [vorwarnzeit, setVorwarnzeit] = useState<Vorwarnzeit>(initial?.vorwarnzeit ?? 'ueber_15min');
  const [inkontinenz, setInkontinenz] = useState<Inkontinenz>(initial?.inkontinenz ?? 'keine');
  const [vorlage, setVorlage] = useState(initial?.vorlage_gewechselt ?? false);
  const [schmerzen, setSchmerzen] = useState<Schmerz>(initial?.schmerzen ?? 0);
  const [blut, setBlut] = useState(initial?.blut ?? false);
  const [ort, setOrt] = useState<Ort>(initial?.ort ?? 'zuhause');
  const [notiz, setNotiz] = useState(initial?.notiz ?? '');
  const [fehler, setFehler] = useState(false);

  function speichern() {
    if (bristol === null) {
      setFehler(true);
      return;
    }
    onSubmit({
      zeitpunkt,
      bristol,
      vorwarnzeit,
      inkontinenz,
      vorlage_gewechselt: vorlage,
      schmerzen,
      blut,
      ort,
      notiz: notiz.trim() || undefined,
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-semibold">Stuhlform (Bristol)</h2>
          {fehler && <span className="text-sm text-red-500">Bitte wählen</span>}
        </div>
        <BristolPicker value={bristol} onChange={(b) => { setBristol(b); setFehler(false); }} />
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Vorwarnzeit</h2>
        <SegmentGroup ariaLabel="Vorwarnzeit" options={vorwarnOpts} value={vorwarnzeit} onChange={setVorwarnzeit} />
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Unwillkürlicher Abgang</h2>
        <SegmentGroup ariaLabel="Inkontinenz" options={inkontOpts} value={inkontinenz} onChange={setInkontinenz} />
      </div>

      <Collapsible title="Mehr (Schmerzen, Blut, Ort, Notiz)">
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Schmerzen / Krampf</h3>
          <SegmentGroup
            ariaLabel="Schmerzen"
            columns={4}
            options={schmerzOpts}
            value={String(schmerzen)}
            onChange={(v) => setSchmerzen(Number(v) as Schmerz)}
          />
        </div>
        <Toggle label="Blut sichtbar" checked={blut} onChange={setBlut} />
        <Toggle label="Vorlage / Wäsche gewechselt" checked={vorlage} onChange={setVorlage} />
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Ort</h3>
          <SegmentGroup ariaLabel="Ort" columns={3} options={ortOpts} value={ort} onChange={setOrt} />
        </div>
        <Field label="Zeitpunkt">
          <input
            type="datetime-local"
            className={inputClass}
            value={toDatetimeLocal(zeitpunkt)}
            onChange={(e) => setZeitpunkt(fromDatetimeLocal(e.target.value))}
          />
        </Field>
        <Field label="Notiz">
          <textarea className={inputClass} rows={2} value={notiz} onChange={(e) => setNotiz(e.target.value)} />
        </Field>
      </Collapsible>

      <div className="flex gap-2">
        {onCancel && (
          <BigButton variant="secondary" onClick={onCancel} className="flex-1">
            Abbrechen
          </BigButton>
        )}
        <BigButton onClick={speichern} className="flex-1">
          {submitLabel}
        </BigButton>
      </div>
    </div>
  );
}
