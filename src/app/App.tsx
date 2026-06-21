import { AboutPage } from "../pages/AboutPage";
import { ArrivalPlanPage } from "../pages/ArrivalPlanPage";
import { InstallPage } from "../pages/InstallPage";
import { SchedulePage } from "../pages/SchedulePage";
import { SettingsPage } from "../pages/SettingsPage";
import { StationsPage } from "../pages/StationsPage";
import { TrainsPage } from "../pages/TrainsPage";
import { AppShell } from "./AppShell";
import { useAppStore } from "./store";

export function App() {
  const screen = useAppStore((state) => state.screen);

  return (
    <AppShell>
      {screen === "stations" && <StationsPage />}
      {screen === "trains" && <TrainsPage />}
      {screen === "schedule" && <SchedulePage />}
      {screen === "arrival-plan" && <ArrivalPlanPage />}
      {screen === "settings" && <SettingsPage />}
      {screen === "about" && <AboutPage />}
      {screen === "install" && <InstallPage />}
    </AppShell>
  );
}
