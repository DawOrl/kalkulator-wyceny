import Link from "next/link";
import { Wizard } from "@/components/Wizard";

export default function Home() {
  return (
    <>
      <header className="border-b-2 border-ink/10">
        <div className="mx-auto flex w-full max-w-6xl items-baseline justify-between px-4 py-4">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="bg-ink px-1.5 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-sheet">
              PK
            </span>
            <span className="font-semibold tracking-tight">Pracownia Kreska</span>
          </Link>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft sm:block">
            Strony www · sklepy · aplikacje
          </span>
        </div>
      </header>

      <main className="flex-1">
        <Wizard />
      </main>

      <footer className="border-t-2 border-ink/10">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-baseline justify-between gap-2 px-4 py-5 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft">
          <span>Pracownia Kreska — fikcyjne studio demo</span>
          <span>
            Projekt:{" "}
            <a
              href="https://dorlowski.dev"
              className="underline decoration-dotted underline-offset-4 transition-colors hover:text-accent"
            >
              dorlowski.dev
            </a>
          </span>
        </div>
      </footer>
    </>
  );
}
