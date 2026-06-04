export type TradeViewerRole = "proposer" | "recipient";

export interface TradeOfferActions {
  canAccept: boolean;
  canDecline: boolean;
  canCancel: boolean;
  canUploadTracking: boolean;
  hasUploaded: boolean;
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
    canUploadTracking: false,
    hasUploaded: false,
  };

  if (status === "PENDING") {
    if (viewerRole === "recipient") return { ...none, canAccept: true, canDecline: true };
    if (viewerRole === "proposer") return { ...none, canCancel: true };
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
