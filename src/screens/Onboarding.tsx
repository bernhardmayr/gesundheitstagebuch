import { BigButton } from '../components/ui';

export function Onboarding({ onDone }: { onDone: () => void }) {
  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-lg px-5 py-10 space-y-6">
        <h1 className="text-2xl font-semibold">Willkommen</h1>

        <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <p>
            Dies ist ein <strong>Selbstdokumentationswerkzeug</strong>, mit dem Sie Ihre Beschwerden
            strukturiert festhalten können – etwa zur Vorlage bei Ärzt:innen oder Behörden.
          </p>
          <p>
            Die App ist <strong>kein Medizinprodukt</strong>. Sie stellt keine Diagnosen, gibt keine
            Behandlungs- oder Ernährungsempfehlungen und ersetzt keine ärztliche Beratung.
          </p>
          <p>
            Alle Eingaben bleiben <strong>ausschließlich lokal auf diesem Gerät</strong> gespeichert
            (im Browser). Es findet keine Übertragung an einen Server statt. Für eine Sicherung können
            Sie Ihre Daten jederzeit als Datei exportieren.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bitte denken Sie an regelmäßige Backups (Einstellungen → Datensicherung). Wenn Sie die
            Browserdaten löschen oder die App deinstallieren, gehen die Einträge ohne Backup verloren.
          </p>
        </div>

        <BigButton onClick={onDone} className="w-full">
          Verstanden und starten
        </BigButton>
      </div>
    </div>
  );
}
