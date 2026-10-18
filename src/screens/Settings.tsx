import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getStammdaten, putStammdaten } from '../db/repo';
import { exportBackup, importBackup } from '../lib/backup';
import { isPinSet, setPin, clearPin } from '../lib/lock';
import { seedDemo, clearAll } from '../lib/seed';
import { BigButton, Field, inputClass } from '../components/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function Settings() {
  const stammdaten = useLiveQuery(getStammdaten, []);
  const [name, setName] = useState<string | null>(null);
  const [geb, setGeb] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [pinSet, setPinSet] = useState(isPinSet());
  const [newPin, setNewPin] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // kontrollierte Werte: lokaler State überschreibt geladenen Wert erst nach Bearbeitung
  const nameVal = name ?? stammdaten?.name ?? '';
  const gebVal = geb ?? stammdaten?.geburtsdatum ?? '';

  async function saveStammdaten() {
    await putStammdaten({
      name: nameVal.trim() || undefined,
      geburtsdatum: gebVal || undefined,
    });
    flash('Stammdaten gespeichert.');
  }

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  async function onImport(file: File, replace: boolean) {
    try {
      const text = await file.text();
      const r = await importBackup(text, replace);
      flash(`Importiert: ${r.stuhl} Stühle, ${r.mahlzeit} Mahlzeiten, ${r.tag} Tage.`);
    } catch (e) {
      flash(`Import fehlgeschlagen: ${(e as Error).message}`);
    }
  }

  async function savePin() {
    if (newPin.length < 4) {
      flash('PIN muss mindestens 4 Ziffern haben.');
      return;
    }
    await setPin(newPin);
    setPinSet(true);
    setNewPin('');
    flash('PIN gesetzt. Beim nächsten Start wird sie abgefragt.');
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mehr</h1>
      {msg && (
        <div className="rounded-xl bg-sky-100 dark:bg-sky-900/40 px-4 py-2 text-sm text-sky-800 dark:text-sky-200">
          {msg}
        </div>
      )}

      <Section title="Stammdaten (nur für den Briefkopf im Bericht)">
        <Field label="Name">
          <input className={inputClass} value={nameVal} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Geburtsdatum">
          <input type="date" className={inputClass} value={gebVal} onChange={(e) => setGeb(e.target.value)} />
        </Field>
        <BigButton onClick={saveStammdaten} className="w-full">
          Stammdaten speichern
        </BigButton>
      </Section>

      <Section title="Datensicherung">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Alle Daten liegen ausschließlich auf diesem Gerät. Erstellen Sie regelmäßig ein Backup.
        </p>
        <BigButton onClick={() => exportBackup()} className="w-full">
          Backup exportieren (JSON)
        </BigButton>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              const replace = confirm(
                'Vorhandene Daten VOR dem Import löschen?\n\nOK = ersetzen · Abbrechen = zusammenführen',
              );
              onImport(f, replace);
            }
            e.target.value = '';
          }}
        />
        <BigButton variant="secondary" onClick={() => fileRef.current?.click()} className="w-full">
          Backup importieren (JSON)
        </BigButton>
      </Section>

      <Section title="App-Sperre">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Optionaler PIN-Schutz beim Öffnen. Die PIN wird nur als Prüfsumme gespeichert. Sie schützt
          vor beiläufigem Fremdzugriff, verschlüsselt aber nicht die gespeicherten Daten.
        </p>
        {pinSet ? (
          <BigButton
            variant="secondary"
            onClick={() => {
              clearPin();
              setPinSet(false);
              flash('PIN entfernt.');
            }}
            className="w-full"
          >
            PIN entfernen
          </BigButton>
        ) : (
          <div className="flex gap-2">
            <input
              type="password"
              inputMode="numeric"
              placeholder="Neue PIN"
              className={inputClass}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
            />
            <BigButton onClick={savePin}>Setzen</BigButton>
          </div>
        )}
      </Section>

      <Section title="Beispieldaten (zum Ausprobieren)">
        <div className="flex gap-2">
          <BigButton
            variant="secondary"
            onClick={async () => {
              await seedDemo(30);
              flash('30 Tage Beispieldaten erzeugt.');
            }}
            className="flex-1"
          >
            Demodaten erzeugen
          </BigButton>
          <BigButton
            variant="danger"
            onClick={async () => {
              if (confirm('Wirklich ALLE Einträge löschen?')) {
                await clearAll();
                flash('Alle Einträge gelöscht.');
              }
            }}
            className="flex-1"
          >
            Alles löschen
          </BigButton>
        </div>
      </Section>

      <Section title="Rechtlicher Hinweis">
        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Diese App ist ein Selbstdokumentationswerkzeug und kein Medizinprodukt. Sie stellt keine
          Diagnosen und gibt keine Behandlungs- oder Ernährungsempfehlungen. Alle Daten bleiben lokal
          auf diesem Gerät.
        </p>
      </Section>
    </div>
  );
}
