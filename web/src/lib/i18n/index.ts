// Lekka warstwa i18n (bez ciężkiego routingu locale). Domyślny język z BRAND.locale.
// Wejście na kolejny język = dopisanie katalogu i wpisu w CATALOG; UI czyta przez useT().
import { BRAND } from "@/lib/brand";
import { pl, type Messages } from "./messages";

export type Locale = "pl" | "en" | "de";

const CATALOG: Partial<Record<Locale, Messages>> = { pl };

export function getLocale(): Locale {
  return (BRAND.locale as Locale) in CATALOG ? (BRAND.locale as Locale) : "pl";
}

export function messages(locale: Locale = getLocale()): Messages {
  return CATALOG[locale] ?? pl;
}

/** Hook do komponentów (client i server safe): const t = useT(); t.nav.overview */
export function useT(): Messages {
  return messages();
}
