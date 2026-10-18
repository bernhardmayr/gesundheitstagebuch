import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { toDatum } from '../db/repo';
import type { StuhlEintrag, MahlzeitEintrag, TagesEintrag } from '../db/types';

export interface ZeitraumData {
  vonMs: number;
  bisMs: number;
  tageCount: number;
  stuhl: StuhlEintrag[];
  mahlzeit: MahlzeitEintrag[];
  tage: TagesEintrag[];
  loading: boolean;
}

// tage = Anzahl Kalendertage rückwärts ab heute; 0 => alles
export function useZeitraum(tage: number): ZeitraumData {
  const now = Date.now();
  const bis = new Date(now);
  bis.setHours(23, 59, 59, 999);
  const bisMs = bis.getTime();

  let vonMs: number;
  if (tage <= 0) {
    vonMs = 0;
  } else {
    const von = new Date(now);
    von.setHours(0, 0, 0, 0);
    von.setDate(von.getDate() - (tage - 1));
    vonMs = von.getTime();
  }

  const data = useLiveQuery(async () => {
    const [stuhl, mahlzeit, tageArr] = await Promise.all([
      db.stuhl.where('zeitpunkt').between(vonMs, bisMs, true, true).sortBy('zeitpunkt'),
      db.mahlzeit.where('zeitpunkt').between(vonMs, bisMs, true, true).sortBy('zeitpunkt'),
      db.tag
        .where('datum')
        // „Alles" (vonMs = 0): kleinstes mögliches Datum, sonst würden nur heutige Tage geladen
        .between(vonMs === 0 ? '0000-01-01' : toDatum(vonMs), toDatum(bisMs), true, true)
        .sortBy('datum'),
    ]);
    // Bei "alles" den tatsächlichen Startzeitpunkt aus den Daten ableiten
    return { stuhl, mahlzeit, tage: tageArr };
  }, [vonMs, bisMs]);

  const effVon = tage <= 0 && data?.stuhl.length ? data.stuhl[0].zeitpunkt : vonMs;
  const spanTage =
    tage > 0 ? tage : Math.max(1, Math.ceil((bisMs - effVon) / (24 * 3600 * 1000)));

  return {
    vonMs: effVon,
    bisMs,
    tageCount: spanTage,
    stuhl: data?.stuhl ?? [],
    mahlzeit: data?.mahlzeit ?? [],
    tage: data?.tage ?? [],
    loading: data === undefined,
  };
}
