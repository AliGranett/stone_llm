import { useTranslation } from "../i18n/LocaleProvider";
import { useStudyStore } from "../state/studyStore";
import { ExperimentHistoryCard } from "./ExperimentHistoryCard";

export function ExperimentHistory() {
  const { state } = useStudyStore();
  const { t } = useTranslation();
  const experiments = state.experiments;

  return (
    <section aria-labelledby="history-heading" className="column-panel history-panel">
      <h2 id="history-heading" className="column-panel__title">
        {t.history.title}
      </h2>
      {experiments.length === 0 ? (
        <p className="column-panel__empty">{t.history.empty}</p>
      ) : (
        <ol className="history-list">
          {experiments.map((record) => (
            <li key={record.id}>
              <ExperimentHistoryCard record={record} defaultOpen={false} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
