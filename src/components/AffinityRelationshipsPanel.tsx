import type { CSSProperties } from "react";
import {
  AFFINITY_DOMINANCE_CYCLE,
  AFFINITY_NEUTRAL_PAIRS,
} from "../config/affinityRelationships";
import { AFFINITY_META } from "../config/affinities";
import { useTranslation } from "../i18n/LocaleProvider";
import type { Affinity } from "../types";
import { ColoredAffinityIcon } from "./icons/AffinityIcon";

/**
 * Read-only diagram of the affinity relationships given to participants.
 * Used on the instructions page and as a final-stage reference — never as a
 * reconstruct-the-map assessment.
 */

function AffinityChip({ affinity }: { affinity: Affinity }) {
  const { t } = useTranslation();
  const meta = AFFINITY_META[affinity];
  const style = {
    "--affinity-primary": meta.primary,
    "--affinity-light": meta.light,
    "--affinity-deep": meta.deep,
  } as CSSProperties;

  return (
    <span className="affinity-rel__chip" style={style}>
      <ColoredAffinityIcon affinity={affinity} size={20} />
      <span>{t.affinities[affinity]}</span>
    </span>
  );
}

interface AffinityRelationshipsPanelProps {
  /** Optional heading id for aria-labelledby when nested in a section. */
  headingId?: string;
  /** When true, use a quieter panel style for the final-stage reference. */
  asReference?: boolean;
}

export function AffinityRelationshipsPanel({
  headingId = "affinity-relationships-heading",
  asReference = false,
}: AffinityRelationshipsPanelProps) {
  const { t } = useTranslation();
  const cycle = AFFINITY_DOMINANCE_CYCLE;
  const title = asReference
    ? t.affinityMap.referenceTitle
    : t.instructions.affinityMapTitle;
  const given = asReference
    ? t.affinityMap.referenceIntro
    : t.instructions.affinityMapGiven;

  return (
    <div
      className={`affinity-rel ${asReference ? "affinity-rel--reference" : ""}`}
      aria-labelledby={headingId}
    >
      <h3 id={headingId} className="affinity-rel__title">
        {title}
      </h3>
      <p className="affinity-rel__given">{given}</p>

      <div className="affinity-rel__block">
        <h4 className="affinity-rel__subtitle">{t.instructions.dominanceTitle}</h4>
        <p className="affinity-rel__hint">{t.instructions.dominanceHint}</p>
        <div className="affinity-rel__cycle" role="list" aria-label={t.instructions.dominanceTitle}>
          {[...cycle, cycle[0]].map((affinity, index, all) => (
            <span key={`${affinity}-${index}`} className="affinity-rel__cycle-item" role="listitem">
              <AffinityChip affinity={affinity} />
              {index < all.length - 1 && (
                <span className="affinity-rel__arrow" aria-hidden="true">
                  →
                </span>
              )}
            </span>
          ))}
        </div>
        <p className="affinity-rel__cycle-text">{t.instructions.dominanceCycleText}</p>
      </div>

      <div className="affinity-rel__block">
        <h4 className="affinity-rel__subtitle">{t.instructions.neutralTitle}</h4>
        <p className="affinity-rel__hint">{t.instructions.neutralHint}</p>
        <ul className="affinity-rel__neutrals" aria-label={t.instructions.neutralTitle}>
          {AFFINITY_NEUTRAL_PAIRS.map(([a, b]) => (
            <li key={`${a}-${b}`} className="affinity-rel__neutral-item">
              <AffinityChip affinity={a} />
              <span className="affinity-rel__neutral-mark" aria-hidden="true">
                ↔
              </span>
              <AffinityChip affinity={b} />
            </li>
          ))}
        </ul>
      </div>

      <p className="affinity-rel__footnote">{t.instructions.affinityMapFootnote}</p>
    </div>
  );
}
