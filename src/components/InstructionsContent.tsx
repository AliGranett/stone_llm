import type { CSSProperties } from "react";
import { AFFINITIES, AFFINITY_META } from "../config/affinities";
import { useTranslation } from "../i18n/LocaleProvider";
import type { Affinity, ExperimentOutcome } from "../types";
import { AffinityRelationshipsPanel } from "./AffinityRelationshipsPanel";
import { ColoredAffinityIcon } from "./icons/AffinityIcon";

function StrengthPips({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="instructions-strength__pips" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <span
          key={index}
          className={`instructions-strength__pip ${
            index < level ? "instructions-strength__pip--filled" : ""
          }`}
        />
      ))}
    </span>
  );
}

const OUTCOME_KEYS = {
  STONE_A_WINS: "stoneAWins",
  STONE_B_WINS: "stoneBWins",
  STALEMATE: "stalemate",
  MUTUAL_NEUTRALIZATION: "neutralization",
} as const;

const OUTCOME_ORDER: ExperimentOutcome[] = [
  "STONE_A_WINS",
  "STONE_B_WINS",
  "STALEMATE",
  "MUTUAL_NEUTRALIZATION",
];

function OutcomeGlyph({ outcome }: { outcome: ExperimentOutcome }) {
  switch (outcome) {
    case "STONE_A_WINS":
      return (
        <span className="instructions-outcome__glyph" aria-hidden="true">
          <span className="instructions-outcome__badge">A</span>
          <span className="instructions-outcome__arrow">→</span>
          <span className="instructions-outcome__badge instructions-outcome__badge--muted">B</span>
        </span>
      );
    case "STONE_B_WINS":
      return (
        <span className="instructions-outcome__glyph" aria-hidden="true">
          <span className="instructions-outcome__badge instructions-outcome__badge--muted">A</span>
          <span className="instructions-outcome__arrow">→</span>
          <span className="instructions-outcome__badge">B</span>
        </span>
      );
    case "STALEMATE":
      return (
        <span className="instructions-outcome__glyph" aria-hidden="true">
          <span className="instructions-outcome__badge instructions-outcome__badge--muted">A</span>
          <span className="instructions-outcome__equals">=</span>
          <span className="instructions-outcome__badge instructions-outcome__badge--muted">B</span>
        </span>
      );
    case "MUTUAL_NEUTRALIZATION":
      return (
        <span className="instructions-outcome__glyph" aria-hidden="true">
          <span className="instructions-outcome__badge instructions-outcome__badge--muted">A</span>
          <span className="instructions-outcome__cancel">⊘</span>
          <span className="instructions-outcome__badge instructions-outcome__badge--muted">B</span>
        </span>
      );
  }
}

function AffinityCard({ affinity }: { affinity: Affinity }) {
  const { t } = useTranslation();
  const meta = AFFINITY_META[affinity];
  const style = {
    "--affinity-primary": meta.primary,
    "--affinity-light": meta.light,
    "--affinity-deep": meta.deep,
  } as CSSProperties;

  return (
    <div className="instructions-affinity-card" style={style}>
      <span className="instructions-affinity-card__icon">
        <ColoredAffinityIcon affinity={affinity} size={28} />
      </span>
      <span className="instructions-affinity-card__label">{t.affinities[affinity]}</span>
    </div>
  );
}

interface InstructionsContentProps {
  /** When true, omit the page title block (used inside the review dialog). */
  compact?: boolean;
}

export function InstructionsContent({ compact = false }: InstructionsContentProps) {
  const { t } = useTranslation();

  return (
    <div className={`instructions-content ${compact ? "instructions-content--compact" : ""}`}>
      {!compact && (
        <header className="instructions-content__header">
          <h2 className="instructions-content__title">{t.instructions.title}</h2>
          <p className="instructions-content__subtitle">{t.instructions.subtitle}</p>
        </header>
      )}

      <section className="instructions-intro" aria-label={t.instructions.introWelcome}>
        <p className="instructions-intro__welcome">{t.instructions.introWelcome}</p>
        <p>{t.instructions.introDiscovery}</p>
        <p>{t.instructions.introTask}</p>
        <p>{t.instructions.introPartner}</p>
      </section>

      <section className="instructions-section" aria-labelledby="instructions-properties-heading">
        <h3 id="instructions-properties-heading" className="instructions-section__title">
          {t.instructions.propertiesTitle}
        </h3>

        <div className="instructions-properties">
          <article className="instructions-property">
            <h4 className="instructions-property__label">{t.instructions.affinityLabel}</h4>
            <div className="instructions-affinity-grid" role="list">
              {AFFINITIES.map((affinity) => (
                <div key={affinity} role="listitem">
                  <AffinityCard affinity={affinity} />
                </div>
              ))}
            </div>
          </article>

          <article className="instructions-property">
            <h4 className="instructions-property__label">{t.instructions.strengthLabel}</h4>
            <div className="instructions-strength-row">
              {([1, 2, 3] as const).map((level) => (
                <div key={level} className="instructions-strength">
                  <StrengthPips level={level} />
                  <span className="instructions-strength__value">{level}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="instructions-property">
            <h4 className="instructions-property__label">{t.instructions.chargeLabel}</h4>
            <div className="instructions-charge-row">
              <div className="instructions-charge instructions-charge--positive">
                <span className="instructions-charge__symbol" aria-hidden="true">
                  +
                </span>
                <span>{t.charges.positive}</span>
              </div>
              <div className="instructions-charge instructions-charge--negative">
                <span className="instructions-charge__symbol" aria-hidden="true">
                  −
                </span>
                <span>{t.charges.negative}</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section
        className="instructions-section"
        aria-labelledby="instructions-affinity-map-heading"
      >
        <AffinityRelationshipsPanel headingId="instructions-affinity-map-heading" />
      </section>

      <section className="instructions-section" aria-labelledby="instructions-outcomes-heading">
        <h3 id="instructions-outcomes-heading" className="instructions-section__title">
          {t.instructions.outcomesTitle}
        </h3>
        <div className="instructions-outcome-grid" role="list">
          {OUTCOME_ORDER.map((outcome) => (
            <div key={outcome} className="instructions-outcome" role="listitem">
              <OutcomeGlyph outcome={outcome} />
              <span className="instructions-outcome__label">
                {t.instructions.outcomes[OUTCOME_KEYS[outcome]]}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="instructions-section" aria-labelledby="instructions-goal-heading">
        <h3 id="instructions-goal-heading" className="instructions-section__title">
          {t.instructions.goalTitle}
        </h3>
        <div className="instructions-goal">
          <p>{t.instructions.goalIntro}</p>
          <p>{t.instructions.goalAffinity}</p>
          <p>{t.instructions.goalTask}</p>
        </div>
      </section>
    </div>
  );
}
