export type Team = {
  slug: string;
  name: string;
};

export type Group = {
  code: string;
  teams: Team[];
};

export const GROUPS: Group[] = [
  {
    code: "A",
    teams: [
      { slug: "mexico", name: "Mexico" },
      { slug: "south-africa", name: "South Africa" },
      { slug: "south-korea", name: "South Korea" },
      { slug: "czech-republic", name: "Czech Republic" },
    ],
  },
  {
    code: "B",
    teams: [
      { slug: "canada", name: "Canada" },
      { slug: "bosnia-herzegovina", name: "Bosnia and Herzegovina" },
      { slug: "qatar", name: "Qatar" },
      { slug: "switzerland", name: "Switzerland" },
    ],
  },
  {
    code: "C",
    teams: [
      { slug: "brazil", name: "Brazil" },
      { slug: "morocco", name: "Morocco" },
      { slug: "haiti", name: "Haiti" },
      { slug: "scotland", name: "Scotland" },
    ],
  },
  {
    code: "D",
    teams: [
      { slug: "united-states", name: "United States" },
      { slug: "paraguay", name: "Paraguay" },
      { slug: "australia", name: "Australia" },
      { slug: "turkey", name: "Turkey (Türkiye)" },
    ],
  },
  {
    code: "E",
    teams: [
      { slug: "germany", name: "Germany" },
      { slug: "curacao", name: "Curaçao" },
      { slug: "ivory-coast", name: "Ivory Coast" },
      { slug: "ecuador", name: "Ecuador" },
    ],
  },
  {
    code: "F",
    teams: [
      { slug: "netherlands", name: "Netherlands" },
      { slug: "japan", name: "Japan" },
      { slug: "sweden", name: "Sweden" },
      { slug: "tunisia", name: "Tunisia" },
    ],
  },
  {
    code: "G",
    teams: [
      { slug: "belgium", name: "Belgium" },
      { slug: "egypt", name: "Egypt" },
      { slug: "iran", name: "Iran" },
      { slug: "new-zealand", name: "New Zealand" },
    ],
  },
  {
    code: "H",
    teams: [
      { slug: "spain", name: "Spain" },
      { slug: "cabo-verde", name: "Cabo Verde" },
      { slug: "saudi-arabia", name: "Saudi Arabia" },
      { slug: "uruguay", name: "Uruguay" },
    ],
  },
  {
    code: "I",
    teams: [
      { slug: "france", name: "France" },
      { slug: "senegal", name: "Senegal" },
      { slug: "iraq", name: "Iraq" },
      { slug: "norway", name: "Norway" },
    ],
  },
  {
    code: "J",
    teams: [
      { slug: "argentina", name: "Argentina" },
      { slug: "algeria", name: "Algeria" },
      { slug: "austria", name: "Austria" },
      { slug: "jordan", name: "Jordan" },
    ],
  },
  {
    code: "K",
    teams: [
      { slug: "portugal", name: "Portugal" },
      { slug: "dr-congo", name: "DR Congo" },
      { slug: "uzbekistan", name: "Uzbekistan" },
      { slug: "colombia", name: "Colombia" },
    ],
  },
  {
    code: "L",
    teams: [
      { slug: "england", name: "England" },
      { slug: "croatia", name: "Croatia" },
      { slug: "ghana", name: "Ghana" },
      { slug: "panama", name: "Panama" },
    ],
  },
];

export const GROUP_CODES = GROUPS.map((g) => g.code);

export const TEAM_BY_SLUG = Object.fromEntries(
  GROUPS.flatMap((g) => g.teams.map((t) => [t.slug, t] as const)),
) as Record<string, Team>;

export function teamName(slug: string): string {
  return TEAM_BY_SLUG[slug]?.name ?? slug;
}

export function teamsForGroup(code: string): Team[] {
  return GROUPS.find((g) => g.code === code)?.teams ?? [];
}

export function isValidGroupRanking(code: string, ranking: string[]): boolean {
  const expected = teamsForGroup(code).map((t) => t.slug);
  if (ranking.length !== 4) return false;
  const sorted = [...ranking].sort();
  const expectedSorted = [...expected].sort();
  return sorted.every((slug, i) => slug === expectedSorted[i]);
}
