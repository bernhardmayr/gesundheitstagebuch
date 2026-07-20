import Dexie, { type Table } from 'dexie';
import type { StuhlEintrag, MahlzeitEintrag, TagesEintrag, Stammdaten } from './types';

export class TagebuchDB extends Dexie {
  stuhl!: Table<StuhlEintrag, string>;
  mahlzeit!: Table<MahlzeitEintrag, string>;
  tag!: Table<TagesEintrag, string>;
  stammdaten!: Table<Stammdaten, string>;

  constructor() {
    super('gesundheitstagebuch');
    this.version(1).stores({
      stuhl: 'id, zeitpunkt',
      mahlzeit: 'id, zeitpunkt',
      tag: 'datum',
      stammdaten: 'id',
    });
  }
}

export const db = new TagebuchDB();
