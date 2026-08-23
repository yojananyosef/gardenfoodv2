import { describe, expect, it } from "vitest";
import { planAmount } from "@/lib/payments/plans";

describe("admin ops — MRR", () => {
  it("suma MRR active huertero 9990 + full 29990", () => {
    const h = planAmount("huertero", "monthly");
    const f = planAmount("full", "monthly");
    expect(h).toBe(9990);
    expect(f).toBe(29990);
    expect(h + f).toBe(39980);
  });

  it("yearly es 10x mensual", () => {
    expect(planAmount("huertero", "yearly")).toBe(99900);
    expect(planAmount("cosecha", "yearly")).toBe(199900);
  });
});

describe("admin ops — list users filtra plan", () => {
  it("isPaidTier", async () => {
    const { isPaidTier } = await import("@/lib/payments/plans");
    expect(isPaidTier("huertero")).toBe(true);
    expect(isPaidTier("gratuito")).toBe(false);
    expect(isPaidTier("admin")).toBe(false);
  });
});
