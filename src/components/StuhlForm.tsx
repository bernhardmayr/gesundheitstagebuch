import { useEffect, useRef, useState } from 'react';
import type {
  Bristol,
  Essensbezug,
  Inkontinenz,
  Ort,
  Schmerz,
  StuhlEintrag,
  Vorwarnzeit,
} from '../db/types';
import { letzterOrtHeute } from '../db/repo';
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

const essensOpts: { value: Essensbezug; label: string; sub?: string }[] = [
  { value: 'unter_5min', label: '< 5 Min', sub: 'direkt danach' },
  { value: '5_15min', label: '5–15 Min' },
  { value: '15_30min', label: '15–30 Min' },
  { value: '30_60min', label: '30–60 Min' },
  { value: '1_2h', label: '1–2 h' },
  { value: 'ueber_2h', label: '> 2 h' },
  { value: 'nuechtern', label: 'Nüchtern', sub: '> 3 h nichts' },
  { value: 'unbekannt', label: 'Unbekannt' },
];

// Ort-Vorbelegung: zuletzt gewählter Ort dieser Sitzung (Spec 1.1 „sticky statt mild").
// Kein fixer Default — ohne Vorwert bleibt der Ort leer und muss gewählt werden.
const ORT_KEY = 'stuhlform.sitzungsOrt';
let sitzungsOrt: Ort | undefined = (() => {
  try {
    return (sessionStorage.getItem(ORT_KEY) as Ort | null) ?? undefined;
  } catch {
    return undefined;
  }
})();

function merkeSitzungsOrt(ort: Ort) {
  sitzungsOrt = ort;
  try {
    sessionStorage.setItem(ORT_KEY, ort);
  } catch {
    // Speicher nicht verfügbar — Modulvariable genügt für die laufende Sitzung.
  }
}

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
  const [ort, setOrt] = useState<Ort | null>(initial?.ort ?? sitzungsOrt ?? null);
  // „übernommen" = Ort wurde vorbelegt, nicht aus einem bestehenden Eintrag und nicht getippt
  const [ortUebernommen, setOrtUebernommen] = useState(!initial?.ort && !!sitzungsOrt);
  const ortGetippt = useRef(false);
  const [essensbezug, setEssensbezug] = useState<Essensbezug | null>(initial?.essensbezug ?? null);
  const [notiz, setNotiz] = useState(initial?.notiz ?? '');
  const [fehler, setFehler] = useState(false);
  const [ortFehler, setOrtFehler] = useState(false);
  const [essensFehler, setEssensFehler] = useState(false);

  // Bearbeiten eines Alt-Eintrags (vor v1.1, ohne essensbezug): Feld bleibt optional,
  // damit Altbestände nicht rückwirkend umgedeutet werden müssen.
  const essensbezugPflicht = !initial?.id;

  useEffect(() => {
    if (initial?.ort || sitzungsOrt) return;
    let aktiv = true;
    letzterOrtHeute().then((o) => {
      if (!aktiv || !o || ortGetippt.current) return;
      setOrt(o);
      setOrtUebernommen(true);
    });
    return () => {
      aktiv = false;
    };
  }, [initial?.ort]);

  function speichern() {
    const ohneBristol = bristol === null;
    const ohneOrt = ort === null;
    const ohneEssen = essensbezugPflicht && essensbezug === null;
    setFehler(ohneBristol);
    setOrtFehler(ohneOrt);
    setEssensFehler(ohneEssen);
    if (bristol === null || ort === null || ohneEssen) return;
    merkeSitzungsOrt(ort);
    onSubmit({
      zeitpunkt,
      bristol,
      vorwarnzeit,
      inkontinenz,
      vorlage_gewechselt: vorlage,
      schmerzen,
      blut,
      ort,
      essensbezug: essensbezug ?? undefined,
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

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="font-semibold">Ort</h2>
          {ortFehler ? (
            <span className="text-sm text-red-500">Bitte wählen</span>
          ) : (
            ortUebernommen && (
              <span className="text-xs text-sky-700 dark:text-sky-300">übernommen – antippen zum Ändern</span>
            )
          )}
        </div>
        <SegmentGroup
          ariaLabel="Ort"
          columns={3}
          options={ortOpts}
          value={ort}
          carried={ortUebernommen}
          onChange={(o) => {
            ortGetippt.current = true;
            setOrt(o);
            setOrtUebernommen(false);
            setOrtFehler(false);
          }}
        />
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="font-semibold">Zeit seit dem letzten Essen</h2>
          {essensFehler && <span className="text-sm text-red-500">Bitte wählen</span>}
        </div>
        <SegmentGroup
          ariaLabel="Zeit seit dem letzten Essen"
          columns={3}
          options={
            // Altwert „< 30 Min" nur zeigen, wenn ein bestehender Eintrag ihn trägt
            essensbezug === 'unter_30min'
              ? [...essensOpts, { value: 'unter_30min', label: '< 30 Min', sub: 'alt, bitte präzisieren' }]
              : essensOpts
          }
          value={essensbezug}
          onChange={(e) => {
            setEssensbezug(e);
            setEssensFehler(false);
          }}
        />
      </div>

      <Collapsible title="Mehr (Schmerzen, Blut, Vorlage, Zeitpunkt, Notiz)">
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
