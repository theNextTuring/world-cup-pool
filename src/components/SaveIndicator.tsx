type SaveState = "idle" | "saving" | "saved" | "error";

export function SaveIndicator({ state }: { state: SaveState }) {
  const label =
    state === "saving"
      ? "Saving…"
      : state === "saved"
        ? "Saved"
        : state === "error"
          ? "Save failed"
          : "";

  if (!label) return null;

  const color =
    state === "error"
      ? "text-red-600 dark:text-red-400"
      : state === "saved"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-zinc-500";

  return (
    <span className={`text-sm font-medium ${color}`} aria-live="polite">
      {label}
    </span>
  );
}
