/**
 * Unit tests for CommentaryEngine — deterministic templates.
 */
import { describe, it, expect } from 'vitest';
import { createCommentaryEngine } from '../match/CommentaryEngine';
import type { MatchEvent, CommentaryContext } from '../types/global';

describe('CommentaryEngine', () => {
  const engine = createCommentaryEngine({ homeTeamName: 'Alpha FC', awayTeamName: 'Beta United' });

  const baseCtx: CommentaryContext = {
    minute: 25, scoreA: 0, scoreB: 0,
    homeTeamName: 'Alpha FC', awayTeamName: 'Beta United',
  };

  it('produces deterministic output for same inputs', () => {
    const e1 = createCommentaryEngine({ homeTeamName: 'A', awayTeamName: 'B' });
    const e2 = createCommentaryEngine({ homeTeamName: 'A', awayTeamName: 'B' });

    const event: MatchEvent = { minute: 10, type: 'pass', team: 'A', player: 'John', position: 'CM' };
    const shot: MatchEvent = { minute: 10, type: 'shot', team: 'A', player: 'John', position: 'ST' };

    e1.handleEvent(event, baseCtx);
    e1.handleEvent(shot, baseCtx);
    e2.handleEvent(event, baseCtx);
    e2.handleEvent(shot, baseCtx);

    expect(e1.getNewLines()).toEqual(e2.getNewLines());
  });

  it('produces 4-6 lines per resolved attack', () => {
    const e = createCommentaryEngine({ homeTeamName: 'A', awayTeamName: 'B' });
    e.handleEvent({ minute: 1, type: 'pass', team: 'A', player: 'P1', position: 'CM' }, baseCtx);
    e.handleEvent({ minute: 1, type: 'dribble', team: 'A', player: 'P2', position: 'LW' }, baseCtx);
    e.handleEvent({ minute: 1, type: 'shot', team: 'A', player: 'P3', position: 'ST' }, baseCtx);
    const lines = e.getNewLines();
    expect(lines.length).toBeGreaterThanOrEqual(4);
    expect(lines.length).toBeLessThanOrEqual(6);
  });

  it('cards produce exactly one line', () => {
    const e = createCommentaryEngine({ homeTeamName: 'A', awayTeamName: 'B' });
    e.handleEvent({ minute: 30, type: 'yellow_card', team: 'B', player: 'Tough Guy' }, baseCtx);
    const lines = e.getNewLines();
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain('Tough Guy');
  });

  it('red card produces exactly one line', () => {
    const e = createCommentaryEngine({ homeTeamName: 'A', awayTeamName: 'B' });
    e.handleEvent({ minute: 45, type: 'red_card', team: 'A', player: 'Bad Boy' }, baseCtx);
    const lines = e.getNewLines();
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain('Bad Boy');
  });

  it('reset clears state', () => {
    const e = createCommentaryEngine({ homeTeamName: 'A', awayTeamName: 'B' });
    e.handleEvent({ minute: 1, type: 'pass', team: 'A', player: 'P1' }, baseCtx);
    e.reset();
    const lines = e.getNewLines();
    expect(lines.length).toBe(0);
  });
});
