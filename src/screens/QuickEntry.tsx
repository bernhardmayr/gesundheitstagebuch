import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import {
  addStuhl,
  addMahlzeit,
  putTag,
  getTag,
  toDatum,
} from '../db/repo';
import type { StuhlEintrag, TagesEintrag } from '../db/types';
import { StuhlForm } from '../components/StuhlForm';
import { MahlzeitForm } from '../components/MahlzeitForm';
import { TagForm } from '../components/TagForm';
import { Sheet } from '../components/Sheet';
import { BigButton } from '../components/ui';
import { formatTime, bristolTyp, inkontinenzKurz, formatWeekday } from '../lib/format';

type Modal = null | 'stuhl' | 'mahlzeit' | 'tag';

export function QuickEntry() {
  const [modal, setModal] = useState<Modal>(null);
  const heute = toDatum(Date.now());

  const heuteStuhl = useLiveQuery(async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return db.stuhl.where('zeitpunkt').between(start.getTime(), end.getTime(), true, true).sortBy('zeitpunkt');
  }, []);

  const tagEintrag = useLiveQuery(() => getTag(heute), [heute]);

  async function saveStuhl(data: Omit<StuhlEintrag, 'id' | 'minuten_nach_mahlzeit'>) {
    await addStuhl(data);
    setModal(null);
  }

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <h1 className="text-xl font-semibold">Erfassen</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{formatWeekday(Date.now())}</p>
      </header>

      <BigButton onClick={() => setModal('stuhl')} className="w-full py-6 text-lg">
        Stuhlgang eintragen
      </BigButton>

      <div className="grid grid-cols-2 gap-3">
        <BigButton variant="secondary" onClick={() => setModal('mahlzeit')}>
          Mahlzeit
        </BigButton>
        <BigButton variant="secondary" onClick={() => setModal('tag')}>
          Tagesabschluss
        </BigButton>
      </div>

      <HeuteZusammenfassung stuhl={heuteStuhl} tag={tagEintrag} />

      <Sheet open={modal === 'stuhl'} title="Stuhlgang" onClose={() => setModal(null)}>
        <StuhlForm onSubmit={saveStuhl} onCancel={() => setModal(null)} />
      </Sheet>

      <Sheet open={modal === 'mahlzeit'} title="Mahlzeit" onClose={() => setModal(null)}>
        <MahlzeitForm
          onSubmit={async (d) => {
            await addMahlzeit(d);
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      </Sheet>

      <Sheet open={modal === 'tag'} title="Tagesabschluss" onClose={() => setModal(null)}>
        <TagForm
          datum={heute}
          allowDatum={false}
          initial={tagEintrag ?? undefined}
          onSubmit={async (d) => {
            await putTag(d);
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      </Sheet>
    </div>
  );
}

function HeuteZusammenfassung({
  stuhl,
  tag,
}: {
  stuhl: StuhlEintrag[] | undefined;
  tag: TagesEintrag | undefined;
}) {
  if (!stuhl) return null;

  const ohneVorwarnung = stuhl.filter(
    (e) => e.vorwarnzeit === 'sofort' || e.vorwarnzeit === 'unter_5min',
  ).length;
  const unfaelle = stuhl.filter(
    (e) => e.inkontinenz === 'teilverlust' || e.inkontinenz === 'vollverlust',
  ).length;

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Heute
      </h2>
      {stuhl.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">Noch kein Eintrag.</p>
      ) : (
        <>
          <p className="text-slate-800 dark:text-slate-100">
            {stuhl.length} {stuhl.length === 1 ? 'Stuhlgang' : 'Stühle'}
            {ohneVorwarnung > 0 && `, ${ohneVorwarnung}× kurze Vorwarnzeit`}
            {unfaelle > 0 && `, ${unfaelle}× unwillkürlich`}
          </p>
          <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {stuhl.map((e) => (
              <li key={e.id} className="flex items-center gap-2">
                <span className="tabular-nums text-slate-500">{formatTime(e.zeitpunkt)}</span>
                <span>· {bristolTyp[e.bristol]}</span>
                {e.inkontinenz !== 'keine' && (
                  <span className="text-amber-600 dark:text-amber-400">· {inkontinenzKurz[e.inkontinenz]}</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {tag && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Tagesabschluss erfasst.</p>
      )}
    </section>
  );
}
