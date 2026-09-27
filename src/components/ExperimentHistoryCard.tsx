import { useState, type CSSProperties } from "react";
import { AFFINITY_META } from "../config/affinities";
import { interpolate } from "../i18n/interpolate";
import { useTranslation } from "../i18n/LocaleProvider";
import { useStudyStore } from "../state/studyStore";
import type { ExperimentOutcome, ExperimentRecord, Stone } from "../types";
import { ColoredAffinityIcon } from "./icons/AffinityIcon";

function CompactStoneChip({ stone }: { stone: Stone }) {
  const { t } = useTranslation();
  const meta = AFFINITY_META[stone.affinity];
  const charge = stone.charge === "POSITIVE" ? "+" : "−";

  return (
    <span
      className="history-chip"
      style={
        {
          "--stone-primary": meta.primary,
          "--stone-light": meta.light,
        } as CSSProperties
      }
      title={`${t.affinities[stone.affinity]} ${stone.id}`}
    >
      <ColoredAffinityIcon affinity={stone.affinity} size={18} />
      <span className="history-chip__props" aria-hidden="true">
        {"●".repeat(stone.strength)}
        <span className="history-chip__charge">{charge}</span>
      </span>
      <span className="visually-hidden">
        {t.affinities[stone.affinity]}, {t.stones.strength} {stone.strength},{" "}
        {stone.charge === "POSITIVE" ? t.charges.positive : t.charges.negative}
      </span>
    </span>
  );
}

function OutcomeGlyph({ outcome }: { outcome: ExperimentOutcome }) {
  switch (outcome) {
    case "STONE_A_WINS":
      return (
        <span className="history-outcome-glyph" aria-hidden="true" title="A">
          A▸
        </span>
      );
    case "STONE_B_WINS":
      return (
        <span className="history-outcome-glyph" aria-hidden="true" title="B">
          ▸B
        </span>
      );
    case "STALEMATE":
      return (
        <span className="history-outcome-glyph" aria-hidden="true">
          =
        </span>
      );
    case "MUTUAL_NEUTRALIZATION":
      return (
        <span className="history-outcome-glyph" aria-hidden="true">
          ⊘
        </span>
      );
  }
}

function StoneSummary({ stone, slot }: { stone: Stone; slot: "A" | "B" }) {
  const { t } = useTranslation();
  const meta = AFFINITY_META[stone.affinity];
  const slotLabel = slot === "A" ? t.selectedPair.stoneA : t.selectedPair.stoneB;

  return (
    <div className="history-stone" style={{ borderColor: meta.light }}>
      <span className="history-stone__slot">{slotLabel}</span>
      <span className="history-stone__name">
        <ColoredAffinityIcon affinity={stone.affinity} size={16} />
        {t.affinities[stone.affinity]} {stone.id}
      </span>
      <span className="history-stone__props">
        {t.stones.strength} {stone.strength} ·{" "}
        {stone.charge === "POSITIVE" ? t.charges.positive : t.charges.negative}
      </span>
    </div>
  );
}

function formatTimestamp(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

interface ExperimentHistoryCardProps {
  record: ExperimentRecord;
  defaultOpen?: boolean;
}

export function ExperimentHistoryCard({
  record,
  defaultOpen = false,
}: ExperimentHistoryCardProps) {
  const { dispatch } = useStudyStore();
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  const outcomeMeta = t.outcomes[record.evaluation.outcome];
  const contentId = `history-content-${record.id}`;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    dispatch({
      type: "LOG_EVENT",
      eventType: next ? "HISTORY_ENTRY_OPENED" : "HISTORY_ENTRY_CLOSED",
      payload: { experimentId: record.id, experimentNumber: record.experimentNumber },
    });
  };

  return (
    <article className={`history-card ${open ? "history-card--open" : ""}`}>
      <button
        type="button"
        className="history-card__toggle"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <span className="history-card__number">
          {interpolate(t.history.experiment, { number: record.experimentNumber })}
        </span>
        <span className="history-card__pair">
          <CompactStoneChip stone={record.stoneA} />
          <span className="history-card__vs" aria-hidden="true">
            {t.selectedPair.vs}
          </span>
          <CompactStoneChip stone={record.stoneB} />
        </span>
        <span className="history-card__result">
          <OutcomeGlyph outcome={record.evaluation.outcome} />
          <span className="history-card__result-label">{outcomeMeta.label}</span>
        </span>
        <span className="history-card__chevron" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open && (
        <div id={contentId} className="history-card__body">
          <div className="history-card__stones">
            <StoneSummary stone={record.stoneA} slot="A" />
            <StoneSummary stone={record.stoneB} slot="B" />
          </div>

          <dl className="history-card__details">
            <dt>{t.history.prediction}</dt>
            <dd>{t.outcomes[record.prediction].label}</dd>

            <dt>{t.history.actualResult}</dt>
            <dd>
              {outcomeMeta.label}
              {record.evaluation.winningStoneId
                ? interpolate(t.history.winnerSuffix, {
                    id: record.evaluation.winningStoneId,
                  })
                : ""}
            </dd>

            <dt>{t.history.mostImportantProperty}</dt>
            <dd>{t.hypothesis.properties[record.mostImportantProperty]}</dd>

            {record.notes.trim().length > 0 && (
              <>
                <dt>{t.history.notes}</dt>
                <dd>{record.notes}</dd>
              </>
            )}

            <dt>{t.history.evidenceAssessment}</dt>
            <dd>{t.evidence[record.reflection.evidenceAssessment]}</dd>

            {record.reflection.observation.trim().length > 0 && (
              <>
                <dt>{t.history.observation}</dt>
                <dd>{record.reflection.observation}</dd>
              </>
            )}

            <dt>{t.history.completed}</dt>
            <dd>{formatTimestamp(record.completedAt, locale)}</dd>
          </dl>
        </div>
      )}
    </article>
  );
}
