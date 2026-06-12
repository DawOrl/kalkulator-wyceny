import type { ReactNode } from "react";

/**
 * Ikony opcji w stylu rysunku technicznego — sama kreska, bez wypełnień.
 */

const PATHS: Record<string, ReactNode> = {
  /* typ strony */
  wizytowka: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
      <circle cx="8.5" cy="11" r="1.8" />
      <path d="M12.5 9.5h5M12.5 12.5h5M5.5 16h13" />
    </>
  ),
  landing: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M3.5 8.5h17M7 12.5h10M9 15.5h6" />
      <path d="M12 18.5v-1" />
    </>
  ),
  firmowa: (
    <>
      <rect x="3.5" y="4.5" width="17" height="12" rx="1.5" />
      <path d="M3.5 8h17M8.5 8v8.5" />
      <path d="M6 19.5h12" />
    </>
  ),
  sklep: (
    <>
      <path d="M5 9.5 6 5h12l1 4.5" />
      <path d="M5 9.5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
      <path d="M9.5 13a2.5 2.5 0 0 0 5 0" />
    </>
  ),
  webapp: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M3.5 8.5h17M6 6.5h.01M8.2 6.5h.01" />
      <path d="m9.5 12-2 2 2 2M14.5 12l2 2-2 2" />
    </>
  ),

  /* liczba podstron */
  p1: <rect x="7.5" y="4.5" width="9" height="15" rx="1" />,
  p2_5: (
    <>
      <rect x="5" y="6.5" width="9" height="13" rx="1" />
      <path d="M9 4.5h9a1 1 0 0 1 1 1V17" />
    </>
  ),
  p6_10: (
    <>
      <rect x="4" y="8" width="9" height="12" rx="1" />
      <path d="M7.5 6h9a1 1 0 0 1 1 1v11" />
      <path d="M11 4h8a1 1 0 0 1 1 1v11" />
    </>
  ),
  p10plus: (
    <>
      <rect x="4" y="9" width="8" height="11" rx="1" />
      <path d="M7 7h8a1 1 0 0 1 1 1v10" />
      <path d="M10 5h7a1 1 0 0 1 1 1v9" />
      <path d="M17 3.5h2.5M18.25 2.25v2.5" />
    </>
  ),

  /* projekt graficzny */
  szablon: (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="1.5" />
      <path d="M4.5 9.5h15M9.5 9.5v10" />
    </>
  ),
  indywidualny: (
    <>
      <path d="m14.5 5.5 4 4L8 20l-4.5.5L4 16z" />
      <path d="m12.5 7.5 4 4" />
      <path d="M17 3.5 20.5 7" />
    </>
  ),

  /* treści */
  wlasne: (
    <>
      <path d="M6 4.5h9l3.5 3.5v11.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1z" />
      <path d="M15 4.5V8h3.5M8.5 12h7M8.5 15h7" />
    </>
  ),
  copywriting: (
    <>
      <path d="M5 19.5c4-1 9-1 12.5-9.5" />
      <path d="M14 6.5c2-2 4.5-2.5 4.5-2.5S18 7 16 9c-1.6 1.6-4 1.5-4 1.5s-.1-2.4 2-4z" />
    </>
  ),

  /* dodatki */
  blog: (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="1.5" />
      <path d="M8 9h8M8 12h8M8 15h4.5" />
    </>
  ),
  jezyki: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M4.5 12h15M12 4.5c-4.5 4.5-4.5 10.5 0 15M12 4.5c4.5 4.5 4.5 10.5 0 15" />
    </>
  ),
  rezerwacje: (
    <>
      <rect x="4.5" y="5.5" width="15" height="14" rx="1.5" />
      <path d="M4.5 9.5h15M8.5 3.5v3M15.5 3.5v3" />
      <path d="m9.5 14 2 2 3.5-3.5" />
    </>
  ),
  platnosci: (
    <>
      <rect x="3.5" y="6.5" width="17" height="11" rx="1.5" />
      <path d="M3.5 10h17M7 14.5h4" />
    </>
  ),
  integracje: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
      <path d="M10.5 7h4a2 2 0 0 1 2 2v4.5M13.5 17h-4a2 2 0 0 1-2-2v-4.5" />
    </>
  ),
  animacje: (
    <>
      <circle cx="9" cy="12" r="5.5" />
      <circle cx="15" cy="12" r="5.5" opacity="0.45" />
    </>
  ),

  /* termin */
  standard: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9v4l2.5 2.5M9.5 3.5h5" />
    </>
  ),
  ekspres: (
    <>
      <path d="M13.5 3.5 6 13.5h4.5L10 20.5l7.5-10h-4.5z" />
    </>
  ),
};

export function OptionIcon({ id, className }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[id] ?? <circle cx="12" cy="12" r="7.5" />}
    </svg>
  );
}
