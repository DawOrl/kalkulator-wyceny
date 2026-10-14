import Link from "next/link";
import { Wizard } from "@/components/Wizard";

export default function Home() {
  return (
    <>
      <a
        href="#kalkulator"
        className="label sr-only z-50 bg-sheet px-3 py-2 !text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Przejdź do kalkulatora
      </a>
      <header className="border-b-2 border-ink/10">
        <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Pracownia Kreska, strona główna">
            <span className="grid size-8 place-items-center bg-ink font-mono text-[11px] font-semibold tracking-[0.12em] text-sheet">
              PK
            </span>
            <span className="wide text-[15px] font-semibold tracking-tight">Pracownia Kreska</span>
          </Link>
          <span className="label hidden sm:block">Strony www · sklepy · aplikacje</span>
        </div>
      </header>

      <main id="kalkulator" className="flex flex-1 flex-col">
        <Wizard />
      </main>

      <footer className="border-t-2 border-ink/10">
        <div className="label mx-auto flex w-full max-w-[1360px] flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-4 py-5 sm:px-6">
          <span>Pracownia Kreska: fikcyjne studio demo, cennik poglądowy</span>
          <span>
            Projekt:{" "}
            <a
              href="https://dorlowski.dev"
              className="text-ink underline decoration-dotted underline-offset-4 transition-colors hover:text-accent-ink"
            >
              dorlowski.dev
            </a>
          </span>
        </div>
      </footer>
    </>
  );
}
