"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface ContactFormProps {
  /** podsumowanie konfiguracji dołączane do "wysyłki" */
  summary: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  x: Math.cos((i / 18) * Math.PI * 2) * (60 + (i % 3) * 28),
  y: Math.sin((i / 18) * Math.PI * 2) * (44 + ((i + 1) % 3) * 24) - 30,
  rotate: i * 73,
  color: i % 3 === 0 ? "var(--color-accent)" : i % 3 === 1 ? "var(--color-ink)" : "var(--color-line)",
}));

export function ContactForm({ summary }: ContactFormProps) {
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = "Podaj poprawny adres e-mail.";
    if (phone.trim().replace(/[^\d]/g, "").length < 9) next.phone = "Podaj numer telefonu (min. 9 cyfr).";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("sending");
    // Demo: mock wysyłki — bez backendu, konfiguracja trafiłaby do CRM/maila.
    console.info("[demo] wysyłka wyceny:", { email, phone, summary });
    await new Promise((r) => setTimeout(r, 900));
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="relative flex flex-col items-center px-6 py-10 text-center">
        {!reduceMotion && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {CONFETTI.map((c, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                animate={{ opacity: 0, x: c.x, y: c.y, rotate: c.rotate }}
                transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
                className="absolute left-1/2 top-1/3 block h-2.5 w-1.5"
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>
        )}
        <motion.svg
          viewBox="0 0 48 48"
          className="size-14 text-accent"
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
            transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
          />
        </motion.svg>
        <h3 className="mt-4 text-xl font-semibold">Dziękujemy!</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
          Szczegółowa wycena trafi na Twój e-mail w ciągu 24 godzin roboczych.
          Numer dokumentu znajdziesz w temacie wiadomości.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="px-6 py-6">
      <h3 className="text-lg font-semibold">Wyślij mi szczegółową wycenę</h3>
      <p className="mt-1 text-sm text-ink-soft">
        Odeślemy konkretną ofertę przygotowaną na bazie tej konfiguracji.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="mt-1.5 w-full border-2 border-line bg-sheet px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent"
            placeholder="jan@firma.pl"
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-xs text-accent-deep">
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="phone" className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft">
            Telefon
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className="mt-1.5 w-full border-2 border-line bg-sheet px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent"
            placeholder="600 700 800"
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1 text-xs text-accent-deep">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-5 w-full border-2 border-accent bg-accent px-5 py-3 font-medium text-sheet transition-colors hover:bg-accent-deep hover:border-accent-deep disabled:opacity-60"
      >
        {status === "sending" ? "Wysyłanie…" : "Wyślij mi szczegółową wycenę"}
      </button>
      <p className="mt-3 text-center text-[11px] text-ink-soft">
        Demo — formularz niczego nie wysyła. Zero spamu, obiecujemy.
      </p>
    </form>
  );
}
