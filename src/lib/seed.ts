import { db } from '../db/db';
import { addMahlzeit, addStuhl, putTag, toDatum } from '../db/repo';
import type { Bristol, Essensbezug, Inkontinenz, Vorwarnzeit } from '../db/types';

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rnd = (min: number, max: number) => min + Math.random() * (max - min);

// Erzeugt ~30 Tage plausible Beispieldaten zur Prüfung von Auswertung und Bericht.
export async function seedDemo(tage = 30): Promise<void> {
  const vorwarn: Vorwarnzeit[] = ['sofort', 'unter_5min', 'unter_15min', 'ueber_15min'];
  const essen: Essensbezug[] = ['nuechtern', 'unter_30min', 'unter_30min', '30_60min', '1_2h', 'ueber_2h', 'unbekannt'];
  const inkont: Inkontinenz[] = ['keine', 'keine', 'keine', 'stuhlschmieren', 'teilverlust', 'vollverlust'];

  for (let d = tage - 1; d >= 0; d--) {
    const tag = new Date();
    tag.setHours(0, 0, 0, 0);
    tag.setDate(tag.getDate() - d);

    // Mahlzeiten
    for (const [h, art] of [
      [8, 'fruehstueck'],
      [13, 'mittag'],
      [19, 'abend'],
    ] as const) {
      const t = new Date(tag);
      t.setHours(h, Math.floor(rnd(0, 59)));
      await addMahlzeit({ zeitpunkt: t.getTime(), art });
    }

    // 2–6 Stühle
    const n = Math.round(rnd(2, 6));
    for (let i = 0; i < n; i++) {
      const t = new Date(tag);
      t.setHours(Math.floor(rnd(6, 24)), Math.floor(rnd(0, 59)));
      const bristol = pick([4, 5, 6, 6, 7, 3]) as Bristol;
      await addStuhl({
        zeitpunkt: t.getTime(),
        bristol,
        vorwarnzeit: pick(vorwarn),
        inkontinenz: pick(inkont),
        vorlage_gewechselt: Math.random() < 0.2,
        schmerzen: pick([0, 0, 1, 2, 3]) as 0 | 1 | 2 | 3,
        blut: Math.random() < 0.1,
        ort: pick(['zuhause', 'unterwegs', 'arbeit']),
        essensbezug: pick(essen),
      });
    }

    await putTag({
      datum: toDatum(tag),
      gewicht_kg: Math.round(rnd(66, 70) * 10) / 10,
      appetit: pick([2, 3, 3, 4]) as 1 | 2 | 3 | 4 | 5,
      allgemeinbefinden: pick([2, 3, 3, 4]) as 1 | 2 | 3 | 4 | 5,
      toilettenangst: Math.random() < 0.25,
      einschraenkung: Math.random() < 0.15 ? 'Termin wegen Beschwerden abgesagt' : undefined,
      arbeitsunfaehig: Math.random() < 0.1,
    });
  }
}

export async function clearAll(): Promise<void> {
  await Promise.all([db.stuhl.clear(), db.mahlzeit.clear(), db.tag.clear()]);
}
