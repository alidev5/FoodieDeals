import { ThemeProvider } from "@foodiedeals/ui-native";
import { render, screen } from "@testing-library/react-native";

import { PriceSummary } from "../components/PriceSummary";

const quote = {
  subtotalCents: 2800,
  discountCents: 560,
  taxCents: 199,
  totalCents: 2439,
  platformFeeCents: 122,
  restaurantReceivesCents: 2317,
  appliedDeal: null,
  dealEvaluations: [],
};

function renderWithTheme(children: React.ReactElement) {
  return render(<ThemeProvider>{children}</ThemeProvider>);
}

describe("PriceSummary", () => {
  it("renders the worked-example totals", () => {
    renderWithTheme(<PriceSummary quote={quote} />);

    expect(screen.getByText("$28.00")).toBeTruthy();
    expect(screen.getByText("-$5.60")).toBeTruthy();
    expect(screen.getByText("$1.99")).toBeTruthy();
    expect(screen.getByText("$24.39")).toBeTruthy();
    expect(screen.getByText("$0.00 · pickup")).toBeTruthy();
  });

  it("hides the deal savings row when nothing was discounted", () => {
    renderWithTheme(<PriceSummary quote={{ ...quote, discountCents: 0 }} />);

    expect(screen.queryByText(/Deal savings/)).toBeNull();
  });
});
