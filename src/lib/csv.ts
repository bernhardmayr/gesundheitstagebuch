import type { StuhlEintrag } from '../db/types';
import {
  formatDate,
  formatTime,
  bristolTyp,
  vorwarnzeitKurz,
  inkontinenzKurz,
  ortLabel,
  essensbezugLabel,
} from './format';

function csvCell(value: string | number | boolean | undefined): string {
  if (value === undefined) return '';
  const s = String(value);
  if (/[";\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const HEADER = [
  'Datum',
  'Uhrzeit',
  'Bristol',
  'Vorwarnzeit',
  'Inkontinenz',
  'Vorlage gewechselt',
  'Schmerzen (0-3)',
  'Blut',
  'Zeit seit Essen',
  'Min. nach geloggter Mahlzeit',
  'Ort',
  'Notiz',
];

export function stuhlToCsv(eintraege: StuhlEintrag[]): string {
  const rows = eintraege
    .slice()
    .sort((a, b) => a.zeitpunkt - b.zeitpunkt)
    .map((e) =>
      [
        formatDate(e.zeitpunkt),
        formatTime(e.zeitpunkt),
        bristolTyp[e.bristol],
        vorwarnzeitKurz[e.vorwarnzeit],
        inkontinenzKurz[e.inkontinenz],
        e.vorlage_gewechselt ? 'ja' : 'nein',
        e.schmerzen,
        e.blut ? 'ja' : 'nein',
        e.essensbezug ? essensbezugLabel[e.essensbezug] : '',
        e.minuten_nach_mahlzeit ?? '',
        ortLabel[e.ort],
        e.notiz ?? '',
      ]
        .map(csvCell)
        .join(';'),
    );
  // BOM für korrekte Umlaute in Excel
  return '﻿' + [HEADER.join(';'), ...rows].join('\r\n');
}

export function downloadText(filename: string, text: string, mime = 'text/plain'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
