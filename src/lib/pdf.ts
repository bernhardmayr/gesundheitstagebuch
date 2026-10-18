// Arztbericht als echtes PDF, komplett im Browser erzeugt (die Daten verlassen das Gerät nicht).
// Ersetzt den Weg über die Druckfunktion des Browsers: Dort hingen Seitenumbruch, Breite und
// Fußzeile vom Browser ab (Safari schnitt u. a. Rohdatenzeilen ab).
import { jsPDF } from 'jspdf';
import { autoTable, type CellHookData } from 'jspdf-autotable';
import type { Stammdaten, StuhlEintrag, TagesEintrag } from '../db/types';
import {
  bristolVerteilung,
  essensbezugVerteilung,
  stuehleProTag,
  type Kennzahlen,
} from './derive';
import {
  berichtKopf,
  berichtKennzahlen,
  rohdatenZeile,
  tagesdatenZeile,
  ROHDATEN_SPALTEN,
  TAGESDATEN_SPALTEN,
  FUSSZEILE,
  type Dokuzeitraum,
} from './bericht';
import { formatDate, formatDatum, essensbezugKurz } from './format';

export interface BerichtDaten {
  stammdaten?: Stammdaten;
  stuhl: StuhlEintrag[];
  tage: TagesEintrag[];
  kennzahlen: Kennzahlen;
  doku?: Dokuzeitraum;
}

// A4 hochkant, Maße in mm
const SEITE_B = 210;
const SEITE_H = 297;
const RAND_L = 15;
const RAND_R = 15;
const RAND_O = 18;
const RAND_U = 18;
const INHALT_B = SEITE_B - RAND_L - RAND_R;

const GRAU: [number, number, number] = [90, 90, 90];
const LINIE: [number, number, number] = [200, 200, 200];
const BRISTOL_FARBEN = ['#92400e', '#b45309', '#d97706', '#16a34a', '#65a30d', '#eab308', '#dc2626'];

// Die Standardschrift (Helvetica, WinAnsi) kann kein volles Unicode. Häufige Zeichen ersetzen,
// alles andere (z. B. Emojis in Notizen) durch „?" — sonst wird der ganze Text unleserlich.
const WINANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
const ERSATZ: Record<string, string> = { '→': '->', '←': '<-', '≤': '<=', '≥': '>=', '≈': '~' };

export function pdfText(s: string): string {
  let out = '';
  for (const ch of s) {
    if (ERSATZ[ch]) out += ERSATZ[ch];
    else if (ch.codePointAt(0)! <= 0xff || WINANSI_EXTRA.includes(ch)) out += ch;
    else if (/\p{Extended_Pictographic}|️|‍/u.test(ch)) continue;
    else out += '?';
  }
  return out;
}

function letzteY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function ueberschrift(doc: jsPDF, text: string, y: number, groesse = 12): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(groesse);
  doc.setTextColor(0);
  doc.text(pdfText(text), RAND_L, y);
  doc.setFont('helvetica', 'normal');
  return y + groesse * 0.45;
}

// Platz prüfen; sonst neue Seite. Gibt die y-Position zurück, an der weitergeschrieben wird.
function platz(doc: jsPDF, y: number, benoetigt: number): number {
  if (y + benoetigt <= SEITE_H - RAND_U) return y;
  doc.addPage();
  return RAND_O + 6;
}

function schritt(max: number): number {
  if (max <= 5) return 1;
  const roh = max / 5;
  const mag = 10 ** Math.floor(Math.log10(roh));
  const n = roh / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

interface Balken {
  label: string;
  wert: number;
  farbe?: string;
}

// Einfaches Säulendiagramm als Vektorgrafik.
function saeulen(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    b: number;
    h: number;
    daten: Balken[];
    farbe: string;
    referenz?: number;
    labelJede?: number;
  },
) {
  const { x, y, b, h, daten, farbe, referenz } = opts;
  const achseL = 9; // Platz für y-Beschriftung
  const achseU = 6; // Platz für x-Beschriftung
  const px = x + achseL;
  const pb = b - achseL;
  const ph = h - achseU;
  const max = Math.max(1, referenz ?? 0, ...daten.map((d) => d.wert));
  const st = schritt(max);
  const oben = Math.ceil(max / st) * st;
  const yWert = (v: number) => y + ph - (v / oben) * ph;

  doc.setFontSize(7);
  doc.setTextColor(...GRAU);
  doc.setLineWidth(0.1);
  for (let v = 0; v <= oben + 1e-9; v += st) {
    const yy = yWert(v);
    doc.setDrawColor(...LINIE);
    doc.line(px, yy, px + pb, yy);
    doc.text(String(Math.round(v * 100) / 100), px - 1.5, yy + 1, { align: 'right' });
  }

  const slot = pb / Math.max(1, daten.length);
  const breite = Math.min(slot * 0.7, 14);
  const jede = opts.labelJede ?? 1;
  daten.forEach((d, i) => {
    const bx = px + i * slot + (slot - breite) / 2;
    if (d.wert > 0) {
      doc.setFillColor(d.farbe ?? farbe);
      doc.rect(bx, yWert(d.wert), breite, y + ph - yWert(d.wert), 'F');
    }
    if (i % jede === 0) {
      doc.setTextColor(...GRAU);
      doc.text(pdfText(d.label), px + i * slot + slot / 2, y + ph + 4, { align: 'center' });
    }
  });

  if (referenz !== undefined) {
    doc.setDrawColor('#f59e0b');
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([1.5, 1], 0);
    doc.line(px, yWert(referenz), px + pb, yWert(referenz));
    doc.setLineDashPattern([], 0);
  }
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(px, y + ph, px + pb, y + ph);
  doc.setTextColor(0);
}

function diagramm(doc: jsPDF, y: number, titel: string, hinweis: string | undefined, zeichnen: (y: number) => void, h = 62): number {
  y = platz(doc, y, h + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(pdfText(titel), RAND_L, y);
  doc.setFont('helvetica', 'normal');
  if (hinweis) {
    doc.setFontSize(8);
    doc.setTextColor(...GRAU);
    doc.text(pdfText(hinweis), RAND_L, y + 4);
    doc.setTextColor(0);
  }
  zeichnen(y + (hinweis ? 8 : 5));
  return y + h + 16;
}

function leer(doc: jsPDF, y: number, text: string) {
  doc.setFontSize(9);
  doc.setTextColor(...GRAU);
  doc.text(pdfText(text), RAND_L, y + 6);
  doc.setTextColor(0);
}

export function erzeugeBerichtPdf(d: BerichtDaten): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const erstelltAm = formatDate(Date.now());
  const k = d.kennzahlen;
  const stuhl = [...d.stuhl].sort((a, b) => a.zeitpunkt - b.zeitpunkt);
  const tabellenBasis = {
    margin: { left: RAND_L, right: RAND_R, top: RAND_O + 6, bottom: RAND_U + 2 },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.6, textColor: 0, lineColor: LINIE },
    headStyles: { fillColor: [235, 235, 235] as [number, number, number], textColor: 0, fontStyle: 'bold' as const },
    // Freitext aus der Datenbank vor dem Zeichnen auf druckbare Zeichen reduzieren
    didParseCell: (c: CellHookData) => {
      c.cell.text = c.cell.text.map(pdfText);
    },
  };

  // ---- Seite 1: Zusammenfassung ----
  let y = ueberschrift(doc, 'Symptomtagebuch – Darmfunktion', RAND_O + 2, 16);
  doc.setFontSize(9);
  doc.setTextColor(...GRAU);
  doc.text(pdfText(`Selbstdokumentation, erstellt am ${erstelltAm}`), RAND_L, y + 1);
  doc.setTextColor(0);

  autoTable(doc, {
    ...tabellenBasis,
    startY: y + 5,
    theme: 'plain',
    body: berichtKopf(d.stammdaten, k, d.doku),
    columnStyles: { 0: { cellWidth: 55, textColor: GRAU }, 1: { fontStyle: 'bold' } },
  });

  y = ueberschrift(doc, 'Kennzahlen', letzteY(doc) + 9);
  autoTable(doc, {
    ...tabellenBasis,
    startY: y,
    theme: 'striped',
    body: berichtKennzahlen(k),
    alternateRowStyles: { fillColor: [246, 246, 246] },
    columnStyles: { 0: { cellWidth: 95 }, 1: { halign: 'right', fontStyle: 'bold' } },
  });

  const einschraenkungen = d.tage
    .filter((t) => t.toilettenangst || t.arbeitsunfaehig || (t.einschraenkung && t.einschraenkung.trim()))
    .sort((a, b) => a.datum.localeCompare(b.datum));
  if (einschraenkungen.length) {
    y = ueberschrift(doc, 'Dokumentierte Alltagseinschränkungen', platz(doc, letzteY(doc) + 9, 20));
    autoTable(doc, {
      ...tabellenBasis,
      startY: y,
      theme: 'grid',
      head: [['Datum', 'Einschränkung', 'AU']],
      body: einschraenkungen.map((t) => [
        formatDatum(t.datum),
        t.einschraenkung?.trim() || (t.toilettenangst ? 'Aktivität wegen Toilettensorge vermieden' : ''),
        t.arbeitsunfaehig ? 'ja' : '',
      ]),
      columnStyles: { 0: { cellWidth: 24 }, 2: { cellWidth: 12 } },
    });
  }

  // ---- Seite 2: Grafiken ----
  doc.addPage();
  y = ueberschrift(doc, 'Grafische Auswertung', RAND_O + 2, 13) + 4;

  const proTag = stuehleProTag(stuhl);
  y = diagramm(doc, y, 'Stühle pro Tag', 'Nur Tage mit Einträgen · gestrichelte Linie bei 3 Stühlen', (yy) => {
    if (!proTag.length) return leer(doc, yy, 'Noch keine Angaben erfasst.');
    saeulen(doc, {
      x: RAND_L,
      y: yy,
      b: INHALT_B,
      h: 55,
      farbe: '#0ea5e9',
      referenz: 3,
      daten: proTag.map((p) => ({ label: formatDatum(p.datum).slice(0, 5), wert: p.anzahl })),
      labelJede: Math.max(1, Math.ceil(proTag.length / 14)),
    });
  });

  y = diagramm(doc, y, 'Verteilung der Bristol-Stuhlformen', undefined, (yy) => {
    if (!stuhl.length) return leer(doc, yy, 'Noch keine Angaben erfasst.');
    saeulen(doc, {
      x: RAND_L,
      y: yy,
      b: INHALT_B,
      h: 55,
      farbe: '#0ea5e9',
      daten: bristolVerteilung(stuhl).map((b, i) => ({
        label: `Typ ${b.bristol}`,
        wert: b.anzahl,
        farbe: BRISTOL_FARBEN[i],
      })),
    });
  });

  const essen = essensbezugVerteilung(stuhl);
  const essenDaten = essen.werte
    .filter((w) => w.key !== 'unter_30min' || w.anzahl > 0)
    .map((w) => ({ label: essensbezugKurz[w.key], wert: w.anzahl }));
  diagramm(
    doc,
    y,
    'Zeit seit dem letzten Essen bis zum Stuhlgang',
    essen.ohneAngabe ? `${essen.ohneAngabe} Einträge ohne Angabe (vor Einführung des Feldes erfasst)` : undefined,
    (yy) => {
      if (!essenDaten.some((e) => e.wert > 0)) return leer(doc, yy, 'Noch keine Angaben erfasst.');
      saeulen(doc, { x: RAND_L, y: yy, b: INHALT_B, h: 55, farbe: '#8b5cf6', daten: essenDaten });
    },
  );

  // ---- Ab Seite 3: Rohdaten ----
  doc.addPage();
  y = ueberschrift(doc, 'Rohdaten Stuhlgänge (chronologisch)', RAND_O + 2, 13);
  autoTable(doc, {
    ...tabellenBasis,
    startY: y + 2,
    theme: 'grid',
    head: [ROHDATEN_SPALTEN],
    body: stuhl.length ? stuhl.map(rohdatenZeile) : [['Keine Einträge im Zeitraum.', '', '', '', '', '', '', '', '', '', '']],
    styles: { ...tabellenBasis.styles, fontSize: 7.5, cellPadding: 1.1, overflow: 'linebreak' },
    headStyles: { ...tabellenBasis.headStyles, fontSize: 7.5 },
    // Notiz bekommt den Restplatz und bricht um; alle anderen Spalten bleiben einzeilig.
    columnStyles: {
      0: { cellWidth: 17 },
      1: { cellWidth: 9 },
      2: { cellWidth: 11 },
      3: { cellWidth: 18 },
      4: { cellWidth: 18 },
      5: { cellWidth: 13 },
      6: { cellWidth: 14 },
      7: { cellWidth: 8 },
      8: { cellWidth: 15 },
      9: { cellWidth: 15 },
      10: { cellWidth: 'auto' },
    },
    rowPageBreak: 'avoid',
  });

  if (d.tage.length) {
    y = ueberschrift(doc, 'Rohdaten Tagesabschlüsse', platz(doc, letzteY(doc) + 10, 25), 13);
    autoTable(doc, {
      ...tabellenBasis,
      startY: y + 2,
      theme: 'grid',
      head: [TAGESDATEN_SPALTEN],
      body: [...d.tage].sort((a, b) => a.datum.localeCompare(b.datum)).map(tagesdatenZeile),
      styles: { ...tabellenBasis.styles, fontSize: 7.5, cellPadding: 1.1 },
      headStyles: { ...tabellenBasis.headStyles, fontSize: 7.5 },
      columnStyles: { 0: { cellWidth: 17 }, 1: { cellWidth: 15 }, 2: { cellWidth: 13 }, 3: { cellWidth: 14 }, 4: { cellWidth: 20 }, 5: { cellWidth: 8 } },
      rowPageBreak: 'avoid',
    });
  }

  // ---- Kopf- und Fußzeile auf jeder Seite ----
  const seiten = doc.getNumberOfPages();
  const kopf = [d.stammdaten?.name, d.doku ? `${formatDate(d.doku.vonMs)} – ${formatDate(d.doku.bisMs)}` : undefined]
    .filter(Boolean)
    .join(' · ');
  for (let i = 1; i <= seiten; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAU);
    doc.setDrawColor(...LINIE);
    doc.setLineWidth(0.2);
    if (i > 1) {
      doc.text(pdfText(`Symptomtagebuch – Darmfunktion${kopf ? ' · ' + kopf : ''}`), RAND_L, RAND_O - 6);
      doc.line(RAND_L, RAND_O - 4.5, SEITE_B - RAND_R, RAND_O - 4.5);
    }
    const fy = SEITE_H - RAND_U + 8;
    doc.line(RAND_L, fy - 4, SEITE_B - RAND_R, fy - 4);
    doc.text(pdfText(`${FUSSZEILE} · erstellt am ${erstelltAm}`), RAND_L, fy);
    doc.text(`Seite ${i} von ${seiten}`, SEITE_B - RAND_R, fy, { align: 'right' });
  }
  doc.setTextColor(0);

  doc.setProperties({ title: 'Symptomtagebuch – Darmfunktion', subject: 'Selbstdokumentation' });
  return doc;
}

export function berichtDateiname(): string {
  return `symptomtagebuch-bericht-${new Date().toISOString().slice(0, 10)}.pdf`;
}
