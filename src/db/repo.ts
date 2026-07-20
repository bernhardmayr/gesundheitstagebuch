import { db } from './db';
import type {
  StuhlEintrag,
  MahlzeitEintrag,
  TagesEintrag,
  Stammdaten,
} from './types';

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// YYYY-MM-DD in lokaler Zeit
export function toDatum(d: Date | number): string {
  const date = typeof d === 'number' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---- Stuhl ----

// Berechnet Minuten seit der letzten Mahlzeit vor `zeitpunkt` (max. 12 h Fenster).
export async function minutenNachMahlzeit(zeitpunkt: number): Promise<number | undefined> {
  const letzte = await db.mahlzeit
    .where('zeitpunkt')
    .belowOrEqual(zeitpunkt)
    .last();
  if (!letzte) return undefined;
  const diffMin = Math.round((zeitpunkt - letzte.zeitpunkt) / 60000);
  if (diffMin < 0 || diffMin > 12 * 60) return undefined;
  return diffMin;
}

export async function addStuhl(
  data: Omit<StuhlEintrag, 'id' | 'minuten_nach_mahlzeit'>,
): Promise<StuhlEintrag> {
  const eintrag: StuhlEintrag = {
    ...data,
    id: uid(),
    minuten_nach_mahlzeit: await minutenNachMahlzeit(data.zeitpunkt),
  };
  await db.stuhl.add(eintrag);
  return eintrag;
}

export async function updateStuhl(
  id: string,
  data: Omit<StuhlEintrag, 'id' | 'minuten_nach_mahlzeit'>,
): Promise<void> {
  await db.stuhl.put({
    ...data,
    id,
    minuten_nach_mahlzeit: await minutenNachMahlzeit(data.zeitpunkt),
  });
}

export const deleteStuhl = (id: string) => db.stuhl.delete(id);

// ---- Mahlzeit ----

export async function addMahlzeit(
  data: Omit<MahlzeitEintrag, 'id'>,
): Promise<MahlzeitEintrag> {
  const eintrag: MahlzeitEintrag = { ...data, id: uid() };
  await db.mahlzeit.add(eintrag);
  return eintrag;
}

export const updateMahlzeit = (m: MahlzeitEintrag) => db.mahlzeit.put(m);
export const deleteMahlzeit = (id: string) => db.mahlzeit.delete(id);

// ---- Tag ----

export const putTag = (t: TagesEintrag) => db.tag.put(t);
export const getTag = (datum: string) => db.tag.get(datum);
export const deleteTag = (datum: string) => db.tag.delete(datum);

// ---- Stammdaten (Singleton) ----

export const getStammdaten = () => db.stammdaten.get('self');
export const putStammdaten = (s: Omit<Stammdaten, 'id'>) =>
  db.stammdaten.put({ ...s, id: 'self' });

// ---- Zeitraum-Abfragen ----

export async function stuhlImZeitraum(vonMs: number, bisMs: number): Promise<StuhlEintrag[]> {
  return db.stuhl.where('zeitpunkt').between(vonMs, bisMs, true, true).sortBy('zeitpunkt');
}

export async function mahlzeitImZeitraum(vonMs: number, bisMs: number): Promise<MahlzeitEintrag[]> {
  return db.mahlzeit.where('zeitpunkt').between(vonMs, bisMs, true, true).sortBy('zeitpunkt');
}

export async function tageImZeitraum(vonDatum: string, bisDatum: string): Promise<TagesEintrag[]> {
  return db.tag.where('datum').between(vonDatum, bisDatum, true, true).sortBy('datum');
}
