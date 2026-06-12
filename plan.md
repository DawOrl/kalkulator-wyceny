# Kalkulator wyceny strony www — mini-aplikacja (demo + lead magnet)

Projekt autorski do biblioteki realizacji na **dorlowski.dev**.

## Cel demo (podwójny)

1. **Do biblioteki:** pokazuje kategorię „Aplikacje & automatyzacje" w formie
   prostszej i bliższej codzienności klienta niż Asystent AI — interaktywne
   narzędzie, które automatyzuje pierwszy kontakt z klientem.
2. **Do własnego użytku:** ten sam kalkulator można po przemalowaniu wpiąć na
   dorlowski.dev jako **lead magnet** („Sprawdź orientacyjną cenę w 60 sekund")
   — demo, które samo zbiera leady.

## Fikcyjny scenariusz

Narzędzie studia webowego: potencjalny klient odpowiada na kilka pytań
i od razu widzi **orientacyjny przedział cenowy + zakres prac**, a na końcu
zostawia kontakt, by otrzymać konkretną wycenę.

## Koncept wizualny

- **Konwersacyjny wizard** — jedno pytanie na ekran, duże klikalne karty odpowiedzi
  (z ikoną), pasek postępu, płynne przejścia między krokami (framer-motion
  `AnimatePresence`, slide+fade).
- Czysty, „produktowy" wygląd: neutralne tło, jeden mocny kolor akcentu,
  duża typografia pytań. Desktop: wycentrowana karta; mobile: pełny ekran.
- Wynik jako czytelna karta podsumowania: przedział cenowy (animowane liczby),
  szacowany czas realizacji, lista pozycji składowych.

## Logika kalkulatora (kroki wizarda)

1. **Typ strony** — wizytówka / firmowa wielopodstronowa / landing pod kampanię /
   sklep / aplikacja webowa (bazowa stawka).
2. **Liczba podstron** — suwak lub przedziały (1 / 2–5 / 6–10 / 10+) (mnożnik).
3. **Projekt graficzny** — gotowy szablon / indywidualny projekt UI (dodatek).
4. **Treści** — klient dostarcza / do napisania (copywriting) (dodatek).
5. **Funkcje dodatkowe** (multi-select) — blog, wielojęzyczność, rezerwacje,
   płatności, integracje (API/CRM), animacje premium (każda pozycja dolicza).
6. **Termin** — standard / ekspres (mnożnik).
7. **Wynik** — przedział „od–do" (np. ±20% wokół sumy), czas realizacji,
   rozpis pozycji; CTA: „Wyślij mi szczegółową wycenę" → formularz
   (e-mail + telefon) z podsumowaniem konfiguracji.

Cennik bazowy i mnożniki w jednym pliku `src/data/pricing.ts` — łatwa kalibracja
(spójna z cennikiem dorlowski.dev: Start od 990 zł, Biznes od 2 490 zł).

## Funkcjonalności kluczowe

- Stan wizarda w React (reducer); wstecz/dalej bez utraty odpowiedzi;
  klawiatura (Enter = dalej) i pełna dostępność (focus management między krokami).
- Animowane liczby w wyniku (count-up), konfetti/checkmark po wysłaniu formularza.
- Podsumowanie konfiguracji serializowane do query stringa (shareable link).
- Formularz końcowy: walidacja, mock wysyłki (jak w pozostałych demo),
  stan „dziękujemy".
- `prefers-reduced-motion` respektowane; brak backendu — wszystko po stronie klienta.

## Stack (spójny z resztą demo)

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · framer-motion ·
TypeScript. Deploy: Vercel. Repo: GitHub (`DawOrl/kalkulator-wyceny`).

## Kroki wdrożenia

1. `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir`
2. Model danych: typy kroków/odpowiedzi + `pricing.ts` (stawki, mnożniki, opisy).
3. Silnik wizarda (reducer + komponent kroku) i przejścia `AnimatePresence`.
4. Ekran wyniku (wyliczenie, count-up, rozpis) + formularz kontaktowy.
5. Polish: progress bar, klawiatura, focus, responsywność 375/768/1440.
6. SEO/OG minimalne (to narzędzie, nie content) + ładny OG image.
7. Deploy na Vercel + repo GitHub.

## Definicja ukończenia (publikacja w bibliotece)

- [ ] Live na Vercelu, repo na GitHubie
- [ ] Wpis w `portfolio_web/scripts/shots.config.json` + `npm run shots kalkulator-wyceny`
- [ ] Kompresja PNG (sharp)
- [ ] Obiekt projektu w `cv-data.ts` (kategoria: **Aplikacja & automatyzacja**,
      kind: demo, problem/solution/result, stack, scope, liveUrl, githubUrl)
- [ ] (Opcjonalnie, później) wariant kalkulatora wpięty na dorlowski.dev jako
      lead magnet
