import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { LockScreen } from './components/LockScreen';
import { isPinSet } from './lib/lock';
import { Onboarding } from './screens/Onboarding';
import { QuickEntry } from './screens/QuickEntry';
import { History } from './screens/History';
import { Analysis } from './screens/Analysis';
import { Report } from './screens/Report';
import { Settings } from './screens/Settings';

const ONBOARDING_KEY = 'tagebuch.onboarding.done';

export default function App() {
  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) === '1',
  );
  const [unlocked, setUnlocked] = useState(() => !isPinSet());

  if (!onboarded) {
    return (
      <Onboarding
        onDone={() => {
          localStorage.setItem(ONBOARDING_KEY, '1');
          setOnboarded(true);
        }}
      />
    );
  }

  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <main className="mx-auto max-w-lg px-4 pt-4 pb-28">
        <Routes>
          <Route path="/" element={<QuickEntry />} />
          <Route path="/verlauf" element={<History />} />
          <Route path="/auswertung" element={<Analysis />} />
          <Route path="/bericht" element={<Report />} />
          <Route path="/einstellungen" element={<Settings />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
