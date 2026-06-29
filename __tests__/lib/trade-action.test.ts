import { describe, it, expect } from "vitest";
import { resolveTradeOfferActions } from "@/lib/trade-action";

describe("resolveTradeOfferActions", () => {
  it("recipient + PENDING: can accept and decline", () => {
    const actions = resolveTradeOfferActions("recipient", "PENDING", false);
    expect(actions.canAccept).toBe(true);
    expect(actions.canDecline).toBe(true);
    expect(actions.canCancel).toBe(false);
    expect(actions.canUploadTracking).toBe(false);
  });

  it("proposer + PENDING: can only cancel", () => {
    const actions = resolveTradeOfferActions("proposer", "PENDING", false);
    expect(actions.canAccept).toBe(false);
    expect(actions.canDecline).toBe(false);
    expect(actions.canCancel).toBe(true);
    expect(actions.canUploadTracking).toBe(false);
  });

  it("either party + ACCEPTED: can upload tracking when not yet uploaded", () => {
    const p = resolveTradeOfferActions("proposer", "ACCEPTED", false);
    const r = resolveTradeOfferActions("recipient", "ACCEPTED", false);
    expect(p.canUploadTracking).toBe(true);
    expect(r.canUploadTracking).toBe(true);
    expect(p.hasUploaded).toBe(false);
  });

  it("either party + ACCEPTED: canUploadTracking false when already uploaded", () => {
    const actions = resolveTradeOfferActions("proposer", "ACCEPTED", true);
    expect(actions.canUploadTracking).toBe(false);
    expect(actions.hasUploaded).toBe(true);
  });

  it("SHIPPING behaves the same as ACCEPTED for upload tracking", () => {
    const actions = resolveTradeOfferActions("recipient", "SHIPPING", false);
    expect(actions.canUploadTracking).toBe(true);
  });

  it("COMPLETED: no actions", () => {
    const actions = resolveTradeOfferActions("proposer", "COMPLETED", true);
    expect(actions.canAccept).toBe(false);
    expect(actions.canDecline).toBe(false);
    expect(actions.canCancel).toBe(false);
    expect(actions.canUploadTracking).toBe(false);
  });

  it("recipient + PENDING: canCounter is true", () => {
    const actions = resolveTradeOfferActions("recipient", "PENDING", false);
    expect(actions.canCounter).toBe(true);
  });

  it("proposer + PENDING: canCounter is false", () => {
    const actions = resolveTradeOfferActions("proposer", "PENDING", false);
    expect(actions.canCounter).toBe(false);
  });

  it("proposer + COUNTERED: can accept and decline", () => {
    const actions = resolveTradeOfferActions("proposer", "COUNTERED", false);
    expect(actions.canAccept).toBe(true);
    expect(actions.canDecline).toBe(true);
    expect(actions.canCounter).toBe(false);
    expect(actions.canCancel).toBe(false);
  });

  it("recipient + COUNTERED: no actions (waiting on proposer)", () => {
    const actions = resolveTradeOfferActions("recipient", "COUNTERED", false);
    expect(actions.canAccept).toBe(false);
    expect(actions.canDecline).toBe(false);
    expect(actions.canCounter).toBe(false);
    expect(actions.canCancel).toBe(false);
  });

  it("DECLINED: no actions for either party", () => {
    const p = resolveTradeOfferActions("proposer", "DECLINED", false);
    const r = resolveTradeOfferActions("recipient", "DECLINED", false);
    expect(p.canCancel).toBe(false);
    expect(r.canDecline).toBe(false);
  });

  it("proposer + AWAITING_PAYMENT: canPay only", () => {
    const actions = resolveTradeOfferActions("proposer", "AWAITING_PAYMENT", false);
    expect(actions.canPay).toBe(true);
    expect(actions.isAwaitingPayment).toBe(false);
    expect(actions.canAccept).toBe(false);
    expect(actions.canDecline).toBe(false);
    expect(actions.canCancel).toBe(false);
  });

  it("recipient + AWAITING_PAYMENT: isAwaitingPayment only", () => {
    const actions = resolveTradeOfferActions("recipient", "AWAITING_PAYMENT", false);
    expect(actions.isAwaitingPayment).toBe(true);
    expect(actions.canPay).toBe(false);
    expect(actions.canAccept).toBe(false);
  });
});
