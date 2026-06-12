import {
  Answers,
  ContentId,
  DeadlineId,
  DesignId,
  ExtraId,
  PagesId,
  SiteTypeId,
  STEPS,
  emptyAnswers,
} from "@/data/pricing";

/**
 * Serializacja konfiguracji do query stringa (shareable link), np.
 * ?t=firmowa&p=p2_5&d=indywidualny&c=wlasne&x=blog,platnosci&dl=standard
 */

export function encodeAnswers(a: Answers): string {
  const params = new URLSearchParams();
  if (a.siteType) params.set("t", a.siteType);
  if (a.pages) params.set("p", a.pages);
  if (a.design) params.set("d", a.design);
  if (a.content) params.set("c", a.content);
  if (a.extras.length) params.set("x", a.extras.join(","));
  if (a.deadline) params.set("dl", a.deadline);
  return params.toString();
}

function validId(stepKey: string, id: string | null): string | null {
  if (!id) return null;
  const step = STEPS.find((s) => s.key === stepKey);
  return step?.options.some((o) => o.id === id) ? id : null;
}

export function decodeAnswers(search: string): Answers | null {
  const params = new URLSearchParams(search);
  if (!params.has("t")) return null;

  const extras = (params.get("x") ?? "")
    .split(",")
    .filter((id) => validId("extras", id)) as ExtraId[];

  const answers: Answers = {
    ...emptyAnswers,
    siteType: validId("siteType", params.get("t")) as SiteTypeId | null,
    pages: validId("pages", params.get("p")) as PagesId | null,
    design: validId("design", params.get("d")) as DesignId | null,
    content: validId("content", params.get("c")) as ContentId | null,
    extras,
    deadline: validId("deadline", params.get("dl")) as DeadlineId | null,
  };

  return answers.siteType ? answers : null;
}

/** komplet odpowiedzi = można pokazać wynik */
export function isComplete(a: Answers): boolean {
  return Boolean(a.siteType && a.pages && a.design && a.content && a.deadline);
}
