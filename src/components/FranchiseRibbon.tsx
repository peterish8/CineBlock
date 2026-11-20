import type { FranchiseMetadata } from "@/lib/franchises";

interface FranchiseRibbonProps {
  /** The film's franchise badge, or undefined when it isn't part of one. */
  badge: FranchiseMetadata | undefined;
  /** "corner" is the diagonal poster ribbon; "tag" is the small flat label used on mobile. */
  variant: "corner" | "corner-large" | "tag";
}

/** Franchise marker on a release poster. Renders nothing for non-franchise films. */
export default function FranchiseRibbon({ badge, variant }: FranchiseRibbonProps) {
  if (!badge) {
    return null;
  }
  if (variant === "tag") {
    return (
      <div
        className={`absolute left-0 top-0 z-10 border-b-2 border-r-2 px-1.5 py-0.5 font-mono text-[7px] font-black uppercase tracking-tighter text-white ${badge.color} ${badge.borderColor}`}
      >
        {badge.name}
      </div>
    );
  }
  const large = variant === "corner-large";
  return (
    <div className={`pointer-events-none absolute right-0 top-0 z-20 overflow-hidden ${large ? "h-20 w-20" : "h-16 w-16"}`}>
      <div
        className={`absolute rotate-45 border-y-2 text-center font-mono font-black uppercase tracking-widest text-white shadow-sm ${
          large ? "-right-6 top-4 w-[120px] py-1 text-[8px]" : "-right-5 top-3 w-[100px] py-0.5 text-[7px]"
        } ${badge.color} ${badge.borderColor}`}
      >
        {badge.name}
      </div>
    </div>
  );
}
