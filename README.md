# Kalkulator wyceny strony www

Interaktywny kalkulator wyceny dla fikcyjnego studia webowego **Pracownia
Kreska** — projekt demonstracyjny do biblioteki realizacji
[dorlowski.dev](https://dorlowski.dev).

Klient odpowiada na 6 pytań (typ strony, podstrony, projekt graficzny, treści,
funkcje dodatkowe, termin) i od razu widzi orientacyjny przedział cenowy wraz
z rozpisem pozycji i czasem realizacji.

## Co wyróżnia ten projekt

- **Estetyka „kosztorysu technicznego"** — papier milimetrowy, granatowy tusz,
  jeden sygnałowy pomarańcz, liczby w monospace; zamiast kolejnego
  gradientowego SaaS-a.
- **Kosztorys drukujący się na żywo** — każda odpowiedź dopisuje pozycję do
  papierowego arkusza (ząbkowana krawędź paragonu, kropkowane leadery),
  a suma tyka jak taksometr. Na mobile arkusz chowa się w dolnej szufladzie.
- **Wynik z pieczątką** „WYCENA WSTĘPNA", animowanym count-upem widełek
  i deterministycznym numerem dokumentu wyliczanym z konfiguracji.
- **Shareable link** — konfiguracja serializowana do query stringa.
- Obsługa klawiatury (Enter = dalej), focus management między krokami,
  respektowane `prefers-reduced-motion`. Bez backendu — wszystko po stronie
  klienta, formularz to mock.

## Kalibracja cen

Wszystkie stawki, mnożniki i opisy kroków mieszkają w jednym pliku:
[`src/data/pricing.ts`](src/data/pricing.ts).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
framer-motion. Deploy: Vercel.

## Uruchomienie

```bash
npm install
npm run dev
```

Aplikacja działa pod `http://localhost:3000`.

---

Projekt: [Dawid Orłowski](https://dorlowski.dev) · Pracownia Kreska jest
fikcyjna, cennik jest poglądowy.
