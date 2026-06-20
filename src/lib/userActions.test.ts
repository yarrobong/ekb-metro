import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { reportIssue } from "./userActions";

describe("reportIssue", () => {
  const originalWindowOpen = window.open;

  beforeEach(() => {
    window.open = vi.fn();
  });

  afterEach(() => {
    window.open = originalWindowOpen;
  });

  it("opens GitHub Issues with a prefilled template", () => {
    reportIssue({
      stationId: "geologicheskaya",
      directionId: "to-botanicheskaya",
      destinationId: "botanicheskaya",
      metroState: null,
    });

    expect(window.open).toHaveBeenCalledTimes(1);

    const [url, target, features] = vi.mocked(window.open).mock.calls[0] ?? [];
    expect(url).toContain("https://github.com/yarrobong/ekb-metro/issues/new?");
    expect(url).toContain("title=");
    expect(url).toContain("body=");
    expect(url).toContain(
      "%D0%93%D0%B5%D0%BE%D0%BB%D0%BE%D0%B3%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B0%D1%8F",
    );
    expect(target).toBe("_blank");
    expect(features).toBe("noopener,noreferrer");
  });
});
