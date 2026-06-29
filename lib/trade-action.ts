export type TradeViewerRole = "proposer" | "recipient";

export interface TradeOfferActions {
  canAccept: boolean;
  canDecline: boolean;
  canCancel: boolean;
  canCounter: boolean;
  canUploadTracking: boolean;
  hasUploaded: boolean;
  canPay: boolean;
  isAwaitingPayment: boolean;
}

export function resolveTradeOfferActions(
  viewerRole: TradeViewerRole,
  status: string,
  viewerHasUploaded: boolean,
): TradeOfferActions {
  const none: TradeOfferActions = {
    canAccept: false,
    canDecline: false,
    canCancel: false,
    canCounter: false,
    canUploadTracking: false,
    hasUploaded: false,
    canPay: false,
    isAwaitingPayment: false,
  };

  if (status === "PENDING") {
    if (viewerRole === "recipient") return { ...none, canAccept: true, canDecline: true, canCounter: true };
    if (viewerRole === "proposer") return { ...none, canCancel: true };
    return none;
  }

  if (status === "COUNTERED") {
    if (viewerRole === "proposer") return { ...none, canAccept: true, canDecline: true };
    return none;
  }

  if (status === "AWAITING_PAYMENT") {
    if (viewerRole === "proposer") return { ...none, canPay: true };
    if (viewerRole === "recipient") return { ...none, isAwaitingPayment: true };
    return none;
  }

  if (status === "ACCEPTED" || status === "SHIPPING") {
    return {
      ...none,
      canUploadTracking: !viewerHasUploaded,
      hasUploaded: viewerHasUploaded,
    };
  }

  return none;
}
