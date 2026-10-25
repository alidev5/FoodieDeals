import { ThemeProvider } from "@foodiedeals/ui-native";
import { render, screen } from "@testing-library/react-native";

import { Tracker } from "../components/Tracker";

function renderTracker(status: "WAITING" | "ACCEPTED" | "READY" | "PICKED_UP") {
  return render(
    <ThemeProvider>
      <Tracker status={status} />
    </ThemeProvider>,
  );
}

describe("Tracker", () => {
  it("renders all four step labels", () => {
    renderTracker("WAITING");

    expect(screen.getByText("Waiting")).toBeTruthy();
    expect(screen.getByText("Accepted")).toBeTruthy();
    expect(screen.getByText("Preparing")).toBeTruthy();
    expect(screen.getByText("Ready")).toBeTruthy();
  });

  it("re-renders without crashing across every status", () => {
    for (const status of ["WAITING", "ACCEPTED", "READY", "PICKED_UP"] as const) {
      expect(() => renderTracker(status)).not.toThrow();
    }
  });
});
