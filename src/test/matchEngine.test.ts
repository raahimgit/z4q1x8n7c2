/**
 * Unit tests for MatchEngine — deterministic behavior.
 */
import { describe, it, expect } from 'vitest';
import { createMatchRng, mulberry32, hashStringToSeed, rngInt } from '../utils/seedableRng';
import { calculateElo } from '../match/SimulationUtils';

describe('SeedableRng', () => {
  it('produces deterministic output for the same seed', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);
    const results1 = Array.from({ length: 20 }, () => rng1());
    const results2 = Array.from({ length: 20 }, () => rng2());
    expect(results1).toEqual(results2);
  });

  it('produces different output for different seeds', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(54321);
    const r1 = rng1();
    const r2 = rng2();
    expect(r1).not.toEqual(r2);
  });

  it('createMatchRng is deterministic for same match ID', () => {
    const id = 'abc123-def456-789';
    const rng1 = createMatchRng(id);
    const rng2 = createMatchRng(id);
    const seq1 = Array.from({ length: 50 }, () => rng1());
    const seq2 = Array.from({ length: 50 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it('hashStringToSeed returns consistent unsigned integers', () => {
    const h1 = hashStringToSeed('test-uuid');
    const h2 = hashStringToSeed('test-uuid');
    expect(h1).toBe(h2);
    expect(h1).toBeGreaterThanOrEqual(0);
  });

  it('rngInt returns values in range', () => {
    const rng = mulberry32(999);
    for (let i = 0; i < 100; i++) {
      const val = rngInt(rng, 1, 10);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(10);
    }
  });
});

describe('ELO Calculation', () => {
  it('win increases rating, loss decreases', () => {
    const result = calculateElo(1000, 1000, 2, 1);
    expect(result.newRatingA).toBeGreaterThan(1000);
    expect(result.newRatingB).toBeLessThan(1000);
  });

  it('draw against equal opponent yields no change', () => {
    const result = calculateElo(1000, 1000, 1, 1);
    expect(result.deltaA).toBe(0);
    expect(result.deltaB).toBe(0);
  });

  it('rating never goes below 0', () => {
    const result = calculateElo(10, 2000, 0, 5);
    expect(result.newRatingA).toBeGreaterThanOrEqual(0);
  });

  it('upset win gives larger rating gain', () => {
    const upset = calculateElo(800, 1200, 1, 0);
    const expected = calculateElo(1200, 800, 1, 0);
    expect(upset.deltaA).toBeGreaterThan(expected.deltaA);
  });
});
