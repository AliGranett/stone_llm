import type { Affinity } from "../../types";
import { AFFINITY_META } from "../../config/affinities";

interface AffinityIconProps {
  affinity: Affinity;
  size?: number;
  /** Defaults to currentColor so icons inherit surrounding text color. */
  color?: string;
}

/**
 * Inline SVG icons for each affinity. Icons are decorative on their own —
 * every usage sits next to a text label, and aria-hidden keeps screen
 * readers from double-announcing.
 */
export function AffinityIcon({ affinity, size = 20, color = "currentColor" }: AffinityIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
  };

  switch (affinity) {
    case "TIDE":
      // Wave
      return (
        <svg {...common} role="presentation">
          <path d="M2 12c1.7-2 3.3-2 5 0s3.3 2 5 0 3.3-2 5-0 3.3 2 5 0" />
          <path d="M2 17c1.7-2 3.3-2 5 0s3.3 2 5 0 3.3-2 5 0 3.3 2 5 0" />
        </svg>
      );
    case "EMBER":
      // Flame
      return (
        <svg {...common} role="presentation">
          <path d="M12 3c1 3-3 4.5-3 8a3 3 0 0 0 6 0c0-1.2-.5-2.2-1-3 2.5 1 4 3.2 4 6a6 6 0 0 1-12 0c0-5 4.5-7 6-11z" />
        </svg>
      );
    case "GALE":
      // Wind
      return (
        <svg {...common} role="presentation">
          <path d="M3 8h10a2.5 2.5 0 1 0-2.5-2.5" />
          <path d="M3 12h15a2.5 2.5 0 1 1-2.5 2.5" />
          <path d="M3 16h8a2 2 0 1 1-2 2" />
        </svg>
      );
    case "GROVE":
      // Leaf
      return (
        <svg {...common} role="presentation">
          <path d="M6 18C6 9 12 5 20 4c0 9-4 14-12 14z" />
          <path d="M6 18c2-4 5-7 9-9" />
          <path d="M6 18l-2 3" />
        </svg>
      );
  }
}

/** Convenience wrapper rendering the icon in the affinity's primary color. */
export function ColoredAffinityIcon({ affinity, size }: { affinity: Affinity; size?: number }) {
  return <AffinityIcon affinity={affinity} size={size} color={AFFINITY_META[affinity].primary} />;
}
