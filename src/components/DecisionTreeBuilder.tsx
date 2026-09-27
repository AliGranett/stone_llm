import { useState, type DragEvent } from "react";
import {
  DECISION_CONDITIONS,
  DECISION_TREE_SHAPE,
  TERMINAL_IDS,
  TERMINAL_OUTCOMES,
  TREE_ROOT_ID,
  branchId,
  getTreeNodeSpec,
  type TreeChildRef,
} from "../config/finalModelConfig";
import {
  buildTreePathLabels,
  formatPathLabel,
  type PathSegmentId,
  type TreePathLabels,
} from "../engine/decisionTreePaths";
import { interpolate } from "../i18n/interpolate";
import { useTranslation } from "../i18n/LocaleProvider";
import { useStudyStore } from "../state/studyStore";
import type { BranchLabel, DecisionConditionId, TerminalOutcomeId } from "../types";

/**
 * Participant-facing decision-tree builder. The tree SHAPE is fixed (it may
 * be revealed); all contents start empty and are filled by the participant
 * with reusable condition/outcome cards. Placement works by click-to-select
 * + click-to-place (keyboard accessible) and by drag-and-drop.
 *
 * Accumulated case-path labels are derived live from the participant's
 * condition cards and YES/NO branch assignments — never from the hidden rule.
 */

type SelectedCard =
  | { kind: "condition"; id: DecisionConditionId }
  | { kind: "outcome"; id: TerminalOutcomeId };

const DRAG_MIME = "application/x-asterion-card";

function nodeNumber(nodeId: string): number {
  return DECISION_TREE_SHAPE.findIndex((node) => node.id === nodeId) + 1;
}

function terminalNumber(terminalId: string): number {
  return TERMINAL_IDS.indexOf(terminalId) + 1;
}

function parseDragPayload(event: DragEvent): SelectedCard | null {
  const raw = event.dataTransfer.getData(DRAG_MIME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SelectedCard;
    if (parsed.kind === "condition" || parsed.kind === "outcome") return parsed;
    return null;
  } catch {
    return null;
  }
}

function PathChips({
  segments,
  labels,
}: {
  segments: PathSegmentId[];
  labels: Record<PathSegmentId, string>;
}) {
  if (segments.length === 0) return null;
  return (
    <div className="tree-path" aria-label={formatPathLabel(segments, labels)}>
      {segments.map((segment, index) => (
        <span key={`${segment}-${index}`} className="tree-path__item">
          {index > 0 && (
            <span className="tree-path__arrow" aria-hidden="true">
              →
            </span>
          )}
          <span className="tree-path__chip">{labels[segment]}</span>
        </span>
      ))}
    </div>
  );
}

export function DecisionTreeBuilder() {
  const { state, dispatch } = useStudyStore();
  const { t } = useTranslation();
  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);

  const tree = state.decisionTree;
  const pathLabels: TreePathLabels = buildTreePathLabels(tree);
  const segmentLabels = t.tree.pathSegments;

  const placeCondition = (nodeId: string, condition: DecisionConditionId | null) => {
    dispatch({ type: "SET_TREE_NODE", nodeId, condition });
  };

  const placeOutcome = (terminalId: string, outcome: TerminalOutcomeId | null) => {
    dispatch({ type: "SET_TREE_TERMINAL", terminalId, outcome });
  };

  const setBranch = (id: string, label: BranchLabel) => {
    dispatch({ type: "SET_TREE_BRANCH", branchId: id, label });
  };

  const CardButton = ({ card }: { card: SelectedCard }) => {
    const label =
      card.kind === "condition" ? t.tree.conditions[card.id] : t.tree.outcomes[card.id];
    const isSelected =
      selectedCard?.kind === card.kind && selectedCard.id === card.id;
    return (
      <button
        type="button"
        className={`model-card model-card--${card.kind} ${
          isSelected ? "model-card--selected" : ""
        }`}
        aria-pressed={isSelected}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData(DRAG_MIME, JSON.stringify(card));
          event.dataTransfer.effectAllowed = "copy";
        }}
        onClick={() => setSelectedCard(isSelected ? null : card)}
      >
        {label}
      </button>
    );
  };

  const NodeSlot = ({ nodeId }: { nodeId: string }) => {
    const condition = tree.nodes[nodeId];
    const casePath = pathLabels.nodes[nodeId] ?? [];
    return (
      <div className="tree-slot-block">
        {casePath.length > 0 && (
          <div className="tree-case">
            <span className="tree-case__label">{t.tree.caseLabel}</span>
            <PathChips segments={casePath} labels={segmentLabels} />
          </div>
        )}
        <div className="tree-slot-row">
          <button
            type="button"
            className={`tree-slot tree-slot--condition ${
              condition ? "tree-slot--filled" : ""
            } ${selectedCard?.kind === "condition" ? "tree-slot--target" : ""}`}
            onClick={() => {
              if (selectedCard?.kind === "condition") {
                placeCondition(nodeId, selectedCard.id);
              }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const card = parseDragPayload(event);
              if (card?.kind === "condition") placeCondition(nodeId, card.id);
            }}
          >
            <span className="tree-slot__caption">
              {interpolate(t.tree.nodeTitle, { number: nodeNumber(nodeId) })}
            </span>
            <span className="tree-slot__value">
              {condition ? t.tree.conditions[condition] : t.tree.emptyNode}
            </span>
          </button>
          {condition && (
            <button
              type="button"
              className="btn btn--ghost btn--small tree-slot__remove"
              onClick={() => placeCondition(nodeId, null)}
              aria-label={t.tree.remove}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  };

  const TerminalSlot = ({ terminalId }: { terminalId: string }) => {
    const outcome = tree.terminals[terminalId];
    const casePath = pathLabels.terminals[terminalId] ?? [];
    return (
      <div className="tree-slot-block">
        {casePath.length > 0 && (
          <div className="tree-case">
            <span className="tree-case__label">{t.tree.caseLabel}</span>
            <PathChips segments={casePath} labels={segmentLabels} />
          </div>
        )}
        <div className="tree-slot-row">
          <button
            type="button"
            className={`tree-slot tree-slot--terminal ${
              outcome ? "tree-slot--filled" : ""
            } ${selectedCard?.kind === "outcome" ? "tree-slot--target" : ""}`}
            onClick={() => {
              if (selectedCard?.kind === "outcome") {
                placeOutcome(terminalId, selectedCard.id);
              }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const card = parseDragPayload(event);
              if (card?.kind === "outcome") placeOutcome(terminalId, card.id);
            }}
          >
            <span className="tree-slot__caption">
              {casePath.length > 0
                ? t.tree.outcomeLabel
                : interpolate(t.tree.terminalTitle, {
                    number: terminalNumber(terminalId),
                  })}
            </span>
            <span className="tree-slot__value">
              {outcome ? t.tree.outcomes[outcome] : t.tree.emptyTerminal}
            </span>
          </button>
          {outcome && (
            <button
              type="button"
              className="btn btn--ghost btn--small tree-slot__remove"
              onClick={() => placeOutcome(terminalId, null)}
              aria-label={t.tree.remove}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  };

  const BranchControl = ({ id }: { id: string }) => {
    const value = tree.branches[id];
    const meaning = pathLabels.branches[id];
    return (
      <div className="tree-branch__header">
        <div className="tree-branch__label" role="group" aria-label={t.tree.branchAria}>
          {(["YES", "NO"] as const).map((label) => (
            <button
              key={label}
              type="button"
              className={`tree-branch__option ${
                value === label ? "tree-branch__option--active" : ""
              }`}
              aria-pressed={value === label}
              onClick={() => setBranch(id, label)}
            >
              {label === "YES" ? t.tree.yes : t.tree.no}
            </button>
          ))}
        </div>
        {meaning && (
          <span className="tree-branch__meaning">{segmentLabels[meaning]}</span>
        )}
      </div>
    );
  };

  const ChildView = ({ child }: { child: TreeChildRef }) =>
    child.kind === "node" ? (
      <NodeView nodeId={child.id} />
    ) : (
      <TerminalSlot terminalId={child.id} />
    );

  const NodeView = ({ nodeId }: { nodeId: string }) => {
    const spec = getTreeNodeSpec(nodeId);
    return (
      <div className="tree-node">
        <NodeSlot nodeId={nodeId} />
        <div className="tree-node__branches">
          {spec.children.map((child, index) => (
            <div key={child.id} className="tree-branch">
              <BranchControl id={branchId(nodeId, index as 0 | 1)} />
              <div className="tree-branch__child">
                <ChildView child={child} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section aria-labelledby="tree-heading" className="panel model-panel">
      <h3 id="tree-heading" className="panel__title">
        {t.tree.title}
      </h3>
      <p className="panel__hint">{t.tree.intro}</p>

      <div className="model-bank">
        <div className="model-bank__group">
          <h4 className="model-bank__title">{t.tree.bankConditionsTitle}</h4>
          <div className="model-bank__cards">
            {DECISION_CONDITIONS.map((id) => (
              <CardButton key={id} card={{ kind: "condition", id }} />
            ))}
          </div>
        </div>
        <div className="model-bank__group">
          <h4 className="model-bank__title">{t.tree.bankOutcomesTitle}</h4>
          <div className="model-bank__cards">
            {TERMINAL_OUTCOMES.map((id) => (
              <CardButton key={id} card={{ kind: "outcome", id }} />
            ))}
          </div>
        </div>
      </div>
      <p className="model-bank__hint">{t.tree.bankHint}</p>

      <div className="tree-root">
        <NodeView nodeId={TREE_ROOT_ID} />
      </div>
    </section>
  );
}
