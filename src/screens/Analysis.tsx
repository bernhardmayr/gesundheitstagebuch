import { useState } from 'react';
import { useZeitraum } from '../lib/useZeitraum';
import { computeKennzahlen, num, pct } from '../lib/derive';
import { EmptyState, StatCard } from '../components/ui';
import {
  StuehleProTagChart,
  BristolChart,
  MahlzeitHistogramm,
  EssensbezugChart,
  OrtChart,
  GewichtChart,
} from '../components/Charts';
import { Heatmap } from '../components/Heatmap';
import { InkontinenzTimeline } from '../components/InkontinenzTimeline';
import { SegmentGroup } from '../components/SegmentGroup';
import { formatDatum, KEINE_ANGABEN } from '../lib/format';

const zeitraeume = [
  { value: '7', label: '7 Tage' },
  { value: '30', label: '30 Tage' },
  { value: '90', label: '90 Tage' },
  { value: '0', label: 'Alles' },
];

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <h2 className="font-semibold">{title}</h2>
      {hint && <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      <div className={hint ? '' : 'mt-2'}>{children}</div>
    </section>
  );
}

export function Analysis() {
  const [zeitraum, setZeitraum] = useState('30');
  const data = useZeitraum(Number(zeitraum));
  const k = computeKennzahlen(data.stuhl, data.tage, data.tageCount);

  const einschraenkungen = data.tage
    .filter((t) => t.toilettenangst || (t.einschraenkung && t.einschraenkung.trim()))
    .sort((a, b) => b.datum.localeCompare(a.datum));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Auswertung</h1>

      <SegmentGroup
        ariaLabel="Zeitraum"
        columns={4}
        options={zeitraeume}
        value={zeitraum}
        onChange={setZeitraum}
      />

      {data.loading ? (
        <p className="text-slate-500">Lädt …</p>
      ) : data.stuhl.length === 0 && data.tage.length === 0 ? (
        <EmptyState>Im gewählten Zeitraum sind noch keine Einträge erfasst.</EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Stühle / Tag (Ø)"
              value={num(k.stuehleProTagDurchschnitt)}
              hint={k.anzahlStuehle ? `Median ${num(k.stuehleProTagMedian, 0)} · Max ${num(k.stuehleProTagMax, 0)}` : undefined}
            />
            <StatCard label="Durchfallstühle" value={k.anzahlStuehle ? pct(k.anteilDurchfall) : KEINE_ANGABEN} hint="Bristol 6–7" />
            <StatCard label="Kurze Vorwarnzeit" value={k.anzahlStuehle ? pct(k.anteilVorwarnUnter5) : KEINE_ANGABEN} hint="< 5 Min" />
            <StatCard label="Inkontinenz / Woche" value={num(k.inkontinenzProWoche)} hint={`${k.inkontinenzGesamt} gesamt`} />
            <StatCard label="Nächte mit Stuhl" value={num(k.naechteMitStuhl, 0)} hint="23–06 Uhr" />
            <StatCard
              label="Essensbezug < 60 Min"
              value={k.anteilEssensbezugKurz !== undefined ? pct(k.anteilEssensbezugKurz) : KEINE_ANGABEN}
              hint={
                k.essensbezugBasis
                  ? `davon < 15 Min: ${pct(k.anteilEssensbezugSehrKurz ?? 0)} · n = ${k.essensbezugBasis}`
                  : 'Zeit seit dem Essen'
              }
            />
          </div>

          <Card title="Stühle pro Tag" hint="Referenzlinie bei 3 (obere Norm)">
            <StuehleProTagChart eintraege={data.stuhl} />
          </Card>

          <Card title="Verteilung Bristol-Stuhlform">
            <BristolChart eintraege={data.stuhl} />
          </Card>

          <Card title="Zeitliche Verteilung (Stunde × Tag)" hint="Zeigt Nachtstühle und Kopplung an Mahlzeiten">
            <Heatmap eintraege={data.stuhl} />
          </Card>

          <Card title="Zeit seit dem letzten Essen" hint="Direkt beim Stuhlgang erfasst">
            <EssensbezugChart eintraege={data.stuhl} />
          </Card>

          <Card title="Ort der Stuhlgänge">
            <OrtChart eintraege={data.stuhl} />
          </Card>

          <Card title="Minuten nach geloggter Mahlzeit" hint="Ergänzend, nur aus separat eingetragenen Mahlzeiten">
            <MahlzeitHistogramm eintraege={data.stuhl} />
          </Card>

          <Card title="Inkontinenzereignisse" hint="Zeitstrahl über den Zeitraum">
            <InkontinenzTimeline eintraege={data.stuhl} vonMs={data.vonMs} bisMs={data.bisMs} />
          </Card>

          <Card title="Gewichtsverlauf">
            <GewichtChart tage={data.tage} />
          </Card>

          <Card title="Dokumentierte Alltagseinschränkungen">
            {einschraenkungen.length === 0 ? (
              <EmptyState>Noch keine Einschränkungen dokumentiert (Tagesabschluss).</EmptyState>
            ) : (
              <ul className="space-y-2 text-sm">
                {einschraenkungen.map((t) => (
                  <li key={t.datum} className="flex gap-2">
                    <span className="tabular-nums text-slate-500">{formatDatum(t.datum).slice(0, 5)}</span>
                    <span className="text-slate-700 dark:text-slate-200">
                      {t.einschraenkung || (t.toilettenangst ? 'Aktivität wegen Toilettensorge vermieden' : '')}
                      {t.arbeitsunfaehig && ' · arbeitsunfähig'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
