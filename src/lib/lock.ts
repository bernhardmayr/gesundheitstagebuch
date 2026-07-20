// App-Sperre per PIN. Es wird nur ein PBKDF2-Hash (kein Klartext) in localStorage gehalten.
// Die Sperre schützt vor beiläufigem Fremdzugriff auf dem Gerät; sie verschlüsselt nicht die
// IndexedDB-Daten selbst.

const KEY = 'tagebuch.pin.v1';
const ITER = 150_000;

interface StoredPin {
  salt: string; // base64
  hash: string; // base64
}

function toB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function fromB64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function derive(pin: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: ITER, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  return toB64(bits);
}

export function isPinSet(): boolean {
  return localStorage.getItem(KEY) !== null;
}

export async function setPin(pin: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(pin, salt);
  const stored: StoredPin = { salt: toB64(salt.buffer), hash };
  localStorage.setItem(KEY, JSON.stringify(stored));
}

export async function verifyPin(pin: string): Promise<boolean> {
  const raw = localStorage.getItem(KEY);
  if (!raw) return true;
  const stored = JSON.parse(raw) as StoredPin;
  const hash = await derive(pin, fromB64(stored.salt));
  return hash === stored.hash;
}

export function clearPin(): void {
  localStorage.removeItem(KEY);
}
