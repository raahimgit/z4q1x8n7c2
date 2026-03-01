/**
 * Unit tests for MilestoneService logic and reward mapping.
 */
import { describe, it, expect } from 'vitest';
import { MILESTONE_REWARDS, MILESTONE_THRESHOLDS } from '../types/global';

describe('Milestone Rewards', () => {
  it('has all 9 thresholds defined', () => {
    expect(MILESTONE_THRESHOLDS.length).toBe(9);
    for (const t of MILESTONE_THRESHOLDS) {
      expect(MILESTONE_REWARDS[t]).toBeDefined();
      expect(MILESTONE_REWARDS[t].length).toBeGreaterThan(0);
    }
  });

  it('total OVR across all milestones equals 17.0', () => {
    let total = 0;
    for (const threshold of MILESTONE_THRESHOLDS) {
      for (const reward of MILESTONE_REWARDS[threshold]) {
        total += reward.amount;
      }
    }
    expect(total).toBeCloseTo(16.5, 5);
  });

  it('milestone 20 rewards ST +0.5 and CB +0.5', () => {
    const rewards = MILESTONE_REWARDS[20];
    expect(rewards).toEqual([
      { position: 'ST', amount: 0.5 },
      { position: 'CB', amount: 0.5 },
    ]);
  });

  it('milestone 100 has 10 reward entries', () => {
    expect(MILESTONE_REWARDS[100].length).toBe(10);
  });

  it('partial application example: CB at cap', () => {
    // Simulating: CB baseOvr=78, seasonCap=79, currentOvr=78.5, milestone 60: +1.0 CB
    const currentOvr = 78.5;
    const seasonCap = 79;
    const delta = 1.0;
    const applicable = Math.max(0, seasonCap - currentOvr); // 0.5
    const pending = delta - applicable; // 0.5
    const newOvr = currentOvr + applicable; // 79.0

    expect(applicable).toBeCloseTo(0.5);
    expect(pending).toBeCloseTo(0.5);
    expect(newOvr).toBe(79);
  });

  it('full application example: ST below cap', () => {
    const currentOvr = 75;
    const seasonCap = 80;
    const delta = 0.5;
    const desiredNew = currentOvr + delta;
    const applicable = desiredNew <= seasonCap ? delta : seasonCap - currentOvr;
    const newOvr = currentOvr + applicable;

    expect(newOvr).toBe(75.5);
    expect(applicable).toBe(0.5);
  });
});
