import { describe, it, expect } from "vitest";
import { normaliseSize } from "@/lib/import/normalise-size";

describe("normaliseSize", () => {
  it("parses 'UK 9'", () => {
    expect(normaliseSize("UK 9")).toEqual({ sizeValue: "9", sizeSystem: "UK", sizeDisplay: "UK 9" });
  });
  it("parses 'UK9' (no space)", () => {
    expect(normaliseSize("UK9")).toEqual({ sizeValue: "9", sizeSystem: "UK", sizeDisplay: "UK 9" });
  });
  it("parses 'US 10'", () => {
    expect(normaliseSize("US 10")).toEqual({ sizeValue: "10", sizeSystem: "US", sizeDisplay: "US 10" });
  });
  it("parses '10 US'", () => {
    expect(normaliseSize("10 US")).toEqual({ sizeValue: "10", sizeSystem: "US", sizeDisplay: "US 10" });
  });
  it("parses EU by numeric range (43)", () => {
    expect(normaliseSize("43")).toEqual({ sizeValue: "43", sizeSystem: "EU", sizeDisplay: "EU 43" });
  });
  it("parses 'EU 43'", () => {
    expect(normaliseSize("EU 43")).toEqual({ sizeValue: "43", sizeSystem: "EU", sizeDisplay: "EU 43" });
  });
  it("parses 'M' as STANDARD", () => {
    expect(normaliseSize("M")).toEqual({ sizeValue: "M", sizeSystem: "STANDARD", sizeDisplay: "STANDARD M" });
  });
  it("parses 'XL' as STANDARD", () => {
    expect(normaliseSize("XL")).toEqual({ sizeValue: "XL", sizeSystem: "STANDARD", sizeDisplay: "STANDARD XL" });
  });
  it("parses 'One Size'", () => {
    expect(normaliseSize("One Size")).toEqual({ sizeValue: "ONE_SIZE", sizeSystem: "ONE_SIZE", sizeDisplay: "ONE_SIZE ONE_SIZE" });
  });
  it("parses 'OS'", () => {
    expect(normaliseSize("OS")).toEqual({ sizeValue: "ONE_SIZE", sizeSystem: "ONE_SIZE", sizeDisplay: "ONE_SIZE ONE_SIZE" });
  });
  it("returns null for unrecognised string", () => {
    expect(normaliseSize("weird size XYZ")).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(normaliseSize("")).toBeNull();
  });
});
