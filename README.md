# Kalkulator wyceny strony www

Interaktywny kalkulator wyceny dla fikcyjnego studia webowego **Pracownia
Kreska**: projekt demonstracyjny do biblioteki realizacji
[dorlowski.dev](https://dorlowski.dev).

Klient odpowiada na 6 pytań (typ strony, podstrony, projekt graficzny, treści,
funkcje dodatkowe, termin) i od razu widzi orientacyjny przedział cenowy wraz
z rozpisem pozycji i czasem realizacji.

## Co wyróżnia ten projekt

- **Estetyka rysunku technicznego i kosztorysu**: papier milimetrowy,
  granatowy tusz, jeden sygnałowy pomarańcz, tabliczka rysunkowa, liczby
  w monospace.
- **Makieta, która rośnie z odpowiedziami**: każdy wybór dokłada element
  makiety na macie kreślarskiej (budynek, skrzydła, lamele, tablica, dodatki,
  żuraw przy trybie ekspres). Najechanie na opcję pokazuje jej szkic, zanim
  klient ją wybierze.
- **Kosztorys z odnośnikami**: pozycje dopisują się jak u kosztorysanta
  (wiersz odsłania się od lewej, kwota dolicza się, marker podkreśla nowość),
  a numer w kółku wskazuje ten sam element na makiecie.
- **Arkusz wyniku**: widełki, czas realizacji, wykaz pozycji, założenia
  z przyciskiem „Zmień” przy każdym kroku, kroki „Co dalej” i formularz.
- **Link do wyceny**: konfiguracja zapisana w query stringu.
- **Klawiatura**: Enter = dalej, litery A–F wybierają opcję, strzałki
  przesuwają wybór, Spacja zaznacza. Na telefonie kosztorys w szufladzie
  (Esc i tło zamykają). Respektowane `prefers-reduced-motion`.
- Bez backendu: wszystko po stronie klienta, formularz to mock.

## Makieta (Blender)

Scena jest budowana proceduralnie skryptem
[`scripts/blender/makieta.py`](scripts/blender/makieta.py) (bez zewnętrznych
modeli) i renderowana warstwami: każdy element osobno, z tej samej kamery
ortograficznej, z przezroczystym tłem i cieniem na macie. Warstwy nakładane
w stałej kolejności składają się w jedną scenę, krawędzie rysuje Freestyle.

```bash
blender --background --factory-startup --python-exit-code 1 \
  --python scripts/blender/makieta.py -- \
  --out public/makieta --json src/data/makieta.json --tmp /tmp/makieta
```

Wynik: `public/makieta/*.webp` (18 warstw) i `src/data/makieta.json`
(kolejność warstw i punkty odnośników). Podgląd całej sceny: `--preview
--scale 0.5`.

## Kalibracja cen

Wszystkie stawki, mnożniki i opisy kroków mieszkają w jednym pliku:
[`src/data/pricing.ts`](src/data/pricing.ts).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
framer-motion · Blender 5 (Cycles + Freestyle). Deploy: Vercel.

## Uruchomienie

```bash
npm install
npm run dev
```

Aplikacja działa pod `http://localhost:3000`.

---

Projekt: [Dawid Orłowski](https://dorlowski.dev) · Pracownia Kreska jest
fikcyjna, cennik jest poglądowy.
