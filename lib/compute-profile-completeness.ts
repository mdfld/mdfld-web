interface CompletenessInput {
  imageUrl?: string;
  bio?: string;
  location?: string;
  bannerUrl?: string;
}

export function computeCompleteness({ imageUrl, bio, location, bannerUrl }: CompletenessInput): number {
  let score = 0;
  if (imageUrl?.startsWith("https://")) score += 25;
  if (bio?.trim()) score += 25;
  if (location?.trim()) score += 25;
  if (bannerUrl?.trim()) score += 25;
  return score;
}
