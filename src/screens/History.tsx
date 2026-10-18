import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import {
  updateStuhl,
  deleteStuhl,
  addStuhl,
  updateMahlzeit,
  deleteMahlzeit,
  addMahlzeit,
  putTag,
  deleteTag,
  toDatum,
} from '../db/repo';
import type { MahlzeitEintrag, StuhlEintrag, TagesEintrag } from '../db/types';
import { StuhlForm } from '../components/StuhlForm';
import { MahlzeitForm } from '../components/MahlzeitForm';
import { TagForm } from '../components/TagForm';
import { Sheet } from '../components/Sheet';
import { BigButton } from '../components/ui';
import {
  formatTime,
  formatDatum,
  bristolTyp,
  vorwarnzeitKurz,
  inkontinenzKurz,
  mahlzeitLabel,
  ortLabel,
  essensbezugKurz,
} from '../lib/format';

interface Tag {
  datum: string;
  stuhl: StuhlEintrag[];
  mahlzeit: MahlzeitEintrag[];
  tag?: TagesEintrag;
}

type Editing =
  | { kind: 'stuhl'; data?: StuhlEintrag }
  | { kind: 'mahlzeit'; data?: MahlzeitEintrag }
  | { kind: 'tag'; datum: string; data?: TagesEintrag }
  | null;

export function History() {
  const [editing, setEditing] = useState<Editing>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [nachtragDatum, setNachtragDatum] = useState<string>(toDatum(Date.now()));

  const stuhl = useLiveQuery(() => db.stuhl.orderBy('zeitpunkt').reverse().toArray(), []);
  const mahlzeit = useLiveQuery(() => db.mahlzeit.orderBy('zeitpunkt').reverse().toArray(), []);
  const tage = useLiveQuery(() => db.tag.toArray(), []);

  const tageList = useMemo<Tag[]>(() => {
    if (!stuhl || !mahlzeit || !tage) return [];
    const map = new Map<string, Tag>();
    const ensure = (datum: string) => {
      let t = map.get(datum);
      if (!t) {
        t = { datum, stuhl: [], mahlzeit: [] };
        map.set(datum, t);
      }
      return t;
    };
    for (const e of stuhl) ensure(toDatum(e.zeitpunkt)).stuhl.push(e);
    for (const m of mahlzeit) ensure(toDatum(m.zeitpunkt)).mahlzeit.push(m);
    for (const t of tage) ensure(t.datum).tag = t;
    return [...map.values()].sort((a, b) => b.datum.localeCompare(a.datum));
  }, [stuhl, mahlzeit, tage]);

  if (!stuhl || !mahlzeit || !tage) return <p className="text-slate-500">Lädt …</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Verlauf</h1>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Nachtragen für ein Datum</p>
        <div className="flex gap-2">
          <input
            type="date"
            value={nachtragDatum}
            max={toDatum(Date.now())}
            onChange={(e) => setNachtragDatum(e.target.value)}
            className="min-h-touch flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3"
          />
          <BigButton
            variant="secondary"
            onClick={() => {
              // Standardzeit 12:00 des gewählten Tages
              const ms = new Date(`${nachtragDatum}T12:00`).getTime();
              setEditing({ kind: 'stuhl', data: { zeitpunkt: ms } as StuhlEintrag });
            }}
          >
            + Stuhl
          </BigButton>
          <BigButton
            variant="secondary"
            onClick={() => setEditing({ kind: 'tag', datum: nachtragDatum })}
          >
            + Tag
          </BigButton>
        </div>
      </div>

      {tageList.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400">Noch keine Einträge.</p>
      )}

      {tageList.map((t) => {
        const open = expanded[t.datum] ?? false;
        return (
          <section key={t.datum} className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setExpanded((s) => ({ ...s, [t.datum]: !open }))}
              aria-expanded={open}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="font-medium">{formatDatum(t.datum)}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {t.stuhl.length} Stühle{t.mahlzeit.length ? ` · ${t.mahlzeit.length} Mahlz.` : ''}
                {t.tag ? ' · Tag ✓' : ''} {open ? '▴' : '▾'}
              </span>
            </button>

            {open && (
              <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 space-y-2">
                {t.stuhl
                  .slice()
                  .sort((a, b) => a.zeitpunkt - b.zeitpunkt)
                  .map((e) => (
                    <Row key={e.id} onEdit={() => setEditing({ kind: 'stuhl', data: e })} onDelete={() => deleteStuhl(e.id)}>
                      <span className="tabular-nums text-slate-500">{formatTime(e.zeitpunkt)}</span>{' '}
                      {bristolTyp[e.bristol]} · {vorwarnzeitKurz[e.vorwarnzeit]} · {ortLabel[e.ort]}
                      {e.essensbezug && ` · Essen ${essensbezugKurz[e.essensbezug]}`}
                      {e.inkontinenz !== 'keine' && (
                        <span className="text-amber-600 dark:text-amber-400"> · {inkontinenzKurz[e.inkontinenz]}</span>
                      )}
                      {e.blut && <span className="text-red-500"> · Blut</span>}
                    </Row>
                  ))}

                {t.mahlzeit
                  .slice()
                  .sort((a, b) => a.zeitpunkt - b.zeitpunkt)
                  .map((m) => (
                    <Row
                      key={m.id}
                      onEdit={() => setEditing({ kind: 'mahlzeit', data: m })}
                      onDelete={() => deleteMahlzeit(m.id)}
                    >
                      <span className="tabular-nums text-slate-500">{formatTime(m.zeitpunkt)}</span>{' '}
                      <span className="text-slate-400">Mahlzeit:</span> {mahlzeitLabel[m.art]}
                      {m.beschreibung ? ` · ${m.beschreibung}` : ''}
                    </Row>
                  ))}

                <Row
                  onEdit={() => setEditing({ kind: 'tag', datum: t.datum, data: t.tag })}
                  onDelete={t.tag ? () => deleteTag(t.datum) : undefined}
                >
                  {t.tag ? (
                    <span>
                      Tagesabschluss · Appetit {t.tag.appetit}/5 · Befinden {t.tag.allgemeinbefinden}/5
                      {t.tag.gewicht_kg ? ` · ${t.tag.gewicht_kg} kg` : ''}
                      {t.tag.arbeitsunfaehig ? ' · AU' : ''}
                    </span>
                  ) : (
                    <span className="text-slate-400">Kein Tagesabschluss – tippen zum Ergänzen</span>
                  )}
                </Row>
              </div>
            )}
          </section>
        );
      })}

      {/* Editier-Sheets */}
      <Sheet open={editing?.kind === 'stuhl'} title="Stuhlgang" onClose={() => setEditing(null)}>
        {editing?.kind === 'stuhl' && (
          <StuhlForm
            initial={editing.data}
            submitLabel={editing.data?.id ? 'Aktualisieren' : 'Speichern'}
            onCancel={() => setEditing(null)}
            onSubmit={async (d) => {
              if (editing.data?.id) await updateStuhl(editing.data.id, d);
              else await addStuhl(d);
              setEditing(null);
            }}
          />
        )}
      </Sheet>

      <Sheet open={editing?.kind === 'mahlzeit'} title="Mahlzeit" onClose={() => setEditing(null)}>
        {editing?.kind === 'mahlzeit' && (
          <MahlzeitForm
            initial={editing.data}
            submitLabel={editing.data?.id ? 'Aktualisieren' : 'Speichern'}
            onCancel={() => setEditing(null)}
            onSubmit={async (d) => {
              if (editing.data?.id) await updateMahlzeit({ ...d, id: editing.data.id });
              else await addMahlzeit(d);
              setEditing(null);
            }}
          />
        )}
      </Sheet>

      <Sheet open={editing?.kind === 'tag'} title="Tagesabschluss" onClose={() => setEditing(null)}>
        {editing?.kind === 'tag' && (
          <TagForm
            datum={editing.datum}
            initial={editing.data}
            allowDatum={false}
            submitLabel={editing.data ? 'Aktualisieren' : 'Speichern'}
            onCancel={() => setEditing(null)}
            onSubmit={async (d) => {
              await putTag(d);
              setEditing(null);
            }}
          />
        )}
      </Sheet>
    </div>
  );
}

function Row({
  children,
  onEdit,
  onDelete,
}: {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <button type="button" onClick={onEdit} className="flex-1 min-h-touch text-left text-slate-700 dark:text-slate-200">
        {children}
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={() => {
            if (confirm('Diesen Eintrag löschen?')) onDelete();
          }}
          aria-label="Löschen"
          className="min-h-touch min-w-touch flex items-center justify-center text-slate-400 hover:text-red-500"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </button>
      )}
    </div>
  );
}
