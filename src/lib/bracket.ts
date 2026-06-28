import type { KnockoutMatch, KnockoutRound } from "@/lib/supabase";
import { teamName } from "@/lib/teams";

export const WINNER_SLOT_PREFIX = "winner:";

export type BracketTemplateMatch = {
  round: KnockoutRound;
  matchNumber: number;
  teamA: string;
  teamB: string;
};

export type MatchParticipantOption = {
  slot: string;
  slotLabel: string | null;
  value: string | null;
};

export const OFFICIAL_R32_MATCH_SLOTS = [
  { matchNumber: 73, teamA: "Runner-up Group A", teamB: "Runner-up Group B" },
  { matchNumber: 74, teamA: "Winner Group E", teamB: "3rd Group A/B/C/D/F" },
  { matchNumber: 75, teamA: "Winner Group F", teamB: "Runner-up Group C" },
  { matchNumber: 76, teamA: "Winner Group C", teamB: "Runner-up Group F" },
  { matchNumber: 77, teamA: "Winner Group I", teamB: "3rd Group C/D/F/G/H" },
  { matchNumber: 78, teamA: "Runner-up Group E", teamB: "Runner-up Group I" },
  { matchNumber: 79, teamA: "Winner Group A", teamB: "3rd Group C/E/F/H/I" },
  { matchNumber: 80, teamA: "Winner Group L", teamB: "3rd Group E/H/I/J/K" },
  { matchNumber: 81, teamA: "Winner Group D", teamB: "3rd Group B/E/F/I/J" },
  { matchNumber: 82, teamA: "Winner Group G", teamB: "3rd Group A/E/H/I/J" },
  { matchNumber: 83, teamA: "Runner-up Group K", teamB: "Runner-up Group L" },
  { matchNumber: 84, teamA: "Winner Group H", teamB: "Runner-up Group J" },
  { matchNumber: 85, teamA: "Winner Group B", teamB: "3rd Group E/F/G/I/J" },
  { matchNumber: 86, teamA: "Winner Group J", teamB: "Runner-up Group H" },
  { matchNumber: 87, teamA: "Winner Group K", teamB: "3rd Group D/E/I/J/L" },
  { matchNumber: 88, teamA: "Runner-up Group D", teamB: "Runner-up Group G" },
] as const;

export const OFFICIAL_R32_KNOCKOUT_MATCHES: BracketTemplateMatch[] = [
  { round: "r32", matchNumber: 73, teamA: "south-africa", teamB: "canada" },
  { round: "r32", matchNumber: 74, teamA: "germany", teamB: "paraguay" },
  { round: "r32", matchNumber: 75, teamA: "netherlands", teamB: "morocco" },
  { round: "r32", matchNumber: 76, teamA: "brazil", teamB: "japan" },
  { round: "r32", matchNumber: 77, teamA: "france", teamB: "sweden" },
  { round: "r32", matchNumber: 78, teamA: "ivory-coast", teamB: "norway" },
  { round: "r32", matchNumber: 79, teamA: "mexico", teamB: "ecuador" },
  { round: "r32", matchNumber: 80, teamA: "england", teamB: "dr-congo" },
  { round: "r32", matchNumber: 81, teamA: "united-states", teamB: "bosnia-herzegovina" },
  { round: "r32", matchNumber: 82, teamA: "belgium", teamB: "senegal" },
  { round: "r32", matchNumber: 83, teamA: "portugal", teamB: "croatia" },
  { round: "r32", matchNumber: 84, teamA: "spain", teamB: "austria" },
  { round: "r32", matchNumber: 85, teamA: "switzerland", teamB: "algeria" },
  { round: "r32", matchNumber: 86, teamA: "argentina", teamB: "cabo-verde" },
  { round: "r32", matchNumber: 87, teamA: "colombia", teamB: "ghana" },
  { round: "r32", matchNumber: 88, teamA: "australia", teamB: "egypt" },
];

export const OFFICIAL_FUTURE_KNOCKOUT_MATCHES: BracketTemplateMatch[] = [
  { round: "r16", matchNumber: 89, teamA: winnerSlot(73), teamB: winnerSlot(75) },
  { round: "r16", matchNumber: 90, teamA: winnerSlot(74), teamB: winnerSlot(77) },
  { round: "r16", matchNumber: 91, teamA: winnerSlot(76), teamB: winnerSlot(78) },
  { round: "r16", matchNumber: 92, teamA: winnerSlot(79), teamB: winnerSlot(80) },
  { round: "r16", matchNumber: 93, teamA: winnerSlot(83), teamB: winnerSlot(84) },
  { round: "r16", matchNumber: 94, teamA: winnerSlot(81), teamB: winnerSlot(82) },
  { round: "r16", matchNumber: 95, teamA: winnerSlot(86), teamB: winnerSlot(88) },
  { round: "r16", matchNumber: 96, teamA: winnerSlot(85), teamB: winnerSlot(87) },
  { round: "qf", matchNumber: 97, teamA: winnerSlot(89), teamB: winnerSlot(90) },
  { round: "qf", matchNumber: 98, teamA: winnerSlot(93), teamB: winnerSlot(94) },
  { round: "qf", matchNumber: 99, teamA: winnerSlot(91), teamB: winnerSlot(92) },
  { round: "qf", matchNumber: 100, teamA: winnerSlot(95), teamB: winnerSlot(96) },
  { round: "sf", matchNumber: 101, teamA: winnerSlot(97), teamB: winnerSlot(98) },
  { round: "sf", matchNumber: 102, teamA: winnerSlot(99), teamB: winnerSlot(100) },
  { round: "final", matchNumber: 104, teamA: winnerSlot(101), teamB: winnerSlot(102) },
];

export const OFFICIAL_KNOCKOUT_MATCHES: BracketTemplateMatch[] = [
  ...OFFICIAL_R32_KNOCKOUT_MATCHES,
  ...OFFICIAL_FUTURE_KNOCKOUT_MATCHES,
];

export function matchesUseOfficialBracket(matches: KnockoutMatch[]): boolean {
  if (matches.length !== OFFICIAL_KNOCKOUT_MATCHES.length) return false;

  const matchByNumber = new Map(
    matches.map((match) => [match.match_number, match]),
  );

  return OFFICIAL_KNOCKOUT_MATCHES.every((expected) => {
    const match = matchByNumber.get(expected.matchNumber);
    return (
      match?.round === expected.round &&
      match.team_a === expected.teamA &&
      match.team_b === expected.teamB
    );
  });
}

export function winnerSlot(matchNumber: number): string {
  return `${WINNER_SLOT_PREFIX}${matchNumber}`;
}

export function isWinnerSlot(value: string): boolean {
  return value.startsWith(WINNER_SLOT_PREFIX);
}

export function winnerSlotMatchNumber(value: string): number | null {
  if (!isWinnerSlot(value)) return null;
  const matchNumber = Number(value.slice(WINNER_SLOT_PREFIX.length));
  return Number.isInteger(matchNumber) ? matchNumber : null;
}

export function participantName(value: string): string {
  const sourceMatch = winnerSlotMatchNumber(value);
  if (sourceMatch !== null) return `Winner Match ${sourceMatch}`;
  return teamName(value);
}

export function matchWinnerMap(matches: KnockoutMatch[]): Record<string, string> {
  return Object.fromEntries(
    matches.flatMap((match) => (match.winner ? [[match.id, match.winner]] : [])),
  );
}

export function participantOptionsForMatch(
  matches: KnockoutMatch[],
  selections: Record<string, string>,
  match: KnockoutMatch,
): MatchParticipantOption[] {
  return [
    resolveParticipant(matches, selections, match.team_a, new Set()),
    resolveParticipant(matches, selections, match.team_b, new Set()),
  ];
}

export function validPickCount(
  matches: KnockoutMatch[],
  selections: Record<string, string>,
): number {
  return matches.filter((match) => isSelectionValid(matches, selections, match))
    .length;
}

export function isSelectionValid(
  matches: KnockoutMatch[],
  selections: Record<string, string>,
  match: KnockoutMatch,
): boolean {
  const selected = selections[match.id];
  if (!selected) return false;
  return participantOptionsForMatch(matches, selections, match).some(
    (option) => option.value === selected,
  );
}

function resolveParticipant(
  matches: KnockoutMatch[],
  selections: Record<string, string>,
  slot: string,
  visited: Set<number>,
): MatchParticipantOption {
  const sourceMatchNumber = winnerSlotMatchNumber(slot);
  if (sourceMatchNumber === null) {
    return { slot, slotLabel: null, value: slot };
  }

  const slotLabel = `Winner Match ${sourceMatchNumber}`;
  if (visited.has(sourceMatchNumber)) {
    return { slot, slotLabel, value: null };
  }

  const sourceMatch = matches.find(
    (match) => match.match_number === sourceMatchNumber,
  );
  if (!sourceMatch) {
    return { slot, slotLabel, value: null };
  }

  const selected = selections[sourceMatch.id];
  if (!selected) {
    return { slot, slotLabel, value: null };
  }

  const nextVisited = new Set(visited);
  nextVisited.add(sourceMatchNumber);
  const sourceOptions = [
    resolveParticipant(matches, selections, sourceMatch.team_a, nextVisited),
    resolveParticipant(matches, selections, sourceMatch.team_b, nextVisited),
  ];

  if (!sourceOptions.some((option) => option.value === selected)) {
    return { slot, slotLabel, value: null };
  }

  return { slot, slotLabel, value: selected };
}
