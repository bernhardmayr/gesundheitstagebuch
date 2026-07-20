// Ableitungen / Kennzahlen — werden berechnet, nicht gespeichert.
import type { StuhlEintrag, TagesEintrag, Vorwarnzeit } from '../db/types';
import { istNacht } from './format';
import { toDatum } from '../db/repo';

export function median(werte: number[]): number | undefined {
  if (werte.length === 0) return undefined;
  const s = [...werte].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function mittelwert(werte: number[]): number | undefined {
  if (werte.length === 0) return undefined;
  return werte.reduce((a, b) => a + b, 0) / werte.length;
}

const vorwarnMin: Record<Vorwarnzeit, number> = {
  sofort: 0,
  unter_5min: 5,
  unter_15min: 15,
  ueber_15min: 30,
};

export interface Kennzahlen {
  anzahlStuehle: number;
  dokumentierteTage: number;
  stuehleProTagDurchschnitt?: number;
  stuehleProTagMedian?: number;
  stuehleProTagMax?: number;
  anteilDurchfall: number; // Bristol 6–7, 0..1
  naechteMitStuhl: number;
  anzahlNachtstuehle: number;
  inkontinenzGesamt: number;
  inkontinenzProWoche?: number;
  anteilVorwarnUnter5: number; // 0..1 (sofort + unter_5min)
  medianVorwarnMin?: number;
  avgMinutenNachMahlzeit?: number;
  gewichtStart?: number;
  gewichtEnde?: number;
  gewichtDelta?: number;
  eingeschraenkteTage: number;
  arbeitsunfaehigeTage: number;
}

export interface StuehleProTag {
  datum: string;
  anzahl: number;
}

export function stuehleProTag(eintraege: StuhlEintrag[]): StuehleProTag[] {
  const map = new Map<string, number>();
  for (const e of eintraege) {
    const d = toDatum(e.zeitpunkt);
    map.set(d, (map.get(d) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([datum, anzahl]) => ({ datum, anzahl }))
    .sort((a, b) => a.datum.localeCompare(b.datum));
}

export function bristolVerteilung(eintraege: StuhlEintrag[]): { bristol: number; anzahl: number }[] {
  const counts = [1, 2, 3, 4, 5, 6, 7].map((b) => ({
    bristol: b,
    anzahl: eintraege.filter((e) => e.bristol === b).length,
  }));
  return counts;
}

export function istInkontinenzEpisode(e: StuhlEintrag): boolean {
  return e.inkontinenz !== 'keine';
}

export function computeKennzahlen(
  stuhl: StuhlEintrag[],
  tage: TagesEintrag[],
  zeitraumTage: number,
): Kennzahlen {
  const proTag = stuehleProTag(stuhl);
  const anzahlProTag = proTag.map((p) => p.anzahl);

  // dokumentierte Tage: Tage mit mind. einem Stuhl- ODER Tageseintrag
  const tageSet = new Set<string>(proTag.map((p) => p.datum));
  for (const t of tage) tageSet.add(t.datum);

  const durchfall = stuhl.filter((e) => e.bristol >= 6).length;
  const nachtEintraege = stuhl.filter((e) => istNacht(e.zeitpunkt));
  const naechteSet = new Set(nachtEintraege.map((e) => toDatum(e.zeitpunkt)));

  const inkont = stuhl.filter(istInkontinenzEpisode);
  const vorwarnUnter5 = stuhl.filter(
    (e) => e.vorwarnzeit === 'sofort' || e.vorwarnzeit === 'unter_5min',
  ).length;
  const vorwarnWerte = stuhl.map((e) => vorwarnMin[e.vorwarnzeit]);
  const mahlzeitWerte = stuhl
    .map((e) => e.minuten_nach_mahlzeit)
    .filter((v): v is number => typeof v === 'number');

  const gewichte = tage
    .filter((t) => typeof t.gewicht_kg === 'number')
    .sort((a, b) => a.datum.localeCompare(b.datum));
  const gewichtStart = gewichte[0]?.gewicht_kg;
  const gewichtEnde = gewichte[gewichte.length - 1]?.gewicht_kg;

  const wochen = Math.max(zeitraumTage / 7, 1 / 7);

  return {
    anzahlStuehle: stuhl.length,
    dokumentierteTage: tageSet.size,
    stuehleProTagDurchschnitt: mittelwert(anzahlProTag),
    stuehleProTagMedian: median(anzahlProTag),
    stuehleProTagMax: anzahlProTag.length ? Math.max(...anzahlProTag) : undefined,
    anteilDurchfall: stuhl.length ? durchfall / stuhl.length : 0,
    naechteMitStuhl: naechteSet.size,
    anzahlNachtstuehle: nachtEintraege.length,
    inkontinenzGesamt: inkont.length,
    inkontinenzProWoche: inkont.length / wochen,
    anteilVorwarnUnter5: stuhl.length ? vorwarnUnter5 / stuhl.length : 0,
    medianVorwarnMin: median(vorwarnWerte),
    avgMinutenNachMahlzeit: mittelwert(mahlzeitWerte),
    gewichtStart,
    gewichtEnde,
    gewichtDelta:
      gewichtStart !== undefined && gewichtEnde !== undefined
        ? gewichtEnde - gewichtStart
        : undefined,
    eingeschraenkteTage: tage.filter(
      (t) => t.toilettenangst || (t.einschraenkung && t.einschraenkung.trim() !== ''),
    ).length,
    arbeitsunfaehigeTage: tage.filter((t) => t.arbeitsunfaehig).length,
  };
}

export function pct(v: number): string {
  return `${Math.round(v * 100)} %`;
}

export function num(v: number | undefined, digits = 1): string {
  if (v === undefined || Number.isNaN(v)) return '–';
  return v.toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}
