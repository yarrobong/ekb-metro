import { useEffect, useState } from "react";

const launchScreenIconSrc = `${import.meta.env.BASE_URL}pwa-192x192.png`;

function getInitialReducedMotionPreference() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface LaunchScreenProps {
  showStatus: boolean;
}

export function LaunchScreen({ showStatus }: LaunchScreenProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    getInitialReducedMotionPreference,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <div
      className="launch-screen app-safe-area"
      data-reduced-motion={prefersReducedMotion}
    >
      <div className="launch-screen__panel">
        <div className="launch-screen__mark" aria-hidden="true">
          <img
            className="launch-screen__mark-image"
            src={launchScreenIconSrc}
            width={80}
            height={80}
            alt=""
          />
        </div>

        <p className="launch-screen__eyebrow">Екатеринбургский метрополитен</p>
        <h1 className="launch-screen__title">Метро Екатеринбурга</h1>

        <div className="launch-screen__signal" aria-hidden="true">
          <span
            className={
              prefersReducedMotion
                ? "launch-screen__signal-dot"
                : "launch-screen__signal-dot launch-screen__signal-dot--animated"
            }
          />
        </div>

        <p
          className="launch-screen__status"
          role="status"
          aria-live="polite"
          data-visible={showStatus}
        >
          Загружаем расписание
        </p>
      </div>
    </div>
  );
}
