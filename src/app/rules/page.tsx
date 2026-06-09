import { formatDeadlineET } from "@/lib/dates";
import {
  MAX_GROUP_POINTS,
  MAX_KNOCKOUT_POINTS,
  MAX_TOTAL_POINTS,
} from "@/lib/scoring";

const GROUP_DEADLINE = "2026-06-11T19:00:00Z";

export default function RulesPage() {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert">
      <h1>Pool Rules</h1>

      <h2>How to enter</h2>
      <p>
        Sign up on the home page with your first name, last name, and a
        password. Log in with the same name and password on any device to access
        your picks. Contact the pool admin if you forget your password.
      </p>

      <h2>Group stage picks</h2>
      <ul>
        <li>Rank all 4 teams in each of the 12 groups (1st through 4th).</li>
        <li>Picks auto-save as you drag to reorder.</li>
        <li>
          Deadline: <strong>{formatDeadlineET(GROUP_DEADLINE)} ET</strong>
        </li>
        <li>After the deadline, group picks are permanently locked.</li>
      </ul>

      <h2>Group stage scoring</h2>
      <ul>
        <li>Correct 1st place: 3 points</li>
        <li>Correct 2nd place: 3 points</li>
        <li>Correct 3rd place: 2 points</li>
        <li>Correct 4th place: 2 points</li>
        <li>Maximum: {MAX_GROUP_POINTS} points (10 per group)</li>
      </ul>

      <h2>Knockout stage picks</h2>
      <ul>
        <li>Available after the admin publishes the knockout bracket.</li>
        <li>Pick the winner of all 31 knockout matches.</li>
        <li>
          Enter a tiebreaker: total goals scored in all knockout matches
          (excluding penalty shootouts).
        </li>
        <li>Knockout deadline is set by the admin.</li>
      </ul>

      <h2>Knockout scoring</h2>
      <ul>
        <li>Round of 32: 2 points per match (16 matches)</li>
        <li>Round of 16: 3 points per match (8 matches)</li>
        <li>Quarterfinals: 5 points per match (4 matches)</li>
        <li>Semifinals: 7 points per match (2 matches)</li>
        <li>Final: 10 points (1 match)</li>
        <li>Maximum: {MAX_KNOCKOUT_POINTS} points</li>
      </ul>

      <h2>Total points</h2>
      <p>Maximum possible score: {MAX_TOTAL_POINTS} points.</p>

      <h2>Tiebreaker</h2>
      <p>
        If players are tied on points, the entry closest to the actual total
        knockout goals wins. If still tied, entries share the rank.
      </p>

      <h2>Leaderboard</h2>
      <p>
        Hidden until the group stage deadline passes, then visible to everyone.
        Shows max possible remaining points for each entry.
      </p>
    </div>
  );
}
