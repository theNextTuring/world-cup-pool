"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDeadlineET } from "@/lib/dates";
import type { KnockoutMatch } from "@/lib/supabase";
import { GROUPS, teamName, teamsForGroup } from "@/lib/teams";

type AppSettings = {
  group_deadline: string;
  knockout_deadline: string | null;
  group_stage_locked: boolean;
  knockout_stage_locked: boolean;
  knockout_bracket_published: boolean;
  actual_total_knockout_goals: number | null;
};

type Standing = {
  group_code: string;
  rank1_team: string;
  rank2_team: string;
  rank3_team: string;
  rank4_team: string;
};

const ROUND_OPTIONS = [
  { value: "r32", label: "Round of 32" },
  { value: "r16", label: "Round of 16" },
  { value: "qf", label: "Quarterfinals" },
  { value: "sf", label: "Semifinals" },
  { value: "final", label: "Final" },
] as const;

function defaultStandings(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const group of GROUPS) {
    map[group.code] = group.teams.map((t) => t.slug);
  }
  return map;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [secret, setSecret] = useState("");
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [standings, setStandings] = useState<Record<string, string[]>>(defaultStandings);
  const [matches, setMatches] = useState<KnockoutMatch[]>([]);
  const [newMatch, setNewMatch] = useState({
    round: "r32",
    matchNumber: 1,
    teamA: "",
    teamB: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const allTeamSlugs = useMemo(
    () => GROUPS.flatMap((g) => g.teams.map((t) => t.slug)),
    [],
  );

  async function login() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      if (!response.ok) {
        throw new Error("Invalid admin secret");
      }
      setAuthenticated(true);
      await loadAdminData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadAdminData() {
    const [settingsRes, standingsRes, bracketRes] = await Promise.all([
      fetch("/api/admin/settings"),
      fetch("/api/admin/standings"),
      fetch("/api/admin/bracket"),
    ]);

    if (settingsRes.ok) {
      const data = await settingsRes.json();
      setSettings(data.settings);
    }

    if (standingsRes.ok) {
      const data = await standingsRes.json();
      const map = defaultStandings();
      for (const row of (data.standings ?? []) as Standing[]) {
        map[row.group_code] = [
          row.rank1_team,
          row.rank2_team,
          row.rank3_team,
          row.rank4_team,
        ];
      }
      setStandings(map);
    }

    if (bracketRes.ok) {
      const data = await bracketRes.json();
      setMatches(data.matches ?? []);
    }
  }

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        setAuthenticated(true);
        await loadAdminData();
      }
    })();
  }, []);

  async function saveSettings(partial: Partial<AppSettings>) {
    if (!settings) return;
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupDeadline: partial.group_deadline ?? settings.group_deadline,
        knockoutDeadline:
          partial.knockout_deadline !== undefined
            ? partial.knockout_deadline
            : settings.knockout_deadline,
        groupStageLocked:
          partial.group_stage_locked ?? settings.group_stage_locked,
        knockoutStageLocked:
          partial.knockout_stage_locked ?? settings.knockout_stage_locked,
        knockoutBracketPublished:
          partial.knockout_bracket_published ??
          settings.knockout_bracket_published,
        actualTotalKnockoutGoals:
          partial.actual_total_knockout_goals !== undefined
            ? partial.actual_total_knockout_goals
            : settings.actual_total_knockout_goals,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setSettings(data.settings);
      setMessage("Settings saved");
    } else {
      setMessage(data.error ?? "Failed to save settings");
    }
  }

  async function saveStanding(groupCode: string) {
    const ranking = standings[groupCode];
    const response = await fetch("/api/admin/standings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupCode, ranking }),
    });
    const data = await response.json();
    setMessage(response.ok ? `Saved group ${groupCode}` : data.error);
  }

  function updateStandingRank(
    groupCode: string,
    index: number,
    slug: string,
  ) {
    setStandings((prev) => {
      const next = [...prev[groupCode]];
      next[index] = slug;
      return { ...prev, [groupCode]: next };
    });
  }

  function addMatchToDraft() {
    if (!newMatch.teamA || !newMatch.teamB || newMatch.teamA === newMatch.teamB) {
      setMessage("Select two different teams");
      return;
    }
    setMatches((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        round: newMatch.round as KnockoutMatch["round"],
        match_number: newMatch.matchNumber,
        team_a: newMatch.teamA,
        team_b: newMatch.teamB,
        winner: null,
      },
    ]);
    setNewMatch((prev) => ({
      ...prev,
      matchNumber: prev.matchNumber + 1,
      teamA: "",
      teamB: "",
    }));
  }

  async function saveBracket() {
    const response = await fetch("/api/admin/bracket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matches: matches.map((m) => ({
          round: m.round,
          matchNumber: m.match_number,
          teamA: m.team_a,
          teamB: m.team_b,
          winner: m.winner,
        })),
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setMatches(data.matches);
      setMessage("Bracket saved");
    } else {
      setMessage(data.error ?? "Failed to save bracket");
    }
  }

  async function setMatchWinner(matchId: string, winner: string | null) {
    const response = await fetch("/api/admin/bracket", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, winner }),
    });
    const data = await response.json();
    if (response.ok) {
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? data.match : m)),
      );
      setMessage("Match result saved");
    } else {
      setMessage(data.error ?? "Failed to save result");
    }
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Admin</h1>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Admin secret"
          className="w-full rounded-xl border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="button"
          onClick={login}
          disabled={loading}
          className="w-full rounded-xl bg-zinc-900 px-4 py-2 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Checking…" : "Enter"}
        </button>
        {message && <p className="text-sm text-red-600">{message}</p>}
      </div>
    );
  }

  if (!settings) {
    return <p>Loading admin panel…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        {message && <p className="text-sm text-emerald-600">{message}</p>}
      </div>

      <section className="space-y-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Deadlines & Locks</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Group deadline (ISO UTC)
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={settings.group_deadline}
              onChange={(e) =>
                setSettings({ ...settings, group_deadline: e.target.value })
              }
            />
            <span className="text-xs text-zinc-500">
              {formatDeadlineET(settings.group_deadline)} ET
            </span>
          </label>
          <label className="text-sm">
            Knockout deadline (ISO UTC)
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={settings.knockout_deadline ?? ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  knockout_deadline: e.target.value || null,
                })
              }
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.group_stage_locked}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  group_stage_locked: e.target.checked,
                })
              }
            />
            Force lock group stage
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.knockout_stage_locked}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  knockout_stage_locked: e.target.checked,
                })
              }
            />
            Force lock knockout
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.knockout_bracket_published}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  knockout_bracket_published: e.target.checked,
                })
              }
            />
            Publish knockout bracket
          </label>
        </div>
        <label className="block text-sm">
          Actual total knockout goals (tiebreaker)
          <input
            type="number"
            min={0}
            className="mt-1 w-full max-w-xs rounded-lg border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={settings.actual_total_knockout_goals ?? ""}
            onChange={(e) =>
              setSettings({
                ...settings,
                actual_total_knockout_goals:
                  e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </label>
        <button
          type="button"
          onClick={() => saveSettings(settings)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Save settings
        </button>
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Group Standings (Results)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {GROUPS.map((group) => (
            <div
              key={group.code}
              className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700"
            >
              <h3 className="mb-2 font-medium">Group {group.code}</h3>
              {[0, 1, 2, 3].map((index) => (
                <select
                  key={index}
                  className="mb-2 w-full rounded-lg border px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  value={standings[group.code][index]}
                  onChange={(e) =>
                    updateStandingRank(group.code, index, e.target.value)
                  }
                >
                  {teamsForGroup(group.code).map((team) => (
                    <option key={team.slug} value={team.slug}>
                      {index + 1}. {team.name}
                    </option>
                  ))}
                </select>
              ))}
              <button
                type="button"
                onClick={() => saveStanding(group.code)}
                className="text-sm font-medium text-emerald-600"
              >
                Save group {group.code}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Knockout Bracket Builder</h2>
        <p className="text-sm text-zinc-500">
          Add matches, save the full bracket, then enter winners as results come
          in. ({matches.length} matches drafted)
        </p>

        <div className="grid gap-2 md:grid-cols-5">
          <select
            className="rounded-lg border px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={newMatch.round}
            onChange={(e) =>
              setNewMatch({ ...newMatch, round: e.target.value })
            }
          >
            {ROUND_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            className="rounded-lg border px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={newMatch.matchNumber}
            onChange={(e) =>
              setNewMatch({
                ...newMatch,
                matchNumber: Number(e.target.value),
              })
            }
          />
          <select
            className="rounded-lg border px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={newMatch.teamA}
            onChange={(e) =>
              setNewMatch({ ...newMatch, teamA: e.target.value })
            }
          >
            <option value="">Team A</option>
            {allTeamSlugs.map((slug) => (
              <option key={slug} value={slug}>
                {teamName(slug)}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={newMatch.teamB}
            onChange={(e) =>
              setNewMatch({ ...newMatch, teamB: e.target.value })
            }
          >
            <option value="">Team B</option>
            {allTeamSlugs.map((slug) => (
              <option key={slug} value={slug}>
                {teamName(slug)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addMatchToDraft}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Add match
          </button>
        </div>

        <div className="space-y-2">
          {matches.map((match) => (
            <div
              key={match.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
            >
              <span className="font-medium">
                {match.round.toUpperCase()} #{match.match_number}
              </span>
              <span>
                {teamName(match.team_a)} vs {teamName(match.team_b)}
              </span>
              <select
                className="rounded border px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                value={match.winner ?? ""}
                onChange={(e) =>
                  setMatchWinner(
                    match.id,
                    e.target.value ? e.target.value : null,
                  )
                }
              >
                <option value="">No winner yet</option>
                <option value={match.team_a}>{teamName(match.team_a)}</option>
                <option value={match.team_b}>{teamName(match.team_b)}</option>
              </select>
              <button
                type="button"
                className="text-red-600"
                onClick={() =>
                  setMatches((prev) => prev.filter((m) => m.id !== match.id))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={saveBracket}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Save bracket to database
        </button>
      </section>
    </div>
  );
}
