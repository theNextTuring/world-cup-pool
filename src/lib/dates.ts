export function formatDeadlineET(iso: string | null): string {
  if (!iso) return "Not set";
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "full",
    timeStyle: "short",
  });
}
