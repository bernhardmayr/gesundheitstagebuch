import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { getStammdaten } from '../db/repo';
import { useZeitraum } from '../lib/useZeitraum';
import { computeKennzahlen, dokumentationszeitraum } from '../lib/derive';
import { StuehleProTagChart, BristolChart, EssensbezugChart } from '../components/Charts';
import { SegmentGroup } from '../components/SegmentGroup';
import { BigButton } from '../components/ui';
import { stuhlToCsv, downloadText, downloadBlob } from '../lib/csv';
import { berichtKopf, berichtKennzahlen, rohdatenZeile, ROHDATEN_SPALTEN, FUSSZEILE } from '../lib/bericht';
import { formatDate } from '../lib/format';

const zeitraeume = [
  { value: '30', label: '30 Tage' },
  { value: '90', label: '90 Tage' },
  { value: '180', label: '180 Tage' },
  { value: '0', label: 'Alles' },
];

// Teilen-Dialog mit Datei (iOS/Android): darüber lässt sich das PDF in „Dateien" sichern oder
// direkt versenden. Desktop-Browser bekommen nur den Download.
const kannTeilen = (() => {
  try {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [new File([''], 'test.pdf', { type: 'application/pdf' })] })
    );
  } catch {
    return false;
  }
})();

export function Report() {
  const [zeitraum, setZeitraum] = useState('90');
  const [status, setStatus] = useState<string | null>(null);
  const data = useZeitraum(Number(zeitraum));
  // null = keine Stammdaten gespeichert (undefined bedeutet bei useLiveQuery „lädt noch“)
  const stammdaten = useLiveQuery(async () => (await getStammdaten()) ?? null, []);
  // Zeitraum und „pro Woche"-Basis aus den tatsächlich vorhandenen Einträgen, nicht aus dem
  // Filterfenster — sonst weicht der angegebene vom erfassten Zeitraum ab.
  const doku = dokumentationszeitraum(data.stuhl, data.tage);
  const k = computeKennzahlen(data.stuhl, data.tage, doku?.tage ?? data.tageCount);
  const erstelltAm = formatDate(Date.now());
  const navigate = useNavigate();
  const fehlendeStammdaten =
    stammdaten === undefined
      ? []
      : [
          !stammdaten?.name && 'Name',
          !stammdaten?.geburtsdatum && 'Geburtsdatum',
        ].filter((f): f is string => !!f);

  async function pdf(art: 'download' | 'teilen') {
    setStatus('PDF wird erstellt …');
    try {
      // jsPDF erst bei Bedarf laden — hält den Start der App schlank
      const { erzeugeBerichtPdf, berichtDateiname } = await import('../lib/pdf');
      const doc = erzeugeBerichtPdf({
        stammdaten: stammdaten ?? undefined,
        stuhl: data.stuhl,
        tage: data.tage,
        kennzahlen: k,
        doku,
      });
      const blob = doc.output('blob');
      const name = berichtDateiname();
      if (art === 'teilen') {
        await navigator.share({ files: [new File([blob], name, { type: 'application/pdf' })] });
      } else {
        downloadBlob(name, blob);
      }
      setStatus(null);
    } catch (e) {
      // Abbruch des Teilen-Dialogs ist kein Fehler
      setStatus(e instanceof DOMException && e.name === 'AbortError' ? null : 'PDF konnte nicht erstellt werden.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="no-print space-y-4">
        <h1 className="text-xl font-semibold">Arztbericht</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Vorschau des Berichts. Das PDF enthält dieselben Angaben, mit Seitenzahlen und vollständiger
          Rohdatentabelle.
        </p>
        {fehlendeStammdaten.length > 0 && (
          <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-4 space-y-3">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              <span className="font-semibold">Briefkopf unvollständig:</span> {fehlendeStammdaten.join(', ')}{' '}
              {fehlendeStammdaten.length === 1 ? 'fehlt' : 'fehlen'}. Im Bericht steht dort sonst
              „keine Angaben“.
            </p>
            <BigButton variant="secondary" onClick={() => navigate('/einstellungen')} className="w-full">
              Stammdaten eintragen
            </BigButton>
          </div>
        )}
        <SegmentGroup ariaLabel="Zeitraum" columns={4} options={zeitraeume} value={zeitraum} onChange={setZeitraum} />
        <div className={`grid gap-3 ${kannTeilen ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <BigButton onClick={() => pdf('download')}>PDF herunterladen</BigButton>
          {kannTeilen && (
            <BigButton variant="secondary" onClick={() => pdf('teilen')}>
              PDF teilen
            </BigButton>
          )}
          <BigButton
            variant="secondary"
            onClick={() => downloadText(`tagebuch-${zeitraum}tage.csv`, stuhlToCsv(data.stuhl), 'text/csv')}
          >
            CSV exportieren
          </BigButton>
        </div>
        {status && <p className="text-sm text-slate-600 dark:text-slate-300">{status}</p>}
      </div>

      {/* Bildschirmvorschau */}
      <div className="rounded-2xl bg-white text-black shadow-sm print:rounded-none print:shadow-none">
        {/* Seite 1 – Zusammenfassung */}
        <div className="print-page p-6">
          <h2 className="text-lg font-bold">Symptomtagebuch – Darmfunktion</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {berichtKopf(stammdaten ?? undefined, k, doku).map(([label, wert]) => (
                <Zeile key={label} label={label} wert={wert} />
              ))}
            </tbody>
          </table>

          <h3 className="mt-5 font-bold">Kennzahlen</h3>
          <table className="mt-2 w-full border-collapse text-sm">
            <tbody>
              {berichtKennzahlen(k).map(([label, wert]) => (
                <KZ key={label} label={label} wert={wert} />
              ))}
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
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-black text-left">
                  {ROHDATEN_SPALTEN.map((s) => (
                    <th key={s} className="py-1 pr-2 whitespace-nowrap">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.stuhl.map((e) => (
                  <tr key={e.id} className="border-b border-slate-300 align-top">
                    {rohdatenZeile(e).map((wert, i) => (
                      <td key={i} className={`py-1 pr-2 ${i < ROHDATEN_SPALTEN.length - 1 ? 'whitespace-nowrap' : 'min-w-[10rem]'}`}>
                        {wert}
                      </td>
                    ))}
                  </tr>
                ))}
                {data.stuhl.length === 0 && (
                  <tr>
                    <td colSpan={ROHDATEN_SPALTEN.length} className="py-2 text-slate-500">
                      Keine Einträge im Zeitraum.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-6 border-t border-slate-300 pt-2 text-center text-[11px] text-slate-500">
            {FUSSZEILE} · erstellt am {erstelltAm}
          </p>
        </div>
      </div>
    </div>
  );
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
      <td className="py-1.5 text-right font-semibold">{wert}</td>
    </tr>
  );
}
