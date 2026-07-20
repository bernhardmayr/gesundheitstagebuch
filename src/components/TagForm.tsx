import { useState } from 'react';
import type { Skala5, TagesEintrag } from '../db/types';
import { SegmentGroup } from './SegmentGroup';
import { BigButton, Field, Toggle, inputClass } from './ui';

const skalaOpts = ([1, 2, 3, 4, 5] as Skala5[]).map((n) => ({ value: String(n), label: String(n) }));

export function TagForm({
  datum,
  initial,
  onSubmit,
  onDatumChange,
  onCancel,
  submitLabel = 'Speichern',
  allowDatum = true,
}: {
  datum: string;
  initial?: Partial<TagesEintrag>;
  onSubmit: (data: TagesEintrag) => void;
  onDatumChange?: (d: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
  allowDatum?: boolean;
}) {
  const [gewicht, setGewicht] = useState(initial?.gewicht_kg?.toString() ?? '');
  const [appetit, setAppetit] = useState<Skala5>(initial?.appetit ?? 3);
  const [befinden, setBefinden] = useState<Skala5>(initial?.allgemeinbefinden ?? 3);
  const [toilettenangst, setToilettenangst] = useState(initial?.toilettenangst ?? false);
  const [einschraenkung, setEinschraenkung] = useState(initial?.einschraenkung ?? '');
  const [arbeitsunfaehig, setArbeitsunfaehig] = useState(initial?.arbeitsunfaehig ?? false);
  const [medikamente, setMedikamente] = useState((initial?.medikamente ?? []).join(', '));

  return (
    <div className="space-y-5">
      {allowDatum && (
        <Field label="Datum">
          <input
            type="date"
            className={inputClass}
            value={datum}
            onChange={(e) => onDatumChange?.(e.target.value)}
          />
        </Field>
      )}

      <Field label="Gewicht (kg, optional)">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          className={inputClass}
          value={gewicht}
          onChange={(e) => setGewicht(e.target.value)}
        />
      </Field>

      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          Appetit (1 = sehr schlecht, 5 = sehr gut)
        </h3>
        <SegmentGroup
          ariaLabel="Appetit"
          columns={5}
          options={skalaOpts}
          value={String(appetit)}
          onChange={(v) => setAppetit(Number(v) as Skala5)}
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          Allgemeinbefinden (1 = sehr schlecht, 5 = sehr gut)
        </h3>
        <SegmentGroup
          ariaLabel="Allgemeinbefinden"
          columns={5}
          options={skalaOpts}
          value={String(befinden)}
          onChange={(v) => setBefinden(Number(v) as Skala5)}
        />
      </div>

      <Toggle
        label="Aktivität wegen Toilettensorge vermieden"
        checked={toilettenangst}
        onChange={setToilettenangst}
      />
      <Toggle label="Arbeitsunfähig" checked={arbeitsunfaehig} onChange={setArbeitsunfaehig} />

      <Field label="Konkrete Einschränkung (optional)">
        <input
          className={inputClass}
          placeholder="z. B. Geburtstag abgesagt, Zug nicht genommen"
          value={einschraenkung}
          onChange={(e) => setEinschraenkung(e.target.value)}
        />
      </Field>

      <Field label="Medikamente (kommagetrennt)">
        <input
          className={inputClass}
          placeholder="z. B. Loperamid, Flohsamen"
          value={medikamente}
          onChange={(e) => setMedikamente(e.target.value)}
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
              datum,
              gewicht_kg: gewicht.trim() ? Number(gewicht.replace(',', '.')) : undefined,
              appetit,
              allgemeinbefinden: befinden,
              toilettenangst,
              einschraenkung: einschraenkung.trim() || undefined,
              arbeitsunfaehig,
              medikamente: medikamente.trim()
                ? medikamente.split(',').map((m) => m.trim()).filter(Boolean)
                : undefined,
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
