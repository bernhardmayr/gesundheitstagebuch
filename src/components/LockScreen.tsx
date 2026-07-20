import { useState } from 'react';
import { verifyPin } from '../lib/lock';
import { BigButton } from './ui';

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (await verifyPin(pin)) {
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <form onSubmit={submit} className="w-full max-w-xs space-y-4 text-center">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Tagebuch</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">PIN eingeben</p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          className="min-h-touch w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-center text-2xl tracking-[0.5em] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="PIN"
        />
        {error && <p className="text-sm text-red-500">Falsche PIN</p>}
        <BigButton type="submit" className="w-full">
          Entsperren
        </BigButton>
      </form>
    </div>
  );
}
