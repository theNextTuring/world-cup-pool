"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GroupPicker } from "@/components/GroupPicker";
import { SaveIndicator } from "@/components/SaveIndicator";
import { formatDeadlineET } from "@/lib/dates";
import { GROUP_CODES, GROUPS } from "@/lib/teams";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function GroupsPage() {
  const router = useRouter();
  const [entryName, setEntryName] = useState("");
  const [rankings, setRankings] = useState<Record<string, string[]>>({});
  const [savedGroups, setSavedGroups] = useState<Set<string>>(new Set());
  const [locked, setLocked] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [submitting, setSubmitting] = useState(false);
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

  const allRankings = useMemo(() => {
    const map: Record<string, string[]> = { ...initialRankings };
    for (const code of GROUP_CODES) {
      if (rankings[code]) {
        map[code] = rankings[code];
      }
    }
    return map;
  }, [initialRankings, rankings]);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, picksRes, settingsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/picks/group"),
          fetch("/api/settings"),
        ]);

        if (meRes.status === 401) {
          router.replace("/");
          return;
        }

        const meData = await meRes.json();
        const picksData = await picksRes.json();
        const settingsData = await settingsRes.json();

        if (meRes.ok) {
          setEntryName(meData.user.entryName);
        }

        const merged = { ...initialRankings };
        const saved = new Set<string>();
        for (const pick of picksData.picks ?? []) {
          merged[pick.group_code] = [
            pick.rank1_team,
            pick.rank2_team,
            pick.rank3_team,
            pick.rank4_team,
          ];
          saved.add(pick.group_code);
        }
        setRankings(merged);
        setSavedGroups(saved);

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
      if (locked) return;
      setSaveState("saving");
      try {
        const response = await fetch("/api/picks/group", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupCode, ranking }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? "Save failed");
        }
        setSavedGroups((prev) => new Set(prev).add(groupCode));
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    [locked],
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
    setSavedGroups((prev) => {
      const next = new Set(prev);
      next.delete(groupCode);
      return next;
    });
    scheduleSave(groupCode, ranking);
  }

  async function submitAll() {
    if (locked) return;
    setSubmitting(true);
    setSaveState("saving");
    try {
      const response = await fetch("/api/picks/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rankings: allRankings }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Submit failed");
      }
      setSavedGroups(new Set(GROUP_CODES));
      setSaveState("saved");
    } catch {
      setSaveState("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-zinc-500">Loading your picks…</p>;
  }

  const savedCount = savedGroups.size;
  const allSaved = savedCount === 12;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Group Stage Picks</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            On phones, use ↑ and ↓ to rank teams. On desktop, drag teams into
            order. Changes auto-save when you reorder.
            {entryName && (
              <span className="ml-2 font-medium">Entry: {entryName}</span>
            )}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Deadline: {formatDeadlineET(deadline)} ET
          </p>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            Happy with the default order? You still need to{" "}
            <strong>Submit all picks</strong> so groups you didn&apos;t touch
            get saved too.
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
        {savedCount} of 12 groups saved to server
        {!allSaved && " · submit to save the rest"}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {GROUPS.map((group) => (
          <GroupPicker
            key={group.code}
            groupCode={group.code}
            teams={group.teams}
            ranking={allRankings[group.code]}
            locked={locked}
            saved={savedGroups.has(group.code)}
            onChange={(ranking) => handleChange(group.code, ranking)}
          />
        ))}
      </div>

      {!locked && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {allSaved
                ? "All 12 groups saved."
                : `${12 - savedCount} group(s) not saved yet`}
            </p>
            <button
              type="button"
              onClick={submitAll}
              disabled={submitting}
              className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60 sm:w-auto sm:py-2.5"
            >
              {submitting ? "Submitting…" : "Submit all picks"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
