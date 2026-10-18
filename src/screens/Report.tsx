import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getStammdaten } from '../db/repo';
import { useZeitraum } from '../lib/useZeitraum';
import { computeKennzahlen, dokumentationszeitraum, num, pct, type Verteilung } from '../lib/derive';
import { StuehleProTagChart, BristolChart, EssensbezugChart } from '../components/Charts';
import { SegmentGroup } from '../components/SegmentGroup';
import { BigButton } from '../components/ui';
import { stuhlToCsv, downloadText } from '../lib/csv';
import {
  formatDate,
  formatTime,
  formatDatum,
  bristolTyp,
  vorwarnzeitKurz,
  inkontinenzKurz,
  ortLabel,
  essensbezugLabel,
  essensbezugKurz,
  KEINE_ANGABEN,
} from '../lib/format';
import type { StuhlEintrag } from '../db/types';

const zeitraeume = [
  { value: '30', label: '30 Tage' },
  { value: '90', label: '90 Tage' },
  { value: '180', label: '180 Tage' },
  { value: '0', label: 'Alles' },
];

export function Report() {
  const [zeitraum, setZeitraum] = useState('90');
  const data = useZeitraum(Number(zeitraum));
  const stammdaten = useLiveQuery(getStammdaten, []);
  // Zeitraum und „pro Woche"-Basis aus den tatsächlich vorhandenen Einträgen, nicht aus dem
  // Filterfenster — sonst weicht der angegebene vom erfassten Zeitraum ab.
  const doku = dokumentationszeitraum(data.stuhl, data.tage);
  const k = computeKennzahlen(data.stuhl, data.tage, doku?.tage ?? data.tageCount);
  const erstelltAm = formatDate(Date.now());
  const hatStuhl = k.anzahlStuehle > 0;

  const zeitraumText = doku
    ? `${formatDate(doku.vonMs)} – ${formatDate(doku.bisMs)} (${doku.tage} Kalendertage)`
    : KEINE_ANGABEN;

  return (
    <div className="space-y-4">
      <div className="no-print space-y-4">
        <h1 className="text-xl font-semibold">Arztbericht</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Vorschau des druckbaren Berichts. Über „Als PDF drucken“ im Druckdialog „Als PDF speichern“
          wählen. {!stammdaten?.name && 'Tipp: Stammdaten unter „Mehr“ ausfüllen für den Briefkopf.'}
        </p>
        <SegmentGroup ariaLabel="Zeitraum" columns={4} options={zeitraeume} value={zeitraum} onChange={setZeitraum} />
        <div className="grid grid-cols-2 gap-3">
          <BigButton onClick={() => window.print()}>Als PDF drucken</BigButton>
          <BigButton
            variant="secondary"
            onClick={() => downloadText(`tagebuch-${zeitraum}tage.csv`, stuhlToCsv(data.stuhl), 'text/csv')}
          >
            CSV exportieren
          </BigButton>
        </div>
      </div>

      {/* Druckbares Dokument */}
      <div className="rounded-2xl bg-white text-black shadow-sm print:rounded-none print:shadow-none">
        {/* Wiederholte Fußzeile beim Drucken */}
        <div className="print-only print-footer">
          Selbstdokumentation der/des Betroffenen · erstellt am {erstelltAm} · Seite dient der
          persönlichen Symptomdokumentation, keine ärztliche Erhebung
        </div>

        {/* Seite 1 – Zusammenfassung */}
        <div className="print-page p-6">
          <h2 className="text-lg font-bold">Symptomtagebuch – Darmfunktion</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              <Zeile label="Name" wert={stammdaten?.name || KEINE_ANGABEN} />
              <Zeile label="Geburtsdatum" wert={stammdaten?.geburtsdatum ? formatDatum(stammdaten.geburtsdatum) : KEINE_ANGABEN} />
              <Zeile label="Aktenzeichen" wert={stammdaten?.aktenzeichen || KEINE_ANGABEN} />
              <Zeile label="Dokumentationszeitraum" wert={zeitraumText} />
              <Zeile label="Dokumentierte Tage" wert={String(k.dokumentierteTage)} />
              <Zeile label="Erfasste Stuhlgänge" wert={String(k.anzahlStuehle)} />
            </tbody>
          </table>

          <h3 className="mt-5 font-bold">Kennzahlen</h3>
          <table className="mt-2 w-full border-collapse text-sm">
            <tbody>
              <KZ
                label="Stühle pro Tag (Ø / Median / Max)"
                wert={hatStuhl ? `${num(k.stuehleProTagDurchschnitt)} / ${num(k.stuehleProTagMedian, 0)} / ${num(k.stuehleProTagMax, 0)}` : KEINE_ANGABEN}
              />
              <KZ label="Anteil Durchfallstühle (Bristol 6–7)" wert={hatStuhl ? pct(k.anteilDurchfall) : KEINE_ANGABEN} />
              <KZ label="Nächte mit Stuhlgang (23–06 Uhr)" wert={hatStuhl ? `${k.naechteMitStuhl} (${k.anzahlNachtstuehle} Stühle)` : KEINE_ANGABEN} />
              <KZ label="Inkontinenzepisoden gesamt" wert={hatStuhl ? String(k.inkontinenzGesamt) : KEINE_ANGABEN} />
              <KZ label="Inkontinenzepisoden pro Woche" wert={hatStuhl ? num(k.inkontinenzProWoche) : KEINE_ANGABEN} />
              <KZ label="Anteil Stühle mit Vorwarnzeit < 5 Min" wert={hatStuhl ? pct(k.anteilVorwarnUnter5) : KEINE_ANGABEN} />
              <KZ
                label="Anteil Stühle mit kurzem Essensbezug (< 60 Min)"
                wert={
                  k.anteilEssensbezugKurz !== undefined
                    ? `${pct(k.anteilEssensbezugKurz)} (n = ${k.essensbezugBasis})`
                    : KEINE_ANGABEN
                }
              />
              <KZ
                label="Verteilung Zeit seit dem Essen"
                wert={verteilungText(k.essensbezugVerteilung, (key) => essensbezugLabel[key])}
              />
              {k.avgMinutenNachMahlzeit !== undefined && (
                <KZ
                  label="Ø Minuten nach separat geloggter Mahlzeit"
                  wert={`${num(k.avgMinutenNachMahlzeit, 0)} Min`}
                />
              )}
              <KZ label="Verteilung der Orte" wert={verteilungText(k.ortVerteilung, (key) => ortLabel[key])} />
              <KZ
                label="Gewichtsveränderung im Zeitraum"
                wert={
                  k.gewichtDelta !== undefined
                    ? `${k.gewichtDelta > 0 ? '+' : ''}${num(k.gewichtDelta)} kg (${num(k.gewichtStart)} → ${num(k.gewichtEnde)} kg)`
                    : KEINE_ANGABEN
                }
              />
              <KZ label="Tage mit Aktivitätseinschränkung" wert={String(k.eingeschraenkteTage)} />
              <KZ label="Arbeitsunfähige Tage" wert={String(k.arbeitsunfaehigeTage)} />
            </tbody>
          </table>
        </div>

        {/* Seite 2 – Grafiken */}
        <div className="print-page p-6">
          <h3 className="font-bold">Grafische Auswertung</h3>
          <div className="mt-3 space-y-6">
            <figure>
              <figcaption className="mb-1 text-sm font-medium">Stühle pro Tag (Referenzlinie bei 3)</figcaption>
              <StuehleProTagChart eintraege={data.stuhl} height={200} />
            </figure>
            <figure>
              <figcaption className="mb-1 text-sm font-medium">Verteilung der Bristol-Stuhlformen</figcaption>
              <BristolChart eintraege={data.stuhl} height={190} />
            </figure>
            <figure>
              <figcaption className="mb-1 text-sm font-medium">Zeit seit dem letzten Essen bis zum Stuhlgang</figcaption>
              <EssensbezugChart eintraege={data.stuhl} height={190} />
            </figure>
          </div>
        </div>

        {/* Seite 3+ – Rohdaten */}
        <div className="print-page p-6">
          <h3 className="font-bold">Rohdaten (chronologisch)</h3>
          <table className="mt-2 w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="py-1 pr-2">Datum</th>
                <th className="py-1 pr-2">Zeit</th>
                <th className="py-1 pr-2">Bristol</th>
                <th className="py-1 pr-2">Vorwarn.</th>
                <th className="py-1 pr-2">Inkont.</th>
                <th className="py-1 pr-2">Schm.</th>
                <th className="py-1 pr-2">Blut</th>
                <th className="py-1 pr-2">Essen</th>
                <th className="py-1 pr-2">Ort</th>
                <th className="py-1">Notiz</th>
              </tr>
            </thead>
            <tbody>
              {data.stuhl.map((e) => (
                <tr key={e.id} className="border-b border-slate-300 align-top">
                  <td className="py-1 pr-2 whitespace-nowrap">{formatDate(e.zeitpunkt)}</td>
                  <td className="py-1 pr-2 whitespace-nowrap">{formatTime(e.zeitpunkt)}</td>
                  <td className="py-1 pr-2">{bristolTyp[e.bristol]}</td>
                  <td className="py-1 pr-2 whitespace-nowrap">{vorwarnzeitKurz[e.vorwarnzeit]}</td>
                  <td className="py-1 pr-2">{inkontinenzKurz[e.inkontinenz]}</td>
                  <td className="py-1 pr-2">{e.schmerzen || ''}</td>
                  <td className="py-1 pr-2">{e.blut ? 'ja' : ''}</td>
                  <td className="py-1 pr-2 whitespace-nowrap">{essenZelle(e)}</td>
                  <td className="py-1 pr-2">{ortLabel[e.ort]}</td>
                  <td className="py-1">{e.notiz ?? ''}</td>
                </tr>
              ))}
              {data.stuhl.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-2 text-slate-500">
                    Keine Einträge im Zeitraum.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Sichtbare Fußzeile auf dem Bildschirm */}
          <p className="no-print mt-6 border-t border-slate-300 pt-2 text-center text-[11px] text-slate-500">
            Selbstdokumentation der/des Betroffenen · erstellt am {erstelltAm}
          </p>
        </div>
      </div>
    </div>
  );
}

// Kompakte Verteilung „Zuhause 12 · Unterwegs 3"; Einträge ohne Angabe separat ausgewiesen.
function verteilungText<K extends string>(v: Verteilung<K>, label: (k: K) => string): string {
  const teile = v.werte.filter((w) => w.anzahl > 0).map((w) => `${label(w.key)} ${w.anzahl}`);
  if (teile.length === 0) return KEINE_ANGABEN;
  if (v.ohneAngabe > 0) teile.push(`ohne Angabe ${v.ohneAngabe}`);
  return teile.join(' · ');
}

function essenZelle(e: StuhlEintrag): string {
  if (e.essensbezug) return essensbezugKurz[e.essensbezug];
  if (e.minuten_nach_mahlzeit !== undefined) return `${e.minuten_nach_mahlzeit} min (Mahlz.)`;
  return 'k. A.';
}

function Zeile({ label, wert }: { label: string; wert: string }) {
  return (
    <tr>
      <td className="w-56 py-0.5 pr-3 text-slate-600">{label}</td>
      <td className="py-0.5 font-medium">{wert}</td>
    </tr>
  );
}

function KZ({ label, wert }: { label: string; wert: string }) {
  return (
    <tr className="border-b border-slate-200">
      <td className="py-1.5 pr-3">{label}</td>
      <td className="py-1.5 text-right font-semibold whitespace-nowrap">{wert}</td>
    </tr>
  );
}
