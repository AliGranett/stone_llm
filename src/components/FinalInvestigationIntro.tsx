import { FINAL_EXPERIMENT_LIMIT } from "../config/roundConfig";
import { interpolate } from "../i18n/interpolate";
import { useTranslation } from "../i18n/LocaleProvider";

/**
 * Neutral participant-facing instructions for the final independent stage:
 * the Research Partner is unavailable, four free-choice experiments remain,
 * and the participant should complete their model of the system.
 */
export function FinalInvestigationIntro() {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="final-intro-heading" className="panel final-intro">
      <h3 id="final-intro-heading" className="panel__title">
        {t.finalInvestigation.title}
      </h3>
      <p>{t.finalInvestigation.partnerNote}</p>
      <p>
        {interpolate(t.finalInvestigation.experimentsNote, {
          count: FINAL_EXPERIMENT_LIMIT,
        })}
      </p>
      <p>{t.finalInvestigation.modelNote}</p>
    </section>
  );
}
