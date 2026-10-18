import type {
  Bristol,
  Vorwarnzeit,
  Inkontinenz,
  Ort,
  Essensbezug,
  MahlzeitArt,
} from '../db/types';

export const bristolKurz: Record<Bristol, string> = {
  1: 'Einzelne harte Klümpchen',
  2: 'Wurstartig, klumpig',
  3: 'Wurstartig mit Rissen',
  4: 'Wurstartig, glatt',
  5: 'Weiche Klümpchen',
  6: 'Breiig, unförmig',
  7: 'Flüssig, keine festen Teile',
};

export const bristolTyp: Record<Bristol, string> = {
  1: 'Typ 1',
  2: 'Typ 2',
  3: 'Typ 3',
  4: 'Typ 4',
  5: 'Typ 5',
  6: 'Typ 6',
  7: 'Typ 7',
};

export const vorwarnzeitLabel: Record<Vorwarnzeit, string> = {
  sofort: 'Sofort (< 1 Min)',
  unter_5min: '< 5 Min',
  unter_15min: '< 15 Min',
  ueber_15min: '> 15 Min',
};

export const vorwarnzeitKurz: Record<Vorwarnzeit, string> = {
  sofort: 'sofort',
  unter_5min: '<5 min',
  unter_15min: '<15 min',
  ueber_15min: '>15 min',
};

export const inkontinenzLabel: Record<Inkontinenz, string> = {
  keine: 'Keine',
  stuhlschmieren: 'Stuhlschmieren',
  teilverlust: 'Teilverlust',
  vollverlust: 'Vollverlust',
};

export const inkontinenzKurz: Record<Inkontinenz, string> = {
  keine: '–',
  stuhlschmieren: 'Schmieren',
  teilverlust: 'Teilverlust',
  vollverlust: 'Vollverlust',
};

export const ortLabel: Record<Ort, string> = {
  zuhause: 'Zuhause',
  unterwegs: 'Unterwegs',
  arbeit: 'Arbeit',
};

export const essensbezugLabel: Record<Essensbezug, string> = {
  nuechtern: 'Nüchtern (> 3 h)',
  unter_5min: '< 5 Min (direkt danach)',
  '5_15min': '5–15 Min',
  '15_30min': '15–30 Min',
  unter_30min: '< 30 Min (grob, alt)',
  '30_60min': '30–60 Min',
  '1_2h': '1–2 h',
  ueber_2h: '> 2 h',
  unbekannt: 'Unbekannt',
};

export const essensbezugKurz: Record<Essensbezug, string> = {
  nuechtern: 'nüchtern',
  unter_5min: '<5 min',
  '5_15min': '5–15 min',
  '15_30min': '15–30 min',
  unter_30min: '<30 min',
  '30_60min': '30–60 min',
  '1_2h': '1–2 h',
  ueber_2h: '>2 h',
  unbekannt: 'unbek.',
};

// Einheitlicher Text für fehlende Werte — statt „–"/„—" (Spec 4, Darstellungsregel).
export const KEINE_ANGABEN = 'keine Angaben';

export const schmerzLabel = ['keine', 'leicht', 'mittel', 'stark'] as const;

export const mahlzeitLabel: Record<MahlzeitArt, string> = {
  fruehstueck: 'Frühstück',
  mittag: 'Mittag',
  abend: 'Abend',
  snack: 'Snack',
};

const dfTime = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });
const dfDate = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const dfWeekday = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export const formatTime = (ms: number) => dfTime.format(ms);
export const formatDate = (ms: number | Date) => dfDate.format(ms);
export const formatWeekday = (ms: number | Date) => dfWeekday.format(ms);

export function formatDatum(datum: string): string {
  const [y, m, d] = datum.split('-');
  return `${d}.${m}.${y}`;
}

// number (epoch ms) -> Wert für <input type="datetime-local">
export function toDatetimeLocal(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocal(value: string): number {
  return new Date(value).getTime();
}

// Nachtstuhl: 23:00–06:00 Uhr
export function istNacht(ms: number): boolean {
  const h = new Date(ms).getHours();
  return h >= 23 || h < 6;
}
