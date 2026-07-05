import { describe, it, expect } from "vitest";
import { signJwt, verifyJwt, JwtVerificationError } from "./jwt.util";

describe("jwt.util", () => {
  const secret = "test-secret-at-least-8-chars";

  it("round-trips a payload through sign and verify", () => {
    const token = signJwt({ id: "u1", email: "a@b.com", role: "ADMIN" }, secret);
    const payload = verifyJwt(token, secret);
    expect(payload).toMatchObject({ id: "u1", email: "a@b.com", role: "ADMIN" });
  });

  it("produces a real three-part token with a non-trivial signature", () => {
    const token = signJwt({ id: "u1" }, secret);
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
    expect(parts[2]).not.toBe("");
    expect(parts[2]).not.toBe(Buffer.from("dummy-signature").toString("base64"));
  });

  it("rejects a token signed with a different secret", () => {
    const token = signJwt({ id: "u1" }, secret);
    expect(() => verifyJwt(token, "a-completely-different-secret")).toThrow(JwtVerificationError);
  });

  it("rejects a token with a tampered payload (e.g. role escalation)", () => {
    const token = signJwt({ id: "u1", role: "STAFF" }, secret);
    const [header, payload, signature] = token.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    decoded.role = "ADMIN";
    const forgedPayload = Buffer.from(JSON.stringify(decoded))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const forgedToken = `${header}.${forgedPayload}.${signature}`;
    expect(() => verifyJwt(forgedToken, secret)).toThrow(JwtVerificationError);
  });

  it("rejects an expired token", () => {
    const token = signJwt({ id: "u1", exp: Math.floor(Date.now() / 1000) - 10 }, secret);
    expect(() => verifyJwt(token, secret)).toThrow(JwtVerificationError);
  });

  it("accepts a token that hasn't expired yet", () => {
    const token = signJwt({ id: "u1", exp: Math.floor(Date.now() / 1000) + 60 }, secret);
    expect(() => verifyJwt(token, secret)).not.toThrow();
  });

  it("rejects a malformed token", () => {
    expect(() => verifyJwt("not-a-real-token", secret)).toThrow(JwtVerificationError);
  });
});
