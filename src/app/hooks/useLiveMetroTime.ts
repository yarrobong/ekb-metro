import { useState, useEffect } from "react";
import { getCurrentMetroTime } from "../../domain/time";
import type { MetroTime } from "../../domain/time";
import {
  METRO_E2E_TIME_EVENT,
  isMetroE2eTimeEnabled,
  readMetroE2eNow,
} from "../testing/e2eTime";

function readCurrentMetroTime(): MetroTime {
  return getCurrentMetroTime(readMetroE2eNow() ?? undefined);
}

export function useLiveMetroTime(): MetroTime {
  const [time, setTime] = useState<MetroTime>(readCurrentMetroTime);

  useEffect(() => {
    const syncTime = () => {
      setTime(readCurrentMetroTime());
    };

    const interval = setInterval(() => {
      syncTime();
    }, 1000);

    const handleFocus = () => syncTime();
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (isMetroE2eTimeEnabled()) {
      window.addEventListener(METRO_E2E_TIME_EVENT, syncTime);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (isMetroE2eTimeEnabled()) {
        window.removeEventListener(METRO_E2E_TIME_EVENT, syncTime);
      }
    };
  }, []);

  return time;
}
