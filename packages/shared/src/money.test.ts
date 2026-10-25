import { describe, expect, it } from "vitest";

import { addCents, formatCents, percentOfCents, roundHalfUpToCents } from "./money";

describe("roundHalfUpToCents", () => {
  it("rounds .5 up", () => {
    expect(roundHalfUpToCents(121.5)).toBe(122);
  });

  it("rounds down below .5", () => {
    expect(roundHalfUpToCents(121.49)).toBe(121);
  });

  it("rounds exact values unchanged", () => {
    expect(roundHalfUpToCents(560)).toBe(560);
  });
});

describe("percentOfCents", () => {
  it("computes the worked example discount", () => {
    expect(percentOfCents(2800, 20)).toBe(560);
  });

  it("rounds the result half-up", () => {
    expect(percentOfCents(2439, 5)).toBe(122);
  });
});

describe("addCents", () => {
  it("sums a list of cent values", () => {
    expect(addCents(1600, 1200)).toBe(2800);
  });

  it("returns zero for an empty list", () => {
    expect(addCents()).toBe(0);
  });
});

describe("formatCents", () => {
  it("formats whole dollars", () => {
    expect(formatCents(2439)).toBe("$24.39");
  });

  it("pads single-digit cents", () => {
    expect(formatCents(105)).toBe("$1.05");
  });

  it("formats negative values", () => {
    expect(formatCents(-199)).toBe("-$1.99");
  });
});
