import { useTranslation } from "../i18n/LocaleProvider";
import type { ChatMessage } from "../types";

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const { t } = useTranslation();
  const isParticipant = message.role === "PARTICIPANT";
  return (
    <div
      className={`chat-message ${isParticipant ? "chat-message--participant" : "chat-message--partner"}`}
    >
      <span className="chat-message__author">
        {isParticipant ? t.partner.you : t.partner.partner}
      </span>
      <p className="chat-message__content">{message.content}</p>
    </div>
  );
}
