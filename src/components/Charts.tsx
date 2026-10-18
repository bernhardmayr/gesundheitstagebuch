import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from 'recharts';
import type { StuhlEintrag, TagesEintrag } from '../db/types';
import {
  stuehleProTag,
  bristolVerteilung,
  essensbezugVerteilung,
  ortVerteilung,
} from '../lib/derive';
import { formatDatum, essensbezugKurz, ortLabel } from '../lib/format';
import { EmptyState } from './ui';

// Für die Druckansicht können feste Maße übergeben werden (ResponsiveContainer misst beim
// Drucken teils 0). Ansonsten füllt der Chart die Breite des Containers.
function ChartFrame({
  children,
  height,
  width,
}: {
  children: React.ReactElement;
  height: number;
  width?: number;
}) {
  if (width) {
    return (
      <div style={{ width, height }}>
        {/* eslint-disable-next-line */}
        {/** recharts akzeptiert width/height direkt */}
        {children}
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  );
}

const AXIS = { fontSize: 11, fill: 'currentColor' };

export function StuehleProTagChart({
  eintraege,
  height = 220,
  width,
}: {
  eintraege: StuhlEintrag[];
  height?: number;
  width?: number;
}) {
  const data = stuehleProTag(eintraege).map((d) => ({
    ...d,
    label: formatDatum(d.datum).slice(0, 5),
  }));
  if (data.length === 0) return <EmptyState>Noch keine Stuhlgänge erfasst.</EmptyState>;
  return (
    <ChartFrame height={height} width={width}>
      <BarChart data={data} width={width} height={height} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#88888833" />
        <XAxis dataKey="label" tick={AXIS} interval="preserveStartEnd" />
        <YAxis allowDecimals={false} tick={AXIS} />
        <Tooltip />
        <ReferenceLine y={3} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '3', position: 'right', fontSize: 11 }} />
        <Bar dataKey="anzahl" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartFrame>
  );
}

const BRISTOL_COLORS = ['#92400e', '#b45309', '#d97706', '#16a34a', '#65a30d', '#eab308', '#dc2626'];

export function BristolChart({
  eintraege,
  height = 200,
  width,
}: {
  eintraege: StuhlEintrag[];
  height?: number;
  width?: number;
}) {
  const data = bristolVerteilung(eintraege).map((d) => ({ name: `Typ ${d.bristol}`, ...d }));
  if (eintraege.length === 0) return <EmptyState>Noch keine Stuhlgänge erfasst.</EmptyState>;
  return (
    <ChartFrame height={height} width={width}>
      <BarChart data={data} width={width} height={height} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#88888833" />
        <XAxis dataKey="name" tick={AXIS} />
        <YAxis allowDecimals={false} tick={AXIS} />
        <Tooltip />
        <Bar dataKey="anzahl" radius={[3, 3, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={BRISTOL_COLORS[i]} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

const BUCKETS: { label: string; min: number; max: number }[] = [
  { label: '0–30', min: 0, max: 30 },
  { label: '30–60', min: 30, max: 60 },
  { label: '60–90', min: 60, max: 90 },
  { label: '90–120', min: 90, max: 120 },
  { label: '120–180', min: 120, max: 180 },
  { label: '>180', min: 180, max: Infinity },
];

export function MahlzeitHistogramm({
  eintraege,
  height = 200,
  width,
}: {
  eintraege: StuhlEintrag[];
  height?: number;
  width?: number;
}) {
  const werte = eintraege
    .map((e) => e.minuten_nach_mahlzeit)
    .filter((v): v is number => typeof v === 'number');
  const data = BUCKETS.map((b) => ({
    label: b.label,
    anzahl: werte.filter((v) => v >= b.min && v < b.max).length,
  }));
  if (werte.length === 0) {
    return <EmptyState>Noch keine Angaben erfasst – nur befüllt, wenn Mahlzeiten separat eingetragen werden.</EmptyState>;
  }
  return (
    <ChartFrame height={height} width={width}>
      <BarChart data={data} width={width} height={height} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#88888833" />
        <XAxis dataKey="label" tick={AXIS} />
        <YAxis allowDecimals={false} tick={AXIS} />
        <Tooltip />
        <Bar dataKey="anzahl" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartFrame>
  );
}

// Kategorien-Balken für Verteilungen (Essensbezug, Ort). Einträge ohne Angabe werden als
// Hinweis unter dem Diagramm ausgewiesen, nicht als eigene Kategorie umgedeutet.
function VerteilungChart({
  data,
  ohneAngabe,
  fill,
  height,
  width,
}: {
  data: { label: string; anzahl: number }[];
  ohneAngabe: number;
  fill: string;
  height: number;
  width?: number;
}) {
  const gesamt = data.reduce((a, d) => a + d.anzahl, 0);
  if (gesamt === 0) return <EmptyState />;
  // Liegende Balken: Kategorien-Beschriftungen bleiben auch schmal lesbar.
  const h = Math.max(height, data.length * 28 + 24);
  return (
    <div>
      <ChartFrame height={h} width={width}>
        <BarChart
          data={data}
          layout="vertical"
          width={width}
          height={h}
          margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#88888833" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={AXIS} />
          <YAxis type="category" dataKey="label" tick={AXIS} width={84} interval={0} />
          <Tooltip />
          <Bar dataKey="anzahl" fill={fill} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ChartFrame>
      {ohneAngabe > 0 && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {ohneAngabe} Einträge ohne Angabe (vor Einführung des Feldes erfasst)
        </p>
      )}
    </div>
  );
}

export function EssensbezugChart({
  eintraege,
  height = 120,
  width,
}: {
  eintraege: StuhlEintrag[];
  height?: number;
  width?: number;
}) {
  const v = essensbezugVerteilung(eintraege);
  const data = v.werte
    .filter((w) => w.key !== 'unter_30min' || w.anzahl > 0)
    .map((w) => ({ label: essensbezugKurz[w.key], anzahl: w.anzahl }));
  return <VerteilungChart data={data} ohneAngabe={v.ohneAngabe} fill="#8b5cf6" height={height} width={width} />;
}

export function OrtChart({
  eintraege,
  height = 110,
  width,
}: {
  eintraege: StuhlEintrag[];
  height?: number;
  width?: number;
}) {
  const v = ortVerteilung(eintraege);
  const data = v.werte.map((w) => ({ label: ortLabel[w.key], anzahl: w.anzahl }));
  return <VerteilungChart data={data} ohneAngabe={v.ohneAngabe} fill="#14b8a6" height={height} width={width} />;
}

export function GewichtChart({
  tage,
  height = 200,
  width,
}: {
  tage: TagesEintrag[];
  height?: number;
  width?: number;
}) {
  const data = tage
    .filter((t) => typeof t.gewicht_kg === 'number')
    .sort((a, b) => a.datum.localeCompare(b.datum))
    .map((t) => ({ label: formatDatum(t.datum).slice(0, 5), gewicht: t.gewicht_kg }));
  if (data.length === 0) {
    return <EmptyState>Noch keine Gewichtsangaben erfasst (Tagesabschluss).</EmptyState>;
  }
  return (
    <ChartFrame height={height} width={width}>
      <LineChart data={data} width={width} height={height} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#88888833" />
        <XAxis dataKey="label" tick={AXIS} />
        <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={AXIS} />
        <Tooltip />
        <Line type="monotone" dataKey="gewicht" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ChartFrame>
  );
}
