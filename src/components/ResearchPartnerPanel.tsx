import { useEffect, useRef, useState, type FormEvent } from "react";
import { ROUND_INQUIRY_MAX } from "../config/roundConfig";
import { studyConfig } from "../config/studyConfig";
import { interpolate } from "../i18n/interpolate";
import { useTranslation } from "../i18n/LocaleProvider";
import {
  ResearchPartnerError,
  sendResearchPartnerMessage,
  type ResearchPartnerRequest,
} from "../services/researchPartnerService";
import {
  canSendInquiry,
  canUseResearchPartner,
  experimentsRemaining,
  getAvailableStones,
  getCurrentRoundExperiments,
  getSelectedStones,
  inquiriesUsedInCurrentRound,
  totalInquiriesUsed,
  type StudyState,
} from "../state/studyReducer";
import { useStudyStore } from "../state/studyStore";
import type { ChatMessage } from "../types";
import { ChatMessageBubble } from "./ChatMessageBubble";

interface InquiryMeta {
  round: number;
  roundInquiryNumber: number;
  globalInquiryNumber: number;
  experimentsCompletedInRound: number;
}

interface FailedRequest {
  message: string;
  retryable: boolean;
  participantMessage: string;
  inquiryMeta: InquiryMeta;
}

function buildPartnerRequest(
  latest: StudyState,
  participantMessage: string,
  history: ChatMessage[],
  locale: ResearchPartnerRequest["locale"],
): ResearchPartnerRequest | null {
  if (!canUseResearchPartner(latest) || !latest.condition) return null;

  return {
    participantId: latest.participantId,
    sessionId: latest.sessionId,
    experimentId:
      latest.pendingExperiment?.id ??
      latest.experiments[latest.experiments.length - 1]?.id ??
      null,
    participantMessage,
    phase: latest.phase,
    experimentsRemaining: experimentsRemaining(latest),
    availableStones: getAvailableStones(latest),
    // Raw UI selection; buildRequestBody clears this when a pending result exists.
    selectedStones: getSelectedStones(latest),
    experimentHistory: latest.experiments,
    pendingExperiment: latest.pendingExperiment,
    currentMostImportantProperty: latest.mostImportantProperty,
    currentNotes: latest.notes,
    chatHistory: history,
    condition: latest.condition,
    locale,
  };
}

export function ResearchPartnerPanel() {
  const { state, dispatch } = useStudyStore();
  const { t, locale } = useTranslation();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<FailedRequest | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Always read the freshest study state when constructing LLM context so a
  // message sent immediately after RUN_EXPERIMENT / SUBMIT_REFLECTION cannot
  // omit the just-completed result.
  const stateRef = useRef(state);
  stateRef.current = state;

  const partnerAvailable = canUseResearchPartner(state);
  const composerEnabled = canSendInquiry(state);
  const inquiriesUsed = inquiriesUsedInCurrentRound(state);
  const isFinalStage = state.phase === "FINAL_INVESTIGATION";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [state.chatMessages.length, sending]);

  const requestReply = async (
    participantMessage: string,
    history: ChatMessage[],
    inquiryMeta: InquiryMeta,
  ) => {
    const latest = stateRef.current;
    const request = buildPartnerRequest(latest, participantMessage, history, locale);
    if (!request) return;

    setSending(true);
    setFailure(null);

    try {
      const reply = await sendResearchPartnerMessage(request);

      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: {
          id: crypto.randomUUID(),
          role: "PARTNER",
          content: reply.message,
          timestamp: reply.llmResponseTimestamp,
          round: null,
        },
        eventType: "LLM_RESPONSE_RECEIVED",
      });

      dispatch({
        type: "RECORD_LLM_INTERACTION",
        interaction: {
          interactionId: reply.interactionId,
          participantId: request.participantId,
          sessionId: request.sessionId,
          experimentId: request.experimentId,
          llmMode: request.condition,
          studyPhase: request.phase,
          round: inquiryMeta.round,
          roundInquiryNumber: inquiryMeta.roundInquiryNumber,
          globalInquiryNumber: inquiryMeta.globalInquiryNumber,
          experimentsCompletedInRound: inquiryMeta.experimentsCompletedInRound,
          userMessage: participantMessage,
          llmResponse: reply.message,
          userMessageTimestamp: reply.userMessageTimestamp,
          llmResponseTimestamp: reply.llmResponseTimestamp,
          responseLatencyMs: reply.responseLatencyMs,
          promptVersion: reply.promptVersion,
          model: reply.model,
        },
      });
    } catch (error) {
      const isKnown = error instanceof ResearchPartnerError;
      setFailure({
        message: isKnown ? error.message : t.partner.error,
        retryable: isKnown ? error.retryable : true,
        participantMessage,
        inquiryMeta,
      });
      dispatch({ type: "LOG_EVENT", eventType: "LLM_REQUEST_FAILED" });
    } finally {
      setSending(false);
    }
  };

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!composerEnabled) return;

    const text = input.trim();
    if (!text || sending) return;

    const latest = stateRef.current;
    const inquiryMeta: InquiryMeta = {
      round: latest.currentAssistedRound,
      roundInquiryNumber: inquiriesUsedInCurrentRound(latest) + 1,
      globalInquiryNumber: totalInquiriesUsed(latest) + 1,
      experimentsCompletedInRound: getCurrentRoundExperiments(latest).length,
    };

    const participantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "PARTICIPANT",
      content: text,
      timestamp: new Date().toISOString(),
      round: latest.currentAssistedRound,
    };
    dispatch({
      type: "ADD_CHAT_MESSAGE",
      message: participantMessage,
      eventType: "LLM_MESSAGE_SENT",
    });
    setInput("");

    await requestReply(text, [...latest.chatMessages, participantMessage], inquiryMeta);
  };

  const retry = async () => {
    if (!failure || sending || !partnerAvailable) return;
    await requestReply(
      failure.participantMessage,
      stateRef.current.chatMessages,
      failure.inquiryMeta,
    );
  };

  const subtitle = partnerAvailable
    ? t.partner.subtitle
    : isFinalStage
      ? t.partner.readOnly
      : t.partner.unavailable;

  return (
    <section aria-labelledby="partner-heading" className="column-panel partner-panel">
      <h2 id="partner-heading" className="column-panel__title">
        {t.partner.title}
      </h2>
      <p className="column-panel__subtitle">{subtitle}</p>

      {partnerAvailable && (
        <p className="partner-panel__counter" role="status">
          {interpolate(t.phase.inquiriesCounter, {
            used: inquiriesUsed,
            total: ROUND_INQUIRY_MAX,
          })}
        </p>
      )}

      <div className="partner-panel__messages" ref={scrollRef} aria-live="polite">
        {state.chatMessages.length === 0 && !sending && partnerAvailable && (
          <p className="column-panel__empty">{t.partner.empty}</p>
        )}
        {state.chatMessages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}
        {sending && (
          <div className="chat-message chat-message--partner chat-message--loading" role="status">
            <span className="chat-message__author">{t.partner.partner}</span>
            <span className="chat-message__typing" aria-label={t.partner.typing}>
              <span />
              <span />
              <span />
            </span>
          </div>
        )}
      </div>

      {failure && partnerAvailable && (
        <div className="partner-panel__error" role="alert">
          <span>{failure.message}</span>
          {failure.retryable && (
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={retry}
              disabled={sending}
            >
              {t.partner.retry}
            </button>
          )}
        </div>
      )}

      {composerEnabled ? (
        <form className="partner-panel__composer" onSubmit={send}>
          <label className="visually-hidden" htmlFor="partner-input">
            {t.partner.inputLabel}
          </label>
          <textarea
            id="partner-input"
            className="partner-panel__input"
            rows={2}
            placeholder={t.partner.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(e);
              }
            }}
            disabled={sending}
          />
          <button
            type="submit"
            className="btn btn--primary"
            disabled={sending || input.trim().length === 0}
          >
            {t.partner.send}
          </button>
        </form>
      ) : (
        <p className="partner-panel__unavailable" role="status">
          {partnerAvailable
            ? t.partner.limitReached
            : isFinalStage
              ? t.partner.readOnly
              : t.partner.unavailable}
        </p>
      )}

      {studyConfig.enableDevControls && state.chatMessages.length > 0 && (
        <button
          type="button"
          className="btn btn--ghost btn--small partner-panel__dev-clear"
          onClick={() => dispatch({ type: "DEV_CLEAR_CHAT" })}
          title="Development only"
        >
          {t.partner.devClear}
        </button>
      )}
    </section>
  );
}
