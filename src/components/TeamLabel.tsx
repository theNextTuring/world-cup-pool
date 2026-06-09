import Image from "next/image";
import { flagUrl } from "@/lib/flags";
import { teamName } from "@/lib/teams";

export function TeamFlag({
  slug,
  size = 28,
}: {
  slug: string;
  size?: number;
}) {
  const src = flagUrl(slug, size <= 20 ? 20 : size <= 40 ? 40 : 80);
  if (!src) return null;

  const height = Math.round(size * 0.67);

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={height}
      className="shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-black/5"
    />
  );
}

export function TeamLabel({
  slug,
  flagSize = 28,
  className = "",
}: {
  slug: string;
  flagSize?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <TeamFlag slug={slug} size={flagSize} />
      <span>{teamName(slug)}</span>
    </span>
  );
}
