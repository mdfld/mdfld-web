import { describe, it, expect } from 'vitest';
import {
  getCategoryGroup,
  WEARABLE_CONDITIONS,
  COLLECTIBLE_CONDITIONS,
  FOOTBALL_CONDITIONS,
  BALL_GRADES,
  BALL_SIZE_LABELS,
  COLLECTIBLE_SUBCATEGORIES,
  FOOTBALL_CONDITION_LABELS,
} from '@/lib/constants/product-categories';

describe('getCategoryGroup', () => {
  it('returns WEARABLE for JERSEYS', () => {
    expect(getCategoryGroup('JERSEYS')).toBe('WEARABLE');
  });
  it('returns WEARABLE for BOOTS', () => {
    expect(getCategoryGroup('BOOTS')).toBe('WEARABLE');
  });
  it('returns WEARABLE for GOALKEEPER_GLOVES', () => {
    expect(getCategoryGroup('GOALKEEPER_GLOVES')).toBe('WEARABLE');
  });
  it('returns WEARABLE for SHIN_GUARDS', () => {
    expect(getCategoryGroup('SHIN_GUARDS')).toBe('WEARABLE');
  });
  it('returns WEARABLE for TRAINING_EQUIPMENT', () => {
    expect(getCategoryGroup('TRAINING_EQUIPMENT')).toBe('WEARABLE');
  });
  it('returns WEARABLE for ACCESSORIES', () => {
    expect(getCategoryGroup('ACCESSORIES')).toBe('WEARABLE');
  });
  it('returns COLLECTIBLE for COLLECTIBLES', () => {
    expect(getCategoryGroup('COLLECTIBLES')).toBe('COLLECTIBLE');
  });
  it('returns FOOTBALL for FOOTBALLS', () => {
    expect(getCategoryGroup('FOOTBALLS')).toBe('FOOTBALL');
  });
  it('defaults to WEARABLE for unknown category', () => {
    expect(getCategoryGroup('UNKNOWN')).toBe('WEARABLE');
  });
});

describe('condition constants', () => {
  it('WEARABLE_CONDITIONS includes BRAND_NEW', () => {
    expect(WEARABLE_CONDITIONS.map(c => c.key)).toContain('BRAND_NEW');
  });
  it('COLLECTIBLE_CONDITIONS includes MINT and POOR', () => {
    const keys = COLLECTIBLE_CONDITIONS.map(c => c.key);
    expect(keys).toContain('MINT');
    expect(keys).toContain('POOR');
  });
  it('FOOTBALL_CONDITIONS labels BRAND_NEW as New in Box', () => {
    const match = FOOTBALL_CONDITIONS.find(c => c.key === 'BRAND_NEW');
    expect(match?.label).toBe('New in Box');
  });
  it('FOOTBALL_CONDITION_LABELS maps BRAND_NEW to New in Box', () => {
    expect(FOOTBALL_CONDITION_LABELS['BRAND_NEW']).toBe('New in Box');
  });
});

describe('ball constants', () => {
  it('BALL_GRADES has 6 entries', () => {
    expect(BALL_GRADES).toHaveLength(6);
  });
  it('BALL_SIZE_LABELS covers sizes 1 through 5', () => {
    expect(Object.keys(BALL_SIZE_LABELS).map(Number).sort()).toEqual([1, 2, 3, 4, 5]);
  });
  it('size 5 label mentions Professional', () => {
    expect(BALL_SIZE_LABELS[5]).toContain('Professional');
  });
});

describe('collectible constants', () => {
  it('COLLECTIBLE_SUBCATEGORIES includes STICKERS and TRADING_CARDS', () => {
    const keys = COLLECTIBLE_SUBCATEGORIES.map(s => s.key);
    expect(keys).toContain('STICKERS');
    expect(keys).toContain('TRADING_CARDS');
  });
});
