type BalanceLike = number | string | { toString(): string };

export function getAvailableBalance(seller: {
  pendingBalance: BalanceLike;
  lockedBalance: BalanceLike;
}): number {
  return Math.max(0, Number(seller.pendingBalance) - Number(seller.lockedBalance));
}
