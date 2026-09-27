import { DemoBanner } from "./components/DemoBanner";
import { AsterionExperimentPage } from "./components/AsterionExperimentPage";
import { LocaleProvider } from "./i18n/LocaleProvider";
import { StudyStoreProvider } from "./state/studyStore";

export default function App() {
  return (
    <LocaleProvider>
      <StudyStoreProvider>
        <DemoBanner />
        <AsterionExperimentPage />
      </StudyStoreProvider>
    </LocaleProvider>
  );
}
