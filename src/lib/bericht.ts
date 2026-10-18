// Inhalte des Arztberichts — gemeinsam genutzt von der Bildschirmvorschau (Report.tsx) und
// dem PDF-Export (pdf.ts), damit beide garantiert dieselben Zahlen zeigen.
import type { Stammdaten, StuhlEintrag, TagesEintrag } from '../db/types';
import { num, pct, type Kennzahlen, type Verteilung } from './derive';
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
  schmerzLabel,
  KEINE_ANGABEN,
} from './format';

export type Zeile = [label: string, wert: string];

export interface Dokuzeitraum {
  vonMs: number;
  bisMs: number;
  tage: number;
}

export function berichtKopf(
  stammdaten: Stammdaten | undefined,
  k: Kennzahlen,
  doku: Dokuzeitraum | undefined,
): Zeile[] {
  return [
    ['Name', stammdaten?.name || KEINE_ANGABEN],
    ['Geburtsdatum', stammdaten?.geburtsdatum ? formatDatum(stammdaten.geburtsdatum) : KEINE_ANGABEN],
    ['Aktenzeichen', stammdaten?.aktenzeichen || KEINE_ANGABEN],
    [
      'Dokumentationszeitraum',
      doku
        ? `${formatDate(doku.vonMs)} – ${formatDate(doku.bisMs)} (${doku.tage} Kalendertage)`
        : KEINE_ANGABEN,
    ],
    ['Dokumentierte Tage', String(k.dokumentierteTage)],
    ['Erfasste Stuhlgänge', String(k.anzahlStuehle)],
  ];
}

export function berichtKennzahlen(k: Kennzahlen): Zeile[] {
  const hatStuhl = k.anzahlStuehle > 0;
  const wenn = (wert: string) => (hatStuhl ? wert : KEINE_ANGABEN);
  const essensAnteil = (v: number | undefined) =>
    v !== undefined ? `${pct(v)} (n = ${k.essensbezugBasis})` : KEINE_ANGABEN;

  const zeilen: Zeile[] = [
    [
      'Stühle pro Tag (Ø / Median / Max)',
      wenn(`${num(k.stuehleProTagDurchschnitt)} / ${num(k.stuehleProTagMedian, 0)} / ${num(k.stuehleProTagMax, 0)}`),
    ],
    ['Anteil Durchfallstühle (Bristol 6–7)', wenn(pct(k.anteilDurchfall))],
    ['Nächte mit Stuhlgang (23–06 Uhr)', wenn(`${k.naechteMitStuhl} (${k.anzahlNachtstuehle} Stühle)`)],
    ['Inkontinenzepisoden gesamt', wenn(String(k.inkontinenzGesamt))],
    ['Inkontinenzepisoden pro Woche', wenn(num(k.inkontinenzProWoche))],
    ['Anteil Stühle mit Vorwarnzeit < 5 Min', wenn(pct(k.anteilVorwarnUnter5))],
    ['Anteil Stühle mit kurzem Essensbezug (< 60 Min)', essensAnteil(k.anteilEssensbezugKurz)],
    ['Anteil Stühle mit sehr kurzem Essensbezug (< 15 Min)', essensAnteil(k.anteilEssensbezugSehrKurz)],
    ['Verteilung Zeit seit dem Essen', verteilungText(k.essensbezugVerteilung, (key) => essensbezugLabel[key])],
  ];
  if (k.avgMinutenNachMahlzeit !== undefined) {
    zeilen.push(['Ø Minuten nach separat geloggter Mahlzeit', `${num(k.avgMinutenNachMahlzeit, 0)} Min`]);
  }
  zeilen.push(
    ['Verteilung der Orte', verteilungText(k.ortVerteilung, (key) => ortLabel[key])],
    [
      'Gewichtsveränderung im Zeitraum',
      k.gewichtDelta !== undefined
        ? `${k.gewichtDelta > 0 ? '+' : ''}${num(k.gewichtDelta)} kg (von ${num(k.gewichtStart)} auf ${num(k.gewichtEnde)} kg)`
        : KEINE_ANGABEN,
    ],
    ['Tage mit Aktivitätseinschränkung', String(k.eingeschraenkteTage)],
    ['Arbeitsunfähige Tage', String(k.arbeitsunfaehigeTage)],
  );
  return zeilen;
}

// Kompakte Verteilung „Zuhause 12 · Unterwegs 3"; Einträge ohne Angabe separat ausgewiesen.
export function verteilungText<K extends string>(v: Verteilung<K>, label: (k: K) => string): string {
  const teile = v.werte.filter((w) => w.anzahl > 0).map((w) => `${label(w.key)} ${w.anzahl}`);
  if (teile.length === 0) return KEINE_ANGABEN;
  if (v.ohneAngabe > 0) teile.push(`ohne Angabe ${v.ohneAngabe}`);
  return teile.join(' · ');
}

export function essenZelle(e: StuhlEintrag): string {
  if (e.essensbezug) return essensbezugKurz[e.essensbezug];
  if (e.minuten_nach_mahlzeit !== undefined) return `${e.minuten_nach_mahlzeit} min (Mahlz.)`;
  return 'k. A.';
}

export const ROHDATEN_SPALTEN = [
  'Datum',
  'Zeit',
  'Bristol',
  'Vorwarnzeit',
  'Inkontinenz',
  'Vorlage',
  'Schmerz',
  'Blut',
  'Essen',
  'Ort',
  'Notiz',
];

export function rohdatenZeile(e: StuhlEintrag): string[] {
  return [
    formatDate(e.zeitpunkt),
    formatTime(e.zeitpunkt),
    bristolTyp[e.bristol],
    vorwarnzeitKurz[e.vorwarnzeit],
    inkontinenzKurz[e.inkontinenz],
    e.vorlage_gewechselt ? 'ja' : '',
    e.schmerzen ? schmerzLabel[e.schmerzen] : '',
    e.blut ? 'ja' : '',
    essenZelle(e),
    ortLabel[e.ort],
    e.notiz ?? '',
  ];
}

export const TAGESDATEN_SPALTEN = [
  'Datum',
  'Gewicht',
  'Appetit',
  'Befinden',
  'Toilettenangst',
  'AU',
  'Einschränkung',
  'Medikamente',
];

export function tagesdatenZeile(t: TagesEintrag): string[] {
  return [
    formatDatum(t.datum),
    t.gewicht_kg !== undefined ? `${num(t.gewicht_kg)} kg` : '',
    `${t.appetit}/5`,
    `${t.allgemeinbefinden}/5`,
    t.toilettenangst ? 'ja' : '',
    t.arbeitsunfaehig ? 'ja' : '',
    t.einschraenkung ?? '',
    t.medikamente?.join(', ') ?? '',
  ];
}

export const FUSSZEILE =
  'Selbstdokumentation der/des Betroffenen – keine ärztliche Erhebung';
