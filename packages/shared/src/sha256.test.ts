import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { sha256Hex } from "./sha256";

describe("sha256Hex", () => {
  it.each(["", "abc", "restaurant:miso-ember:MISO-0001", "é€😀", "x".repeat(1000)])(
    "matches Node's implementation for %j",
    (input) => {
      expect(sha256Hex(input)).toBe(createHash("sha256").update(input, "utf8").digest("hex"));
    },
  );
});
