import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kalkulator-wyceny.vercel.app"),
  title: "Kalkulator wyceny strony www — Pracownia Kreska",
  description:
    "Odpowiedz na 6 pytań i poznaj orientacyjną cenę swojej strony internetowej w 60 sekund. Kosztorys rysuje się na żywo — pozycja po pozycji.",
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
      "Interaktywny kalkulator wyceny — 6 pytań, kosztorys na żywo, widełki cen i czas realizacji.",
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
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
