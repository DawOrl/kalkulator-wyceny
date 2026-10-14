import manifest from "@/data/makieta.json";
import type { Answers, StepKey } from "@/data/pricing";

/**
 * Warstwy makiety (render z scripts/blender/makieta.py). Każda warstwa to
 * pełnoklatkowy WebP z przezroczystością w tym samym kadrze, więc nałożone
 * w kolejności `order` składają się w jedną scenę.
 */

export const MAKIETA = {
  width: manifest.width,
  height: manifest.height,
  order: manifest.order,
  anchors: manifest.anchors as Record<string, number[]>,
};

export const layerSrc = (layer: string) => `/makieta/${layer}.webp`;

/** gniazdo na makiecie: jedna warstwa naraz (typ, podstrony) albo osobny element */
export function slotOf(layer: string): string {
  if (layer.startsWith("type-")) return "type";
  if (layer.startsWith("pages-")) return "pages";
  return layer;
}

/** warstwa, którą dokłada wybór opcji w danym kroku (null = nic nie dobudowuje) */
export function layerForOption(key: StepKey, optionId: string): string | null {
  switch (key) {
    case "siteType":
      return `type-${optionId}`;
    case "pages":
      return optionId === "p1" ? null : `pages-${optionId}`;
    case "design":
      return optionId === "indywidualny" ? "design" : null;
    case "content":
      return optionId === "copywriting" ? "content" : null;
    case "extras":
      return `extra-${optionId}`;
    case "deadline":
      return optionId === "ekspres" ? "express" : null;
  }
}

/** gniazdo, którego dotyczy krok (do podglądu "co się zmieni") */
export function slotForStep(key: StepKey, optionId: string): string {
  switch (key) {
    case "siteType":
      return "type";
    case "pages":
      return "pages";
    case "design":
      return "design";
    case "content":
      return "content";
    case "extras":
      return `extra-${optionId}`;
    case "deadline":
      return "express";
  }
}

export function layersFor(a: Answers): string[] {
  const set = new Set<string>();
  if (a.siteType) set.add(`type-${a.siteType}`);
  if (a.pages && a.pages !== "p1") set.add(`pages-${a.pages}`);
  if (a.design === "indywidualny") set.add("design");
  if (a.content === "copywriting") set.add("content");
  for (const x of a.extras) set.add(`extra-${x}`);
  if (a.deadline === "ekspres") set.add("express");
  return MAKIETA.order.filter((l) => set.has(l));
}
