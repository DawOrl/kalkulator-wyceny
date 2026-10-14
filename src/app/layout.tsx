import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

/*
 * Archivo: grotesk z osią szerokości. Rozciągnięte wersaliki tytułów
 * przypominają liternictwo tabliczki rysunkowej, normalna szerokość
 * zostaje do czytania. IBM Plex Mono: krój z dokumentacji technicznej,
 * z wyraźnymi cyframi tabelarycznymi do kosztorysu.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kalkulator-wyceny-three.vercel.app"),
  title: "Kalkulator wyceny strony www · Pracownia Kreska",
  description:
    "Odpowiedz na 6 pytań i poznaj orientacyjną cenę swojej strony internetowej w 60 sekund. Kosztorys i makieta rysują się na żywo, pozycja po pozycji.",
  keywords: [
    "wycena strony internetowej",
    "kalkulator wyceny www",
    "ile kosztuje strona internetowa",
    "cennik stron www",
  ],
  authors: [{ name: "Dawid Orłowski", url: "https://dorlowski.dev" }],
  creator: "Dawid Orłowski",
  openGraph: {
    title: "Ile kosztuje Twoja strona www? Sprawdź w 60 sekund",
    description:
      "Interaktywny kalkulator wyceny: 6 pytań, kosztorys i makieta na żywo, widełki cen i czas realizacji.",
    locale: "pl_PL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f1e8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${archivo.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
