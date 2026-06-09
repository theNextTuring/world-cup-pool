import Link from "next/link";
import { formatDeadlineET } from "@/lib/dates";
import {
  MAX_GROUP_POINTS,
  MAX_KNOCKOUT_POINTS,
  MAX_TOTAL_POINTS,
} from "@/lib/scoring";

const GROUP_DEADLINE = "2026-06-11T19:00:00Z";

function RuleCard({
  title,
  children,
  accent = "emerald",
}: {
  title: string;
  children: React.ReactNode;
  accent?: "emerald" | "blue" | "amber" | "violet";
}) {
  const accentStyles = {
    emerald: "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30",
    blue: "border-blue-200 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/30",
    amber: "border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30",
    violet: "border-violet-200 bg-violet-50/80 dark:border-violet-900 dark:bg-violet-950/30",
  };

  const dotStyles = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500",
  };

  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 ${accentStyles[accent]}`}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotStyles[accent]}`} />
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {children}
      </div>
    </section>
  );
}

function PointRow({
  label,
  points,
  detail,
}: {
  label: string;
  points: string;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 dark:bg-zinc-900/50">
      <div>
        <p className="font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
        {detail && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{detail}</p>
        )}
      </div>
      <span className="shrink-0 rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
        {points}
      </span>
    </div>
  );
}

export default function RulesPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-8 text-white shadow-lg sm:px-8">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-100">
          World Cup Pool 2026
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          How it works
        </h1>
        <p className="mt-3 max-w-2xl text-emerald-50">
          Rank every group, pick the knockout bracket, and climb the leaderboard.
          Everything auto-saves. Here&apos;s all you need to know in one place.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
          >
            Log in / Sign up
          </Link>
          <Link
            href="/groups"
            className="rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Make picks
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-3xl font-bold text-emerald-600">{MAX_TOTAL_POINTS}</p>
          <p className="mt-1 text-sm text-zinc-500">Max total points</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-3xl font-bold text-emerald-600">12</p>
          <p className="mt-1 text-sm text-zinc-500">Groups to rank</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-3xl font-bold text-emerald-600">31</p>
          <p className="mt-1 text-sm text-zinc-500">Knockout matches</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RuleCard title="Join the pool" accent="blue">
          <p>
            Sign up with your <strong>first name</strong>,{" "}
            <strong>last name</strong>, and a <strong>password</strong>.
          </p>
          <p>
            Log in anytime on any device with the same info. Forgot your
            password? Contact the pool admin for a reset.
          </p>
        </RuleCard>

        <RuleCard title="Group stage" accent="emerald">
          <p>Drag teams to rank 1st → 4th in all 12 groups.</p>
          <p>Reordered groups auto-save. Click <strong>Submit all picks</strong> to save every group — even ones you left in the default order.</p>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            Deadline: {formatDeadlineET(GROUP_DEADLINE)} ET
          </p>
          <p>After the deadline, group picks lock permanently.</p>
        </RuleCard>

        <RuleCard title="Knockout stage" accent="amber">
          <p>Opens after the admin publishes the bracket.</p>
          <p>Pick the winner of all 31 knockout matches.</p>
          <p>
            Enter your <strong>tiebreaker</strong>: total goals in all knockout
            games (penalty shootouts don&apos;t count).
          </p>
          <p>Knockout deadline is set by the admin.</p>
        </RuleCard>

        <RuleCard title="Leaderboard & ties" accent="violet">
          <p>Hidden until the group deadline passes, then public for everyone.</p>
          <p>
            Tied on points? Closest tiebreaker guess to the actual total knockout
            goals wins.
          </p>
          <p>Still tied after that? Shared rank.</p>
        </RuleCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">Group scoring</h2>
          <div className="space-y-2">
            <PointRow label="Correct 1st place" points="3 pts" />
            <PointRow label="Correct 2nd place" points="3 pts" />
            <PointRow label="Correct 3rd place" points="2 pts" />
            <PointRow label="Correct 4th place" points="2 pts" />
            <PointRow
              label="Per group max"
              points="10 pts"
              detail="12 groups"
            />
            <PointRow
              label="Group stage total"
              points={`${MAX_GROUP_POINTS} pts`}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">Knockout scoring</h2>
          <div className="space-y-2">
            <PointRow label="Round of 32" points="2 pts" detail="16 matches" />
            <PointRow label="Round of 16" points="3 pts" detail="8 matches" />
            <PointRow label="Quarterfinals" points="5 pts" detail="4 matches" />
            <PointRow label="Semifinals" points="7 pts" detail="2 matches" />
            <PointRow label="Final" points="10 pts" detail="1 match" />
            <PointRow
              label="Knockout total"
              points={`${MAX_KNOCKOUT_POINTS} pts`}
            />
          </div>
        </section>
      </div>

      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-4 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
        Questions? Reach out to the pool admin. Good luck!
      </div>
    </div>
  );
}
