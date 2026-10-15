"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface ContactFormProps {
  /** numer dokumentu wyceny */
  docId: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const fieldClass =
  "mt-1.5 min-h-12 w-full border-2 bg-sheet px-3 text-[16px] outline-none transition-colors placeholder:text-ink-soft/70 focus:border-accent-ink";

export function ContactForm({ docId }: ContactFormProps) {
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = "Podaj adres e-mail w formie nazwa@firma.pl.";
    if (phone.trim().replace(/[^\d]/g, "").length < 9) next.phone = "Podaj numer telefonu, co najmniej 9 cyfr.";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      document.getElementById(next.email ? "email" : "phone")?.focus();
      return;
    }

    setStatus("sending");
    // Demo: wysyłka jest symulowana, nic nie opuszcza przeglądarki i nic nie trafia do logów.
    // W produkcji konfiguracja z numerem dokumentu trafiłaby do CRM albo na maila.
    await new Promise((r) => setTimeout(r, 900));
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-start px-5 py-8 sm:px-8" role="status">
        <motion.svg
          viewBox="0 0 48 48"
          className="size-12 text-accent-ink"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <motion.circle
            cx="24"
            cy="24"
            r="21"
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <motion.path
            d="M15 24.5 21.5 31 33 18"
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: 0.35, ease: "easeOut" }}
          />
        </motion.svg>
        <h3 className="wide mt-4 text-xl font-bold tracking-tight">Dziękujemy, zapytanie przyjęte.</h3>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-soft">
          Szczegółowa wycena trafi na Twój e-mail w ciągu 24 godzin roboczych. W temacie wiadomości
          znajdziesz numer dokumentu <span className="font-mono text-ink">{docId}</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="px-5 py-6 sm:px-8">
      <h2 className="wide text-xl font-bold tracking-tight">Wyślij mi szczegółową wycenę</h2>
      <p className="mt-1 text-[15px] text-ink-soft">
        Odeślemy konkretną ofertę przygotowaną na bazie dokumentu{" "}
        <span className="font-mono text-ink">{docId}</span>.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="label">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`${fieldClass} ${errors.email ? "border-accent-ink" : "border-line"}`}
            placeholder="nazwa@firma.pl"
          />
          {errors.email && (
            <p id="email-error" className="mt-1.5 text-[13px] text-accent-deep">
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="phone" className="label">
            Telefon
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className={`${fieldClass} ${errors.phone ? "border-accent-ink" : "border-line"}`}
            placeholder="Numer telefonu"
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1.5 text-[13px] text-accent-deep">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="press wide mt-5 min-h-14 w-full bg-ink px-5 text-[16px] font-semibold text-sheet hover:bg-accent-ink disabled:opacity-60"
      >
        {status === "sending" ? "Wysyłanie…" : "Wyślij konfigurację"}
      </button>
      <p className="mt-3 text-[12.5px] text-ink-soft">To demo: formularz niczego nie wysyła.</p>
    </form>
  );
}
