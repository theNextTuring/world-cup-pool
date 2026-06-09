"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TeamFlag } from "@/components/TeamLabel";
import type { Team } from "@/lib/teams";

function SortableTeam({
  team,
  position,
  disabled,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  team: Team;
  position: number;
  disabled: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: team.slug, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border px-3 py-3 sm:px-4 ${
        isDragging
          ? "border-emerald-400 bg-emerald-50 shadow-md dark:bg-emerald-950/30"
          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
      } ${disabled ? "opacity-70" : ""}`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold dark:bg-zinc-800">
        {position}
      </span>
      <TeamFlag slug={team.slug} size={28} />
      <span className="min-w-0 flex-1 font-medium">{team.name}</span>
      {!disabled && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-base font-semibold text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-30 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:hidden"
            aria-label={`Move ${team.name} up`}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-base font-semibold text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-30 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:hidden"
            aria-label={`Move ${team.name} down`}
          >
            ↓
          </button>
          <button
            type="button"
            className="hidden cursor-grab rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 active:cursor-grabbing dark:hover:bg-zinc-800 sm:block"
            aria-label={`Drag to reorder ${team.name}`}
            {...attributes}
            {...listeners}
          >
            Drag
          </button>
        </div>
      )}
    </div>
  );
}

export function GroupPicker({
  groupCode,
  teams,
  ranking,
  locked,
  saved = false,
  onChange,
}: {
  groupCode: string;
  teams: Team[];
  ranking: string[];
  locked: boolean;
  saved?: boolean;
  onChange: (ranking: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const orderedTeams = ranking
    .map((slug) => teams.find((t) => t.slug === slug))
    .filter((t): t is Team => Boolean(t));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ranking.indexOf(String(active.id));
    const newIndex = ranking.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    onChange(arrayMove(ranking, oldIndex, newIndex));
  }

  function moveTeam(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= ranking.length) return;
    onChange(arrayMove(ranking, index, newIndex));
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Group {groupCode}</h3>
        {saved ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            Saved
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            Not saved
          </span>
        )}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={ranking}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {orderedTeams.map((team, index) => (
              <SortableTeam
                key={team.slug}
                team={team}
                position={index + 1}
                disabled={locked}
                canMoveUp={index > 0}
                canMoveDown={index < orderedTeams.length - 1}
                onMoveUp={() => moveTeam(index, -1)}
                onMoveDown={() => moveTeam(index, 1)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
