import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import { studyPersistence, type PersistenceStatus } from "../services/studyPersistence";
import {
  createInitialState,
  studyReducer,
  type StudyAction,
  type StudyState,
} from "./studyReducer";

interface StudyStoreValue {
  state: StudyState;
  dispatch: Dispatch<StudyAction>;
  persistenceStatus: PersistenceStatus;
}

const StudyStoreContext = createContext<StudyStoreValue | null>(null);

const SAVE_DEBOUNCE_MS = 400;

export function StudyStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    studyReducer,
    undefined,
    () => studyPersistence.load() ?? createInitialState(),
  );
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>("idle");
  const isFirstRender = useRef(true);

  // Log page open once per mount (covers both fresh and restored sessions).
  useEffect(() => {
    dispatch({ type: "LOG_EVENT", eventType: "PAGE_OPENED" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced persistence on every state change.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPersistenceStatus("saving");
    const timer = setTimeout(() => {
      const ok = studyPersistence.save(state);
      setPersistenceStatus(ok ? "saved" : "error");
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state]);

  const value = useMemo(
    () => ({ state, dispatch, persistenceStatus }),
    [state, persistenceStatus],
  );

  return (
    <StudyStoreContext.Provider value={value}>{children}</StudyStoreContext.Provider>
  );
}

export function useStudyStore(): StudyStoreValue {
  const value = useContext(StudyStoreContext);
  if (!value) {
    throw new Error("useStudyStore must be used within a StudyStoreProvider");
  }
  return value;
}
