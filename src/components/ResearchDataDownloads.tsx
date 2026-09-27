import {
  downloadExperimentsCsv,
  downloadFinalReportCsv,
  downloadLlmInteractionsCsv,
  downloadParticipantCsv,
  downloadStudyExport,
} from "../services/studyLogger";
import { useTranslation } from "../i18n/LocaleProvider";
import { useStudyStore } from "../state/studyStore";

/**
 * Researcher data downloads shown at study completion in Testing Mode.
 * Not shown to Participant Mode sessions.
 */
export function ResearchDataDownloads() {
  const { state } = useStudyStore();
  const { t } = useTranslation();

  if (state.phase !== "COMPLETE" || state.studyMode !== "TESTING") {
    return null;
  }

  return (
    <section
      className="panel research-downloads"
      aria-labelledby="research-downloads-heading"
    >
      <h3 id="research-downloads-heading" className="panel__title">
        {t.complete.downloadsTitle}
      </h3>
      <p className="panel__hint">{t.complete.downloadsHint}</p>
      <div className="research-downloads__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => downloadFinalReportCsv(state)}
        >
          {t.complete.downloadFinalReport}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => downloadExperimentsCsv(state)}
        >
          {t.complete.downloadExperiments}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => downloadParticipantCsv(state)}
        >
          {t.complete.downloadParticipant}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => downloadLlmInteractionsCsv(state)}
        >
          {t.complete.downloadLlm}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => downloadStudyExport(state)}
        >
          {t.complete.downloadJson}
        </button>
      </div>
    </section>
  );
}
