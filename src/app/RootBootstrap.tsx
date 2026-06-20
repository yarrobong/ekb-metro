import { useEffect, useState, type ComponentType } from "react";

import { LaunchScreen } from "./LaunchScreen";
import { LAUNCH_STATUS_DELAY_MS, initializeApplication } from "./initializeApplication";

type BootstrapState =
  | {
      status: "loading";
    }
  | {
      status: "ready";
      AppComponent: ComponentType;
    }
  | {
      status: "error";
      error: Error;
    };

export function RootBootstrap() {
  const [showStatus, setShowStatus] = useState(false);
  const [state, setState] = useState<BootstrapState>({
    status: "loading",
  });

  useEffect(() => {
    let isActive = true;

    const statusTimer = window.setTimeout(() => {
      if (isActive) {
        setShowStatus(true);
      }
    }, LAUNCH_STATUS_DELAY_MS);

    void initializeApplication().then(
      (AppComponent) => {
        if (!isActive) {
          return;
        }

        window.clearTimeout(statusTimer);
        setState({
          status: "ready",
          AppComponent,
        });
      },
      (error: unknown) => {
        if (!isActive) {
          return;
        }

        window.clearTimeout(statusTimer);
        setState({
          status: "error",
          error:
            error instanceof Error ? error : new Error("Не удалось открыть приложение"),
        });
      },
    );

    return () => {
      isActive = false;
      window.clearTimeout(statusTimer);
    };
  }, []);

  if (state.status === "error") {
    throw state.error;
  }

  if (state.status === "ready") {
    const { AppComponent } = state;
    return <AppComponent />;
  }

  return <LaunchScreen showStatus={showStatus} />;
}
