"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

interface CountUpProps {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}

/** Licznik tykający jak taksometr — animuje od poprzedniej wartości. */
export function CountUp({
  value,
  format = (n) => n.toLocaleString("pl-PL"),
  duration = 0.7,
  className,
}: CountUpProps) {
  const reduceMotion = useReducedMotion();
  const previous = useRef(0);
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      previous.current = value;
      return;
    }
    const controls = animate(previous.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setAnimated(Math.round(latest)),
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, duration, reduceMotion]);

  const display = reduceMotion ? value : animated;

  return (
    <span className={`tabular ${className ?? ""}`}>{format(display)}</span>
  );
}
