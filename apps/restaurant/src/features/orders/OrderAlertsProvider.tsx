import { createContext, useContext, type PropsWithChildren } from "react";

import { NewOrderToasts } from "./components/NewOrderToasts";
import { useOrderAlerts } from "./hooks/useOrderAlerts";

const HighlightedOrderContext = createContext<string | null>(null);

/**
 * Owns the restaurant's live order updates for the whole app, so the chime and the new-order toast
 * work on every dashboard page, not only on Orders.
 */
export function OrderAlertsProvider({ children }: PropsWithChildren) {
  const { highlightedOrderId, alerts, dismissAlert } = useOrderAlerts();

  return (
    <HighlightedOrderContext.Provider value={highlightedOrderId}>
      {children}
      <NewOrderToasts alerts={alerts} onDismiss={dismissAlert} />
    </HighlightedOrderContext.Provider>
  );
}

export function useHighlightedOrderId(): string | null {
  return useContext(HighlightedOrderContext);
}
