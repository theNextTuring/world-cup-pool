"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GroupPicker } from "@/components/GroupPicker";
import { SaveIndicator } from "@/components/SaveIndicator";
import { getStoredUserId } from "@/lib/client";
import { formatDeadlineET } from "@/lib/dates";
import { GROUPS } from "@/lib/teams";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function GroupsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [entryName, setEntryName] = useState("");
  const [rankings, setRankings] = useState<Record<string, string[]>>({});
  const [locked, setLocked] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loading, setLoading] = useState(true);
  const pendingRef = useRef<Record<string, string[]>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialRankings = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const group of GROUPS) {
      map[group.code] = group.teams.map((t) => t.slug);
    }
    return map;
  }, []);

  useEffect(() => {
    const id = getStoredUserId();
    if (!id) {
      router.replace("/");
      return;
    }
    setUserId(id);

    async function load() {
      try {
        const [userRes, picksRes, settingsRes] = await Promise.all([
          fetch(`/api/users?userId=${id}`),
          fetch(`/api/picks/group?userId=${id}`),
          fetch("/api/settings"),
        ]);

        const userData = await userRes.json();
        const picksData = await picksRes.json();
        const settingsData = await settingsRes.json();

        if (userRes.ok) {
          setEntryName(userData.user.entry_name);
        }

        const merged = { ...initialRankings };
        for (const pick of picksData.picks ?? []) {
          merged[pick.group_code] = [
            pick.rank1_team,
            pick.rank2_team,
            pick.rank3_team,
            pick.rank4_team,
          ];
        }
        setRankings(merged);

        if (settingsRes.ok) {
          setLocked(settingsData.locks.groupStageLocked);
          setDeadline(settingsData.locks.groupDeadline);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router, initialRankings]);

  const flushSave = useCallback(
    async (groupCode: string, ranking: string[]) => {
      if (!userId || locked) return;
      setSaveState("saving");
      try {
        const response = await fetch("/api/picks/group", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, groupCode, ranking }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? "Save failed");
        }
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    [userId, locked],
  );

  const scheduleSave = useCallback(
    (groupCode: string, ranking: string[]) => {
      pendingRef.current[groupCode] = ranking;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const pending = { ...pendingRef.current };
        pendingRef.current = {};
        for (const [code, ranks] of Object.entries(pending)) {
          void flushSave(code, ranks);
        }
      }, 500);
    },
    [flushSave],
  );

  function handleChange(groupCode: string, ranking: string[]) {
    setRankings((prev) => ({ ...prev, [groupCode]: ranking }));
    scheduleSave(groupCode, ranking);
  }

  if (loading) {
    return <p className="text-zinc-500">Loading your picks…</p>;
  }

  const completedGroups = Object.keys(rankings).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Group Stage Picks</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Drag teams to rank 1st through 4th in each group.
            {entryName && (
              <span className="ml-2 font-medium">Entry: {entryName}</span>
            )}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Deadline: {formatDeadlineET(deadline)} ET
          </p>
        </div>
        <SaveIndicator state={saveState} />
      </div>

      {locked && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
          Group stage picks are locked. Your submissions are now final.
        </div>
      )}

      <p className="text-sm text-zinc-500">
        {completedGroups} of 12 groups ranked
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {GROUPS.map((group) => (
          <GroupPicker
            key={group.code}
            groupCode={group.code}
            teams={group.teams}
            ranking={rankings[group.code] ?? group.teams.map((t) => t.slug)}
            locked={locked}
            onChange={(ranking) => handleChange(group.code, ranking)}
          />
        ))}
      </div>
    </div>
  );
}
