export type SellerAction = "message" | "edit" | "guest" | "hidden";

export function resolveSellerAction(
  currentUserId: string | undefined,
  sellerId: string | undefined,
): SellerAction {
  if (!sellerId) return "hidden";
  if (!currentUserId) return "guest";
  if (currentUserId === sellerId) return "edit";
  return "message";
}
