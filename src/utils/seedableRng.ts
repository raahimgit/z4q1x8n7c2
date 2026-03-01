/**
 * Deterministic seeded RNG using mulberry32 algorithm.
 * Seed is derived from match_id UUID hashed to a 32-bit integer.
 */

/** Hash a string (UUID) to a 32-bit unsigned integer */
export function hashStringToSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return hash >>> 0;
}

/** Mulberry32 PRNG — returns a function that yields [0, 1) on each call */
export function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Create a deterministic RNG from a match UUID */
export function createMatchRng(matchId: string): () => number {
  const seed = hashStringToSeed(matchId);
  return mulberry32(seed);
}

/** Deterministic integer in [min, max] inclusive */
export function rngInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Deterministic pick from array */
export function rngPick<T>(rng: () => number, items: ReadonlyArray<T>): T {
  return items[Math.floor(rng() * items.length)];
}

/** Returns true with probability p */
export function rngChance(rng: () => number, p: number): boolean {
  return rng() < p;
}
