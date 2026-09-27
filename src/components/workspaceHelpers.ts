import { canEditSetup, type StudyState } from "../state/studyReducer";
import type { SelectionSlot } from "./StoneCard";

export { canEditSetup };

/** Returns a lookup from stone id to its selection slot ("A" | "B" | null). */
export function getSelectionSlotLookup(state: StudyState): (stoneId: string) => SelectionSlot {
  return (stoneId) => {
    if (state.selectedStoneIds.a === stoneId) return "A";
    if (state.selectedStoneIds.b === stoneId) return "B";
    return null;
  };
}
