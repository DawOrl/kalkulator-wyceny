"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MAKIETA, layerSrc, slotOf } from "@/lib/makieta";

export interface Callout {
  layer: string;
  no: number;
}

export interface MakietaPreview {
  slot: string;
  /** warstwa, którą dobuduje wskazana opcja; null = opcja usuwa element z gniazda */
  layer: string | null;
}

interface MakietaProps {
  /** warstwy do pokazania (bez podstawy), dowolna kolejność */
  layers: string[];
  /** podgląd opcji pod kursorem / fokusem */
  preview?: MakietaPreview | null;
  /** odnośniki z numerami pozycji kosztorysu */
  callouts?: Callout[];
  /** warstwy pobierane z wyprzedzeniem (opcje bieżącego pytania) */
  prefetch?: string[];
  /** opis makiety dla czytników ekranu */
  label: string;
  sizes: string;
  /** pierwszy ekran: podstawa ładowana od razu */
  eager?: boolean;
  /** budowanie warstwa po warstwie przy pierwszym renderze (sekundy między warstwami) */
  stagger?: number;
  children?: ReactNode;
  className?: string;
}

type LayerState = "solid" | "ghost" | "dim";

function arrange(layers: string[], preview?: MakietaPreview | null) {
  const items: { layer: string; state: LayerState }[] = layers.map((layer) => ({
    layer,
    state: "solid",
  }));
  if (preview) {
    const current = items.find((i) => slotOf(i.layer) === preview.slot);
    if (preview.layer && current?.layer !== preview.layer) {
      if (current) current.state = "dim";
      items.push({ layer: preview.layer, state: "ghost" });
    } else if (!preview.layer && current) {
      current.state = "dim";
    }
  }
  return items.sort((a, b) => MAKIETA.order.indexOf(a.layer) - MAKIETA.order.indexOf(b.layer));
}

export function Makieta({
  layers,
  preview,
  callouts = [],
  prefetch = [],
  label,
  sizes,
  eager = false,
  stagger = 0,
  children,
  className,
}: MakietaProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const items = arrange(layers, preview);
  const shown = new Set(items.map((i) => i.layer));
  const order = new Map(items.map((item, i) => [item.layer, i]));

  return (
    <div
      role="img"
      aria-label={label}
      className={`makieta relative w-full select-none ${className ?? ""}`}
      style={{ aspectRatio: `${MAKIETA.width} / ${MAKIETA.height}` }}
    >
      <Image
        src={layerSrc("base")}
        alt=""
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        className="pointer-events-none object-contain"
        draggable={false}
      />

      <AnimatePresence initial={stagger > 0}>
        {items.map((item) => (
          <Layer
            key={item.layer}
            layer={item.layer}
            state={item.state}
            sizes={sizes}
            reduceMotion={reduceMotion}
            delay={stagger > 0 && !reduceMotion ? 0.25 + (order.get(item.layer) ?? 0) * stagger : 0}
          />
        ))}
      </AnimatePresence>

      {/*
        Pobranie z wyprzedzeniem tylko w krokach: warstwy opcji bieżącego pytania,
        żeby wybór nie czekał na sieć. Priorytet ma wyłącznie podstawa (eager).
      */}
      {prefetch
        .filter((l) => !shown.has(l))
        .map((l) => (
          <Image
            key={`pre-${l}`}
            src={layerSrc(l)}
            alt=""
            fill
            sizes={sizes}
            loading="eager"
            aria-hidden="true"
            className="pointer-events-none invisible object-contain"
          />
        ))}

      <AnimatePresence initial={stagger > 0}>
        {callouts
          .filter((c) => MAKIETA.anchors[c.layer] && shown.has(c.layer))
          .map((c) => {
            const [x, y] = MAKIETA.anchors[c.layer];
            const delay = reduceMotion ? 0.1 : stagger > 0 ? 0.55 + (order.get(c.layer) ?? 0) * stagger : 0.4;
            return (
              <motion.div
                key={`callout-${c.layer}`}
                className="callout"
                style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                // ten sam stan początkowy na serwerze i w przeglądarce; przy ograniczonym
                // ruchu skala przeskakuje od razu, zostaje samo przenikanie
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={
                  reduceMotion
                    ? { scale: { duration: 0 }, opacity: { duration: 0.15, delay } }
                    : { type: "spring", duration: 0.45, bounce: 0.3, delay }
                }
                aria-hidden="true"
              >
                <span className="callout-dot" />
                <span className="callout-leader" />
                <span className="callout-balloon">{c.no}</span>
              </motion.div>
            );
          })}
      </AnimatePresence>

      {children}
    </div>
  );
}

function Layer({
  layer,
  state,
  sizes,
  reduceMotion,
  delay,
}: {
  layer: string;
  state: LayerState;
  sizes: string;
  reduceMotion: boolean;
  delay: number;
}) {
  const [ready, setReady] = useState(false);
  const ghost = state === "ghost";
  const opacity = !ready ? 0 : state === "solid" ? 1 : ghost ? 0.5 : 0.18;

  return (
    <motion.div
      className={`pointer-events-none absolute inset-0 ${ghost ? "makieta-ghost" : ""}`}
      initial={ghost ? { opacity: 0 } : { opacity: 0, y: "-7%" }}
      animate={{ opacity, y: ready || ghost ? 0 : "-7%" }}
      exit={{ opacity: 0, transition: { duration: ghost ? 0.12 : 0.2 } }}
      transition={
        reduceMotion || ghost
          ? { y: { duration: 0 }, opacity: { duration: 0.16 } }
          : {
              y: { type: "spring", duration: 0.6, bounce: 0.32, delay },
              opacity: { duration: 0.2, delay: state === "solid" ? delay : 0 },
            }
      }
    >
      <Image
        src={layerSrc(layer)}
        alt=""
        fill
        sizes={sizes}
        onLoad={() => setReady(true)}
        className="object-contain"
        draggable={false}
      />
    </motion.div>
  );
}
