import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PwaProvider } from "../../app/PwaContext";
import { useAppStore } from "../../app/store";
import {
  currentUpdateMetadata,
  type UpdateMetadata,
} from "../../app/update/updateMetadata";
import { ToastViewport } from "../ui/ToastViewport";
import {
  getRegisterSWOptions,
  resetPwaRegisterMock,
  updateServiceWorkerMock,
} from "../../test/mocks/pwa-register-react";
import { PwaUpdateBanner } from "./PwaUpdateBanner";

const fetchMock = vi.fn<typeof fetch>();

vi.stubGlobal("fetch", fetchMock);

function createUpdateMetadata(overrides: Partial<UpdateMetadata>): UpdateMetadata {
  return {
    ...currentUpdateMetadata,
    ...overrides,
  };
}

function createRegistration(waiting = false) {
  const updateMock = vi.fn().mockResolvedValue(undefined);

  return {
    waiting: waiting ? ({} as ServiceWorker) : undefined,
    update: updateMock,
  } as unknown as ServiceWorkerRegistration & { update: typeof updateMock };
}

function registerServiceWorker(registration: ServiceWorkerRegistration) {
  act(() => {
    getRegisterSWOptions()?.onRegisteredSW?.("/sw.js", registration);
  });
}

function mockMetadataResponse(metadata: UpdateMetadata) {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(metadata),
  } as Response);
}

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value,
  });
}

function renderBanner() {
  return render(
    <PwaProvider>
      <PwaUpdateBanner />
      <ToastViewport />
    </PwaProvider>,
  );
}

describe("PwaUpdateBanner", () => {
  beforeEach(() => {
    resetPwaRegisterMock();
    fetchMock.mockReset();
    setNavigatorOnline(true);
    useAppStore.setState({
      activeToast: null,
    });
  });

  it("does not show a banner when no update is available", async () => {
    const registration = createRegistration();
    mockMetadataResponse(currentUpdateMetadata);

    renderBanner();
    registerServiceWorker(registration);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.queryByRole("button", {
        name: "Обновить",
      }),
    ).not.toBeInTheDocument();
  });

  it("shows schedule update details", async () => {
    const registration = createRegistration(true);
    mockMetadataResponse(
      createUpdateMetadata({
        scheduleVersion: "2024-01-01:2024-03-15",
        updateType: "schedule",
        updateSummary: "Обновлено расписание поездов.",
      }),
    );

    renderBanner();
    registerServiceWorker(registration);

    expect(await screen.findByText("Обновлено расписание")).toBeInTheDocument();
    expect(screen.getByText("Обновлено расписание поездов.")).toBeInTheDocument();
  });

  it("shows app update details", async () => {
    const registration = createRegistration(true);
    mockMetadataResponse(
      createUpdateMetadata({
        appVersion: "1.0.1",
        updateType: "fix",
        updateSummary: "Исправлена работа таймера.",
      }),
    );

    renderBanner();
    registerServiceWorker(registration);

    expect(await screen.findByText("Исправлена работа приложения")).toBeInTheDocument();
    expect(screen.getByText("Исправлена работа таймера.")).toBeInTheDocument();
  });

  it("shows combined update details", async () => {
    const registration = createRegistration(true);
    mockMetadataResponse(
      createUpdateMetadata({
        appVersion: "1.0.1",
        scheduleVersion: "2024-01-01:2024-03-15",
        updateType: "schedule-and-app",
        updateSummary: "Обновлено расписание поездов и приложение.",
      }),
    );

    renderBanner();
    registerServiceWorker(registration);

    expect(
      await screen.findByText("Обновлено расписание и приложение"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Обновлено расписание поездов и приложение."),
    ).toBeInTheDocument();
  });

  it("hides the banner after clicking later", async () => {
    const user = userEvent.setup();
    const registration = createRegistration(true);
    mockMetadataResponse(
      createUpdateMetadata({
        appVersion: "1.0.1",
        updateType: "improvements",
        updateSummary: "Доступна новая версия приложения.",
      }),
    );

    renderBanner();
    registerServiceWorker(registration);

    await user.click(await screen.findByRole("button", { name: "Позже" }));

    expect(
      screen.queryByText("Доступна новая версия приложения"),
    ).not.toBeInTheDocument();
  });

  it("applies the update when the user confirms", async () => {
    const user = userEvent.setup();
    const registration = createRegistration(true);
    let resolveUpdate: (() => void) | null = null;

    updateServiceWorkerMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdate = resolve;
        }),
    );

    mockMetadataResponse(
      createUpdateMetadata({
        appVersion: "1.0.1",
        updateType: "improvements",
        updateSummary: "Доступна новая версия приложения.",
      }),
    );

    renderBanner();
    registerServiceWorker(registration);

    const updateButton = await screen.findByRole("button", { name: "Обновить" });
    await user.click(updateButton);

    expect(updateServiceWorkerMock).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Обновляем..." })).toBeDisabled();

    expect(resolveUpdate).not.toBeNull();
    resolveUpdate!();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Обновить" })).toBeEnabled();
    });
  });

  it("keeps repeated update clicks blocked while activation is in progress", async () => {
    const user = userEvent.setup();
    const registration = createRegistration(true);

    updateServiceWorkerMock.mockImplementationOnce(
      () => new Promise<void>(() => undefined),
    );

    mockMetadataResponse(
      createUpdateMetadata({
        appVersion: "1.0.1",
        updateType: "improvements",
        updateSummary: "Доступна новая версия приложения.",
      }),
    );

    renderBanner();
    registerServiceWorker(registration);

    const updateButton = await screen.findByRole("button", { name: "Обновить" });
    await user.click(updateButton);
    await user.click(screen.getByRole("button", { name: "Обновляем..." }));

    expect(updateServiceWorkerMock).toHaveBeenCalledTimes(1);
  });

  it("shows an error toast when activation fails", async () => {
    const user = userEvent.setup();
    const registration = createRegistration(true);

    updateServiceWorkerMock.mockRejectedValueOnce(new Error("activation failed"));

    mockMetadataResponse(
      createUpdateMetadata({
        appVersion: "1.0.1",
        updateType: "fix",
        updateSummary: "Исправлена работа таймера.",
      }),
    );

    renderBanner();
    registerServiceWorker(registration);

    await user.click(await screen.findByRole("button", { name: "Обновить" }));

    expect(await screen.findByText("Не удалось обновить приложение")).toBeInTheDocument();
  });

  it("stays quiet when the device is offline", async () => {
    const registration = createRegistration(true);
    setNavigatorOnline(false);

    renderBanner();
    registerServiceWorker(registration);

    await waitFor(() => {
      expect(
        (registration as { update: ReturnType<typeof vi.fn> }).update,
      ).not.toHaveBeenCalled();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Нет подключения к интернету")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Обновить" })).not.toBeInTheDocument();
  });
});
