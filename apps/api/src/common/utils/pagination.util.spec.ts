import { describe, it, expect } from "vitest";
import { parsePagination } from "./pagination.util";

describe("pagination.util parsePagination", () => {
  it("returns undefined skip/take when neither page nor limit is given (preserves old 'return everything' behavior)", () => {
    const result = parsePagination(undefined, undefined);
    expect(result.skip).toBeUndefined();
    expect(result.take).toBeUndefined();
  });

  it("defaults to page 1 when only limit is given", () => {
    const result = parsePagination(undefined, "20");
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(0);
    expect(result.take).toBe(20);
  });

  it("computes skip correctly for later pages", () => {
    const result = parsePagination("3", "10");
    expect(result.skip).toBe(20);
    expect(result.take).toBe(10);
  });

  it("caps limit at the max (200)", () => {
    const result = parsePagination("1", "10000");
    expect(result.take).toBe(200);
  });

  it("floors page at 1 for invalid/zero/negative input", () => {
    expect(parsePagination("0", "10").page).toBe(1);
    expect(parsePagination("-5", "10").page).toBe(1);
    expect(parsePagination("not-a-number", "10").page).toBe(1);
  });
});
