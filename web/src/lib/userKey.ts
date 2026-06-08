// Wybór dostawcy + klucz użytkownika trzymane WYŁĄCZNIE w przeglądarce (localStorage).
// Klucz nigdy nie trafia na nasz serwer — tylko bezpośrednio do dostawcy z urządzenia użytkownika.
import type { AsrProvider } from "./cloudAsr";

export interface UserAsr { provider: AsrProvider; key: string }
const K = "widzwiek.user_asr";

export function getUserAsr(): UserAsr | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(K);
    if (!raw) return null;
    const v = JSON.parse(raw) as UserAsr;
    return v && v.key ? v : null;
  } catch { return null; }
}
export function setUserAsr(v: UserAsr | null): void {
  if (typeof window === "undefined") return;
  try {
    if (v && v.key.trim()) window.localStorage.setItem(K, JSON.stringify({ provider: v.provider, key: v.key.trim() }));
    else window.localStorage.removeItem(K);
  } catch { /* ignore */ }
}
