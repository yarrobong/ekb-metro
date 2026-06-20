import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { useAppStore } from "../../app/store";
import { metadata } from "../../data/metadata";
import { reportIssue } from "../../lib/userActions";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorCode: string;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  override state: AppErrorBoundaryState = {
    hasError: false,
    errorCode: "ui-unknown",
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return {
      hasError: true,
      errorCode: "ui-unknown",
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    void error;
    void errorInfo;
    this.setState({ errorCode: "ui-react-critical" });
  }

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="app-safe-area flex min-h-screen items-center justify-center bg-app-bg px-4">
        <Card className="w-full max-w-[520px] text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-danger/15 text-danger">
            <AlertTriangle size={28} aria-hidden="true" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-text-primary">
            Что-то пошло не так
          </h1>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            Не удалось корректно открыть приложение. Попробуйте обновить страницу или
            начать выбор станции заново.
          </p>

          <div className="mt-6 grid gap-3">
            <Button
              onClick={() => {
                window.location.reload();
              }}
            >
              <RefreshCcw size={16} aria-hidden="true" />
              Повторить
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                const store = useAppStore.getState();
                store.clearSelection();
                store.setScreen("stations");
                this.setState({ hasError: false, errorCode: "ui-unknown" });
              }}
            >
              Начать заново
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                const state = useAppStore.getState();
                reportIssue({
                  stationId: state.selectedStationId,
                  directionId: state.selectedDirectionId,
                  destinationId: state.selectedDestinationId,
                  metroState: null,
                });
              }}
            >
              Сообщить об ошибке
            </Button>
          </div>

          <p className="mt-5 text-xs text-text-secondary">
            Код проблемы: {this.state.errorCode} · Версия {metadata.appVersion}
          </p>
        </Card>
      </div>
    );
  }
}
