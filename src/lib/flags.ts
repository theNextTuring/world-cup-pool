export const FLAG_BY_SLUG: Record<string, string> = {
  mexico: "mx",
  "south-africa": "za",
  "south-korea": "kr",
  "czech-republic": "cz",
  canada: "ca",
  "bosnia-herzegovina": "ba",
  qatar: "qa",
  switzerland: "ch",
  brazil: "br",
  morocco: "ma",
  haiti: "ht",
  scotland: "gb-sct",
  "united-states": "us",
  paraguay: "py",
  australia: "au",
  turkey: "tr",
  germany: "de",
  curacao: "cw",
  "ivory-coast": "ci",
  ecuador: "ec",
  netherlands: "nl",
  japan: "jp",
  sweden: "se",
  tunisia: "tn",
  belgium: "be",
  egypt: "eg",
  iran: "ir",
  "new-zealand": "nz",
  spain: "es",
  "cabo-verde": "cv",
  "saudi-arabia": "sa",
  uruguay: "uy",
  france: "fr",
  senegal: "sn",
  iraq: "iq",
  norway: "no",
  argentina: "ar",
  algeria: "dz",
  austria: "at",
  jordan: "jo",
  portugal: "pt",
  "dr-congo": "cd",
  uzbekistan: "uz",
  colombia: "co",
  england: "gb-eng",
  croatia: "hr",
  ghana: "gh",
  panama: "pa",
};

export function flagCodeForTeam(slug: string): string | null {
  return FLAG_BY_SLUG[slug] ?? null;
}

export function flagUrl(slug: string, width = 40): string | null {
  const code = flagCodeForTeam(slug);
  if (!code) return null;
  return `https://flagcdn.com/w${width}/${code}.png`;
}
