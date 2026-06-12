/**
 * Cennik bazowy i mnożniki kalkulatora — wszystkie liczby do kalibracji
 * znajdują się w tym jednym pliku.
 */

export type SiteTypeId = "wizytowka" | "landing" | "firmowa" | "sklep" | "webapp";
export type PagesId = "p1" | "p2_5" | "p6_10" | "p10plus";
export type DesignId = "szablon" | "indywidualny";
export type ContentId = "wlasne" | "copywriting";
export type ExtraId =
  | "blog"
  | "jezyki"
  | "rezerwacje"
  | "platnosci"
  | "integracje"
  | "animacje";
export type DeadlineId = "standard" | "ekspres";

export interface Answers {
  siteType: SiteTypeId | null;
  pages: PagesId | null;
  design: DesignId | null;
  content: ContentId | null;
  extras: ExtraId[];
  deadline: DeadlineId | null;
}

export const emptyAnswers: Answers = {
  siteType: null,
  pages: null,
  design: null,
  content: null,
  extras: [],
  deadline: null,
};

export type StepKey = keyof Answers;

export interface Option {
  id: string;
  label: string;
  description: string;
  /** adnotacja cenowa na karcie, np. "od 990 zł", "×1,2", "+700 zł" */
  hint: string;
}

export interface StepDef {
  key: StepKey;
  no: string;
  title: string;
  subtitle: string;
  multi?: boolean;
  options: Option[];
}

/* ------------------------------------------------------------------ */
/* Stawki                                                              */
/* ------------------------------------------------------------------ */

export const BASE_PRICE: Record<SiteTypeId, number> = {
  wizytowka: 990,
  landing: 1490,
  firmowa: 2490,
  sklep: 4900,
  webapp: 6900,
};

/** bazowy czas realizacji w tygodniach [min, max] */
export const BASE_WEEKS: Record<SiteTypeId, [number, number]> = {
  wizytowka: [1, 2],
  landing: [1, 2],
  firmowa: [2, 4],
  sklep: [4, 6],
  webapp: [6, 10],
};

export const PAGES_MULTIPLIER: Record<PagesId, number> = {
  p1: 1,
  p2_5: 1.2,
  p6_10: 1.45,
  p10plus: 1.7,
};

/** projekt indywidualny: % ceny bazowej */
export const CUSTOM_DESIGN_RATE = 0.3;

export const COPYWRITING_PRICE = 800;

export const EXTRA_PRICE: Record<ExtraId, number> = {
  blog: 700,
  jezyki: 900,
  rezerwacje: 800,
  platnosci: 1100,
  integracje: 1300,
  animacje: 900,
};

/** ile tygodni dokłada każdy dodatek (do górnej granicy) */
export const EXTRA_WEEKS: Partial<Record<ExtraId, number>> = {
  jezyki: 1,
  platnosci: 1,
  integracje: 1,
};

export const EXPRESS_MULTIPLIER = 1.25;
/** ekspres skraca widełki czasowe */
export const EXPRESS_WEEKS_FACTOR = 0.7;

/** widełki wyniku wokół sumy */
export const RANGE_DOWN = 0.9;
export const RANGE_UP = 1.2;

/* ------------------------------------------------------------------ */
/* Kroki wizarda                                                       */
/* ------------------------------------------------------------------ */

export const STEPS: StepDef[] = [
  {
    key: "siteType",
    no: "01",
    title: "Czego potrzebujesz?",
    subtitle: "Od typu projektu zależy stawka bazowa.",
    options: [
      {
        id: "wizytowka",
        label: "Strona wizytówka",
        description: "Najważniejsze informacje o firmie na jednej–dwóch podstronach.",
        hint: "od 990 zł",
      },
      {
        id: "landing",
        label: "Landing page",
        description: "Jedna strona pod kampanię, zaprojektowana pod konwersję.",
        hint: "od 1 490 zł",
      },
      {
        id: "firmowa",
        label: "Strona firmowa",
        description: "Wielopodstronowy serwis z ofertą, zespołem i kontaktem.",
        hint: "od 2 490 zł",
      },
      {
        id: "sklep",
        label: "Sklep internetowy",
        description: "Katalog produktów, koszyk i płatności online.",
        hint: "od 4 900 zł",
      },
      {
        id: "webapp",
        label: "Aplikacja webowa",
        description: "Logowanie, panel użytkownika, praca na danych.",
        hint: "od 6 900 zł",
      },
    ],
  },
  {
    key: "pages",
    no: "02",
    title: "Ile podstron?",
    subtitle: "Policz widoki z osobnym adresem: oferta, o nas, kontakt…",
    options: [
      { id: "p1", label: "1 podstrona", description: "Wszystko na jednym ekranie.", hint: "×1,0" },
      { id: "p2_5", label: "2–5 podstron", description: "Klasyczny mały serwis.", hint: "×1,2" },
      { id: "p6_10", label: "6–10 podstron", description: "Rozbudowana oferta lub usługi.", hint: "×1,45" },
      { id: "p10plus", label: "Ponad 10", description: "Duży serwis z wieloma sekcjami.", hint: "×1,7" },
    ],
  },
  {
    key: "design",
    no: "03",
    title: "Projekt graficzny",
    subtitle: "Szablon przyspiesza start, projekt indywidualny buduje markę.",
    options: [
      {
        id: "szablon",
        label: "Sprawdzony szablon",
        description: "Dopracowany motyw dopasowany do Twojej marki.",
        hint: "w cenie",
      },
      {
        id: "indywidualny",
        label: "Projekt indywidualny",
        description: "UI projektowane od zera, makiety i unikalny layout.",
        hint: "+30%",
      },
    ],
  },
  {
    key: "content",
    no: "04",
    title: "Treści na stronę",
    subtitle: "Teksty, które sprzedają, to połowa sukcesu.",
    options: [
      {
        id: "wlasne",
        label: "Dostarczę własne",
        description: "Ty przygotowujesz teksty, my dbamy o ich formę.",
        hint: "w cenie",
      },
      {
        id: "copywriting",
        label: "Napiszcie za mnie",
        description: "Copywriting całej strony przez naszego copywritera.",
        hint: "+800 zł",
      },
    ],
  },
  {
    key: "extras",
    no: "05",
    title: "Funkcje dodatkowe",
    subtitle: "Zaznacz wszystko, co się przyda — albo pomiń ten krok.",
    multi: true,
    options: [
      { id: "blog", label: "Blog / aktualności", description: "System wpisów z panelem.", hint: "+700 zł" },
      { id: "jezyki", label: "Wersje językowe", description: "Strona w 2+ językach.", hint: "+900 zł" },
      { id: "rezerwacje", label: "Rezerwacje online", description: "Kalendarz i umawianie wizyt.", hint: "+800 zł" },
      { id: "platnosci", label: "Płatności online", description: "Przelewy24, BLIK, karty.", hint: "+1 100 zł" },
      { id: "integracje", label: "Integracje API / CRM", description: "Połączenie z Twoimi narzędziami.", hint: "+1 300 zł" },
      { id: "animacje", label: "Animacje premium", description: "Dopracowany motion design.", hint: "+900 zł" },
    ],
  },
  {
    key: "deadline",
    no: "06",
    title: "Termin realizacji",
    subtitle: "Ekspres oznacza priorytet w kolejce projektów.",
    options: [
      {
        id: "standard",
        label: "Standardowy",
        description: "Spokojne tempo, pełna kolejka prac.",
        hint: "w cenie",
      },
      {
        id: "ekspres",
        label: "Ekspres",
        description: "Start od zaraz i skrócone terminy.",
        hint: "+25%",
      },
    ],
  },
];
