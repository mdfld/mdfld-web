export const PROFILE_TEMPLATES = Array.from({ length: 12 }, (_, i) => `/avatars/${i + 1}.png`);

export function randomTemplate(): string {
  return PROFILE_TEMPLATES[Math.floor(Math.random() * PROFILE_TEMPLATES.length)]!;
}
