import { describe, it, expect } from "vitest";
import { normalizePhone } from "./phone.util";

describe("phone.util normalizePhone", () => {
  it("strips spaces and dashes", () => {
    expect(normalizePhone("0987 654 321")).toBe("0987654321");
    expect(normalizePhone("0987-654-321")).toBe("0987654321");
  });

  it("collapses a +84 country code prefix to a leading 0", () => {
    expect(normalizePhone("+84987654321")).toBe("0987654321");
  });

  it("collapses an 84 prefix (no plus) to a leading 0", () => {
    expect(normalizePhone("84987654321")).toBe("0987654321");
  });

  it("leaves an already-normalized number unchanged", () => {
    expect(normalizePhone("0987654321")).toBe("0987654321");
  });

  it("makes differently-formatted inputs for the same number converge", () => {
    const variants = ["0987654321", "+84 987 654 321", "84-987-654-321", "0987 654 321"];
    const normalized = variants.map(normalizePhone);
    expect(new Set(normalized).size).toBe(1);
  });

  it("does not misfire on a short number that happens to start with 84", () => {
    // A local number this short isn't a country-code case — length guard in
    // normalizePhone requires >9 digits before treating a leading 84 as a
    // country code, so this shouldn't get mangled.
    expect(normalizePhone("8412345")).toBe("8412345");
  });
});
