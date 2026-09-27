import { useEffect, useId, useRef } from "react";
import { useTranslation } from "../i18n/LocaleProvider";
import { InstructionsContent } from "./InstructionsContent";

interface InstructionsHelpButtonProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function InstructionsHelpButton({ open, onOpen, onClose }: InstructionsHelpButtonProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <>
      <button type="button" className="btn btn--ghost instructions-help-trigger" onClick={onOpen}>
        {t.instructions.helpButton}
      </button>

      {open && (
        <div className="instructions-dialog-backdrop" onClick={onClose}>
          <div
            className="instructions-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="instructions-dialog__header">
              <h2 id={titleId} className="instructions-dialog__title">
                {t.instructions.title}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                className="btn btn--ghost btn--small"
                onClick={onClose}
              >
                {t.instructions.closeButton}
              </button>
            </header>
            <div className="instructions-dialog__body" aria-label={t.instructions.dialogAria}>
              <InstructionsContent compact />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
