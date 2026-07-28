import { describe, expect, it } from 'vitest';

import {
  BILL_DETAIL_DATA_LEVEL,
  type BillDetailDataLevel,
  dataLevelAtLeast,
  dataLevelRose,
} from './data-level.constants';

const { SKELETON, SEED, FULL } = BILL_DETAIL_DATA_LEVEL;

/** Every ordered pair on the ladder, lower → higher. */
const CLIMBS: Array<[BillDetailDataLevel, BillDetailDataLevel]> = [
  [SKELETON, SEED],
  [SKELETON, FULL],
  [SEED, FULL],
];

describe('dataLevelRose', () => {
  it('is true exactly for a climb (strictly richer record)', () => {
    for (const [prev, next] of CLIMBS) {
      expect(dataLevelRose(prev, next)).toBe(true);
    }
  });

  it('is false for a same-level replacement — a background revalidation must not reset', () => {
    for (const level of [SKELETON, SEED, FULL]) {
      expect(dataLevelRose(level, level)).toBe(false);
    }
  });

  it('is false for a descent — the ladder never resets downward', () => {
    for (const [lower, higher] of CLIMBS) {
      expect(dataLevelRose(higher, lower)).toBe(false);
    }
  });
});

describe('dataLevelAtLeast', () => {
  it('a level satisfies itself — a section paints the moment ITS data arrives', () => {
    for (const level of [SKELETON, SEED, FULL]) {
      expect(dataLevelAtLeast(level, level)).toBe(true);
    }
  });

  it('header concerns (need seed) are real from seed up, skeleton below', () => {
    expect(dataLevelAtLeast(SKELETON, SEED)).toBe(false);
    expect(dataLevelAtLeast(SEED, SEED)).toBe(true);
    expect(dataLevelAtLeast(FULL, SEED)).toBe(true);
  });

  it('detail-only concerns (need full) skeletonize at seed — an empty seed grid is a lie', () => {
    expect(dataLevelAtLeast(SKELETON, FULL)).toBe(false);
    expect(dataLevelAtLeast(SEED, FULL)).toBe(false);
    expect(dataLevelAtLeast(FULL, FULL)).toBe(true);
  });
});
