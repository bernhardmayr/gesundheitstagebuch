import { useRegisterSW } from 'virtual:pwa-register/react';

const STUNDE = 60 * 60 * 1000;

// Meldet eine neue App-Version, statt sie still im Hintergrund zu installieren. So läuft nicht
// unbemerkt eine alte Version weiter, und ein Neuladen unterbricht nie eine laufende Eingabe.
export function UpdateHinweis() {
  const {
    needRefresh: [neu, setNeu],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      // Installierte PWAs bleiben oft lange geöffnet: stündlich und beim Zurückkehren prüfen
      setInterval(() => reg.update(), STUNDE);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update();
      });
    },
  });

  if (!neu) return null;

  return (
    <div
      role="status"
      className="no-print fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-lg items-center gap-3 rounded-xl border border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950 px-4 py-3 shadow-lg"
    >
      <span className="flex-1 text-sm text-sky-900 dark:text-sky-100">Neue Version verfügbar.</span>
      <button
        type="button"
        onClick={() => setNeu(false)}
        className="min-h-touch px-2 text-sm text-slate-600 dark:text-slate-300"
      >
        Später
      </button>
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="min-h-touch rounded-lg bg-sky-600 px-3 text-sm font-semibold text-white"
      >
        Neu laden
      </button>
    </div>
  );
}
