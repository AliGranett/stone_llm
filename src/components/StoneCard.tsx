import type { CSSProperties } from "react";
import { AFFINITY_META } from "../config/affinities";
import { interpolate } from "../i18n/interpolate";
import { useTranslation } from "../i18n/LocaleProvider";
import type { Stone } from "../types";
import { AffinityIcon } from "./icons/AffinityIcon";

export type SelectionSlot = "A" | "B" | null;

interface StoneCardProps {
  stone: Stone;
  selectionSlot: SelectionSlot;
  disabled?: boolean;
  onToggle?: (stoneId: string) => void;
  compact?: boolean;
}

function StoneGem({ stone, size = 64 }: { stone: Stone; size?: number }) {
  const meta = AFFINITY_META[stone.affinity];
  const style: CSSProperties = {
    width: size,
    height: size,
    background: `
      radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55), rgba(255,255,255,0) 45%),
      radial-gradient(circle at 70% 80%, rgba(0,0,0,0.25), rgba(0,0,0,0) 55%),
      linear-gradient(145deg, ${meta.primary}, ${meta.deep})
    `,
  };
  return (
    <span className="stone-gem" style={style} aria-hidden="true">
      <span className="stone-gem__facet" />
      <AffinityIcon affinity={stone.affinity} size={size * 0.42} color="rgba(255,255,255,0.95)" />
    </span>
  );
}

export function StoneCard({
  stone,
  selectionSlot,
  disabled = false,
  onToggle,
  compact = false,
}: StoneCardProps) {
  const { t } = useTranslation();
  const meta = AFFINITY_META[stone.affinity];
  const selected = selectionSlot !== null;

  const chargeLabel =
    stone.charge === "POSITIVE" ? t.charges.positive : t.charges.negative;

  const ariaDescription = interpolate(t.stones.ariaDescription, {
    affinity: t.affinities[stone.affinity],
    id: stone.id,
    strength: stone.strength,
    charge: chargeLabel,
  });

  const cardStyle = {
    "--stone-primary": meta.primary,
    "--stone-light": meta.light,
    "--stone-deep": meta.deep,
  } as CSSProperties;

  const body = (
    <>
      {selected && selectionSlot && (
        <span className="stone-card__slot-badge" aria-hidden="true">
          {interpolate(t.stones.stoneSlot, { slot: selectionSlot })}
        </span>
      )}
      <StoneGem stone={stone} size={compact ? 44 : 64} />
      <span className="stone-card__affinity">{t.affinities[stone.affinity]}</span>
      <dl className="stone-card__props">
        <div className="stone-card__prop">
          <dt>{t.stones.strength}</dt>
          <dd>
            <span className="stone-card__pips" aria-hidden="true">
              {Array.from({ length: 3 }, (_, i) => (
                <span
                  key={i}
                  className={`stone-card__pip ${i < stone.strength ? "stone-card__pip--filled" : ""}`}
                />
              ))}
            </span>
            {stone.strength}
          </dd>
        </div>
        <div className="stone-card__prop">
          <dt>{t.stones.charge}</dt>
          <dd>
            <span className="stone-card__charge-symbol" aria-hidden="true">
              {stone.charge === "POSITIVE" ? "+" : "−"}
            </span>
            {chargeLabel}
          </dd>
        </div>
      </dl>
      <span className="stone-card__id">
        {t.stones.id}: {stone.id}
      </span>
    </>
  );

  if (!onToggle) {
    return (
      <div
        className={`stone-card stone-card--static ${compact ? "stone-card--compact" : ""}`}
        style={cardStyle}
        aria-label={ariaDescription}
      >
        {body}
      </div>
    );
  }

  const ariaLabel =
    ariaDescription +
    (selected && selectionSlot
      ? interpolate(t.stones.ariaSelectedSuffix, { slot: selectionSlot })
      : "");

  return (
    <button
      type="button"
      className={`stone-card ${selected ? "stone-card--selected" : ""} ${compact ? "stone-card--compact" : ""}`}
      style={cardStyle}
      onClick={() => onToggle(stone.id)}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={ariaLabel}
    >
      {body}
    </button>
  );
}
