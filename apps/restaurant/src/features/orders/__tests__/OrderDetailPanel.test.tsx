import { ThemeProvider } from "@foodiedeals/ui-native";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { OrderDetailPanel } from "../components/OrderDetailPanel";
import { RESTAURANT_ORDERS_FIXTURE } from "../fixtures/ordersFixture";

function findOrder(id: string) {
  const order = RESTAURANT_ORDERS_FIXTURE.find((candidate) => candidate.id === id);
  if (!order) throw new Error(`missing fixture order ${id}`);
  return order;
}

function renderPanel(orderId: string, onAdvance: (orderId: string) => void = () => undefined) {
  return render(
    <ThemeProvider>
      <OrderDetailPanel order={findOrder(orderId)} onAdvance={onAdvance} />
    </ThemeProvider>,
  );
}

describe("OrderDetailPanel action button", () => {
  it("shows Accept for a waiting order and advances it on press", () => {
    const onAdvance = jest.fn();
    renderPanel("order-1", onAdvance);

    fireEvent.press(screen.getByText("Accept"));
    expect(onAdvance).toHaveBeenCalledWith("order-1");
  });

  it("shows Mark ready for an accepted order", () => {
    renderPanel("order-3");
    expect(screen.getByText("Mark ready")).toBeTruthy();
  });

  it("shows Picked up for a ready order and advances it on press", () => {
    const onAdvance = jest.fn();
    renderPanel("order-4", onAdvance);

    fireEvent.press(screen.getByText("Picked up"));
    expect(onAdvance).toHaveBeenCalledWith("order-4");
  });

  it("does not call onAdvance once the order is already picked up", () => {
    const onAdvance = jest.fn();
    renderPanel("order-5", onAdvance);

    fireEvent.press(screen.getByText("Picked up"));
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it("prompts selection when no order is active", () => {
    render(
      <ThemeProvider>
        <OrderDetailPanel order={null} onAdvance={() => undefined} />
      </ThemeProvider>,
    );
    expect(screen.getByText("Select an order")).toBeTruthy();
  });
});
