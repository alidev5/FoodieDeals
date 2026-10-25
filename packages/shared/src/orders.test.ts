import { describe, expect, it } from "vitest";

import { canTransition, nextAction, toCustomerSteps } from "./orders";

describe("canTransition", () => {
  it("allows each step of the happy path", () => {
    expect(canTransition("WAITING", "ACCEPTED")).toBe(true);
    expect(canTransition("ACCEPTED", "READY")).toBe(true);
    expect(canTransition("READY", "PICKED_UP")).toBe(true);
  });

  it("rejects skipping a step", () => {
    expect(canTransition("WAITING", "READY")).toBe(false);
    expect(canTransition("WAITING", "PICKED_UP")).toBe(false);
  });

  it("rejects moving backwards", () => {
    expect(canTransition("ACCEPTED", "WAITING")).toBe(false);
  });

  it("rejects any transition out of a terminal state", () => {
    expect(canTransition("PICKED_UP", "WAITING")).toBe(false);
  });
});

describe("nextAction", () => {
  it("maps each status to its restaurant button", () => {
    expect(nextAction("WAITING")).toEqual({ label: "Accept", next: "ACCEPTED" });
    expect(nextAction("ACCEPTED")).toEqual({ label: "Mark ready", next: "READY" });
    expect(nextAction("READY")).toEqual({ label: "Picked up", next: "PICKED_UP" });
  });

  it("returns null for the terminal state", () => {
    expect(nextAction("PICKED_UP")).toBeNull();
  });
});

describe("toCustomerSteps", () => {
  it("marks only Waiting as active on WAITING", () => {
    const steps = toCustomerSteps("WAITING");
    expect(steps.map((step) => step.state)).toEqual(["active", "upcoming", "upcoming", "upcoming"]);
  });

  it("marks Accepted done and Preparing active on ACCEPTED", () => {
    const steps = toCustomerSteps("ACCEPTED");
    expect(steps.map((step) => step.state)).toEqual(["done", "done", "active", "upcoming"]);
  });

  it("marks everything up to Ready done, Ready active on READY", () => {
    const steps = toCustomerSteps("READY");
    expect(steps.map((step) => step.state)).toEqual(["done", "done", "done", "active"]);
  });

  it("marks every step done on PICKED_UP", () => {
    const steps = toCustomerSteps("PICKED_UP");
    expect(steps.map((step) => step.state)).toEqual(["done", "done", "done", "done"]);
  });
});
