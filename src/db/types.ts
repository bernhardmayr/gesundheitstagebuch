// Datenmodell — bildet exakt die GdB-Bewertungskriterien ab (VersMedG Teil B 10.2.2 / 10.2.4).
// Zeitpunkte werden als epoch-ms (number) gespeichert -> sauber in Dexie indizierbar.

export type Bristol = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Vorwarnzeit = 'sofort' | 'unter_5min' | 'unter_15min' | 'ueber_15min';

export type Inkontinenz = 'keine' | 'stuhlschmieren' | 'teilverlust' | 'vollverlust';

export type Schmerz = 0 | 1 | 2 | 3;

export type Ort = 'zuhause' | 'unterwegs' | 'arbeit';

// Zeit seit dem letzten Essen — direkt im Stuhlformular erfragt (v1.1).
export type Essensbezug =
  | 'nuechtern' // > 3 h nichts gegessen
  | 'unter_30min'
  | '30_60min'
  | '1_2h'
  | 'ueber_2h'
  | 'unbekannt';

export interface StuhlEintrag {
  id: string;
  zeitpunkt: number; // epoch ms
  bristol: Bristol;
  vorwarnzeit: Vorwarnzeit;
  inkontinenz: Inkontinenz;
  vorlage_gewechselt: boolean;
  schmerzen: Schmerz;
  blut: boolean;
  // Primär: direkt im Formular erfasst. Alt-Einträge (vor v1.1) haben hier undefined.
  essensbezug?: Essensbezug;
  minuten_nach_mahlzeit?: number; // Fallback, nur falls eine Mahlzeit separat geloggt wurde
  ort: Ort;
  notiz?: string;
}

export type MahlzeitArt = 'fruehstueck' | 'mittag' | 'abend' | 'snack';

export interface MahlzeitEintrag {
  id: string;
  zeitpunkt: number; // epoch ms
  art: MahlzeitArt;
  beschreibung?: string;
  verdaechtige_zutaten?: string[];
}

export type Skala5 = 1 | 2 | 3 | 4 | 5;

export interface TagesEintrag {
  datum: string; // YYYY-MM-DD (Primärschlüssel)
  gewicht_kg?: number;
  appetit: Skala5;
  allgemeinbefinden: Skala5;
  toilettenangst: boolean;
  einschraenkung?: string;
  arbeitsunfaehig: boolean;
  medikamente?: string[];
}

export interface Stammdaten {
  id: 'self'; // Singleton
  name?: string;
  geburtsdatum?: string; // YYYY-MM-DD
  aktenzeichen?: string;
}
