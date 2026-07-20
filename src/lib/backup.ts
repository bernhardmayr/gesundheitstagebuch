import { db } from '../db/db';
import type { StuhlEintrag, MahlzeitEintrag, TagesEintrag, Stammdaten } from '../db/types';
import { downloadText } from './csv';

export interface BackupFile {
  app: 'gesundheitstagebuch';
  version: 1;
  exportiert_am: string; // ISO
  stuhl: StuhlEintrag[];
  mahlzeit: MahlzeitEintrag[];
  tag: TagesEintrag[];
  stammdaten: Stammdaten[];
}

export async function exportBackup(): Promise<void> {
  const [stuhl, mahlzeit, tag, stammdaten] = await Promise.all([
    db.stuhl.toArray(),
    db.mahlzeit.toArray(),
    db.tag.toArray(),
    db.stammdaten.toArray(),
  ]);
  const backup: BackupFile = {
    app: 'gesundheitstagebuch',
    version: 1,
    exportiert_am: new Date().toISOString(),
    stuhl,
    mahlzeit,
    tag,
    stammdaten,
  };
  const stamp = new Date().toISOString().slice(0, 10);
  downloadText(`tagebuch-backup-${stamp}.json`, JSON.stringify(backup, null, 2), 'application/json');
}

export interface ImportResult {
  stuhl: number;
  mahlzeit: number;
  tag: number;
}

// Ersetzt (replace=true) oder ergänzt den Datenbestand.
export async function importBackup(json: string, replace: boolean): Promise<ImportResult> {
  const data = JSON.parse(json) as Partial<BackupFile>;
  if (data.app !== 'gesundheitstagebuch') {
    throw new Error('Keine gültige Backup-Datei dieser App.');
  }
  const stuhl = data.stuhl ?? [];
  const mahlzeit = data.mahlzeit ?? [];
  const tag = data.tag ?? [];
  const stammdaten = data.stammdaten ?? [];

  await db.transaction('rw', db.stuhl, db.mahlzeit, db.tag, db.stammdaten, async () => {
    if (replace) {
      await Promise.all([db.stuhl.clear(), db.mahlzeit.clear(), db.tag.clear(), db.stammdaten.clear()]);
    }
    await db.stuhl.bulkPut(stuhl);
    await db.mahlzeit.bulkPut(mahlzeit);
    await db.tag.bulkPut(tag);
    await db.stammdaten.bulkPut(stammdaten);
  });

  return { stuhl: stuhl.length, mahlzeit: mahlzeit.length, tag: tag.length };
}
