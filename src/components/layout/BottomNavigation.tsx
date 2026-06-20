import { Clock3, MapPinned, Settings } from "lucide-react";

import { useAppStore } from "../../app/store";
import type { AppScreen } from "../../app/app.types";
import { cn } from "../../lib/cn";

interface NavigationItem {
  screen: AppScreen;
  label: string;
  icon: typeof MapPinned;
}

const navigationItems: NavigationItem[] = [
  {
    screen: "stations",
    label: "Станции",
    icon: MapPinned,
  },
  {
    screen: "trains",
    label: "Поезда",
    icon: Clock3,
  },
  {
    screen: "settings",
    label: "Настройки",
    icon: Settings,
  },
];

export function BottomNavigation() {
  const activeScreen = useAppStore((state) => state.screen);
  const setScreen = useAppStore((state) => state.setScreen);
  const activeRootScreen =
    activeScreen === "about" || activeScreen === "install" ? "settings" : activeScreen;

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-light bg-app-bg/95 pb-[env(safe-area-inset-bottom)] shadow-navigation backdrop-blur-xl"
    >
      <div className="mx-auto grid max-w-[520px] grid-cols-3 px-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeRootScreen === item.screen;

          return (
            <button
              key={item.screen}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                setScreen(item.screen);
              }}
              className={cn(
                "focus-ring flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-medium transition",
                isActive ? "text-accent" : "text-text-secondary hover:text-text-primary",
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />

              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
