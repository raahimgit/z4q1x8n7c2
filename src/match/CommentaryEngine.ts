/**
 * Deterministic rule-based commentary engine.
 * No AI, no randomness — template selection via deterministic hash.
 */
import type { MatchEvent, CommentaryContext } from '../types/global';
import { hashStringToSeed } from '../utils/seedableRng';

type EmotionalTone = 'neutral' | 'excited' | 'dominant';

interface BufferedPlay {
  events: MatchEvent[];
  context: CommentaryContext;
}

export interface CommentaryEngine {
  handleEvent(event: MatchEvent, context: CommentaryContext): void;
  getNewLines(): string[];
  reset(): void;
}

function determineTone(context: CommentaryContext): EmotionalTone {
  const diff = Math.abs(context.scoreA - context.scoreB);
  if (diff >= 3) return 'dominant';
  if (context.minute >= 80 && diff <= 1) return 'excited';
  return 'neutral';
}

function variant(minute: number, player: string, teamName: string, numVariants: number): number {
  const hash = hashStringToSeed(`${minute}:${player}:${teamName}`);
  return hash % numVariants;
}

const PASS_TEMPLATES: Record<EmotionalTone, string[]> = {
  neutral: [
    '{player} plays a short pass from {position}.',
    '{player} distributes the ball wide.',
    'A neat pass by {player}, keeping possession.',
    '{player} threads a pass through the midfield.',
  ],
  excited: [
    '{player} fires a sharp pass — the crowd is on edge!',
    'Quick distribution by {player} — tension rising!',
    '{player} plays it forward with urgency!',
    'A crucial pass from {player} in this tense moment!',
  ],
  dominant: [
    '{player} calmly passes — total control.',
    '{player} casually distributes, they\'re running the show.',
    'Another patient pass from {player}, dominating possession.',
    '{player} passes at will, the opposition can\'t get close.',
  ],
};

const DRIBBLE_TEMPLATES: Record<EmotionalTone, string[]> = {
  neutral: [
    '{player} drives forward with the ball.',
    '{player} takes on a defender with a neat dribble.',
    'Skillful footwork from {player}.',
    '{player} weaves past the challenge.',
  ],
  excited: [
    '{player} surges forward — electrifying run!',
    '{player} beats the defender — what a moment!',
    'Incredible dribble from {player}, the crowd roars!',
    '{player} charges through — can anyone stop them?!',
  ],
  dominant: [
    '{player} strolls past the defense effortlessly.',
    '{player} dribbles through like it\'s training.',
    'Another casual run from {player}, too easy.',
    '{player} glides past challenges, complete dominance.',
  ],
};

const SHOT_TEMPLATES: Record<EmotionalTone, string[]> = {
  neutral: [
    '{player} takes a shot from {position}!',
    '{player} lets fly from distance!',
    'A strike from {player} — saved!',
    '{player} fires at goal, but it\'s held.',
  ],
  excited: [
    '{player} SHOOTS! The stadium holds its breath!',
    '{player} unleashes a thunderbolt — heart-stopping!',
    'OH! {player} fires — will this be the moment?!',
    '{player} has a go — the tension is unbearable!',
  ],
  dominant: [
    '{player} takes a casual shot, testing the keeper.',
    '{player} fires another one — they\'re relentless.',
    'Yet another attempt from {player}, piling on the pressure.',
    '{player} shoots from range, asserting dominance.',
  ],
};

const GOAL_TEMPLATES: Record<EmotionalTone, string[]> = {
  neutral: [
    '⚽ GOAL! {player} finds the net! {scoreA}-{scoreB}',
    '⚽ {player} scores! The ball hits the back of the net! {scoreA}-{scoreB}',
    '⚽ GOAL by {player}! Clinical finish! {scoreA}-{scoreB}',
    '⚽ {player} makes no mistake! GOAL! {scoreA}-{scoreB}',
  ],
  excited: [
    '⚽ GOOOAL!! {player} SCORES!! INCREDIBLE!! {scoreA}-{scoreB}',
    '⚽ HE\'S DONE IT! {player} WITH A LATE GOAL!! {scoreA}-{scoreB}',
    '⚽ UNBELIEVABLE! {player} SCORES IN THE DYING MINUTES!! {scoreA}-{scoreB}',
    '⚽ THE CROWD ERUPTS!! {player} HAS SCORED!! {scoreA}-{scoreB}',
  ],
  dominant: [
    '⚽ Another goal. {player} adds to the rout. {scoreA}-{scoreB}',
    '⚽ {player} piles on the misery. GOAL. {scoreA}-{scoreB}',
    '⚽ Ruthless. {player} scores again. {scoreA}-{scoreB}',
    '⚽ {player} makes it look easy. {scoreA}-{scoreB}',
  ],
};

const FOUL_TEMPLATES: Record<EmotionalTone, string[]> = {
  neutral: [
    '{player} commits a foul.',
    'Free kick awarded after {player}\'s challenge.',
    '{player} brings down the opponent. Ref blows the whistle.',
  ],
  excited: [
    '{player} with a desperate challenge! Free kick!',
    'Cynical foul by {player} — tempers are flaring!',
    '{player} stops the counter with a tactical foul!',
  ],
  dominant: [
    '{player} with a frustrated challenge.',
    '{player} fouls out of desperation, can\'t cope.',
    'A rash challenge from {player}, the pressure is telling.',
  ],
};

const YELLOW_TEMPLATES = [
  '🟨 Yellow card shown to {player}.',
  '🟨 {player} goes into the book.',
  '🟨 The referee cautions {player}.',
];

const RED_TEMPLATES = [
  '🟥 RED CARD! {player} is sent off!',
  '🟥 {player} sees red! Marching orders!',
  '🟥 Off you go! {player} receives a red card!',
];

function fillTemplate(template: string, event: MatchEvent, context: CommentaryContext): string {
  return template
    .replace(/{player}/g, event.player)
    .replace(/{position}/g, event.position || '')
    .replace(/{scoreA}/g, String(context.scoreA))
    .replace(/{scoreB}/g, String(context.scoreB))
    .replace(/{minute}/g, String(context.minute));
}

export function createCommentaryEngine(context: {
  homeTeamName: string;
  awayTeamName: string;
}): CommentaryEngine {
  const buffer: BufferedPlay[] = [];
  const pendingLines: string[] = [];
  let currentSequence: MatchEvent[] = [];
  let lastContext: CommentaryContext | null = null;

  function flushSequence(): void {
    if (currentSequence.length === 0 || !lastContext) return;

    const tone = determineTone(lastContext);
    const lines: string[] = [];

    for (const evt of currentSequence) {
      const ctx = lastContext;
      let templates: string[];
      let line: string;

      switch (evt.type) {
        case 'pass':
          templates = PASS_TEMPLATES[tone];
          line = fillTemplate(
            templates[variant(evt.minute, evt.player, context.homeTeamName, templates.length)],
            evt, ctx
          );
          break;
        case 'dribble':
          templates = DRIBBLE_TEMPLATES[tone];
          line = fillTemplate(
            templates[variant(evt.minute, evt.player, context.homeTeamName, templates.length)],
            evt, ctx
          );
          break;
        case 'shot':
          templates = SHOT_TEMPLATES[tone];
          line = fillTemplate(
            templates[variant(evt.minute, evt.player, context.homeTeamName, templates.length)],
            evt, ctx
          );
          break;
        case 'goal':
          templates = GOAL_TEMPLATES[tone];
          line = fillTemplate(
            templates[variant(evt.minute, evt.player, context.homeTeamName, templates.length)],
            evt, ctx
          );
          break;
        case 'foul':
          templates = FOUL_TEMPLATES[tone];
          line = fillTemplate(
            templates[variant(evt.minute, evt.player, context.homeTeamName, templates.length)],
            evt, ctx
          );
          break;
        default:
          continue;
      }

      lines.push(`[${evt.minute}'] ${line}`);
    }

    // Ensure 4-6 lines per resolved sequence
    while (lines.length < 4 && currentSequence.length > 0) {
      const lastEvt = currentSequence[currentSequence.length - 1];
      const tone2 = determineTone(lastContext);
      const extraTemplates = PASS_TEMPLATES[tone2];
      const extraLine = fillTemplate(
        extraTemplates[variant(lastEvt.minute + lines.length, lastEvt.player, context.homeTeamName, extraTemplates.length)],
        lastEvt, lastContext
      );
      lines.push(`[${lastEvt.minute}'] ${extraLine}`);
    }

    pendingLines.push(...lines.slice(0, 6));
    currentSequence = [];
  }

  return {
    handleEvent(event: MatchEvent, ctx: CommentaryContext): void {
      lastContext = ctx;

      // Cards produce exactly one line
      if (event.type === 'yellow_card') {
        flushSequence();
        const templates = YELLOW_TEMPLATES;
        const line = fillTemplate(
          templates[variant(event.minute, event.player, context.homeTeamName, templates.length)],
          event, ctx
        );
        pendingLines.push(`[${event.minute}'] ${line}`);
        return;
      }

      if (event.type === 'red_card') {
        flushSequence();
        const templates = RED_TEMPLATES;
        const line = fillTemplate(
          templates[variant(event.minute, event.player, context.homeTeamName, templates.length)],
          event, ctx
        );
        pendingLines.push(`[${event.minute}'] ${line}`);
        return;
      }

      currentSequence.push(event);

      // Resolve sequence on shot, goal, or foul
      if (event.type === 'shot' || event.type === 'goal' || event.type === 'foul') {
        flushSequence();
      }
    },

    getNewLines(): string[] {
      flushSequence();
      const lines = [...pendingLines];
      pendingLines.length = 0;
      return lines;
    },

    reset(): void {
      currentSequence = [];
      pendingLines.length = 0;
      lastContext = null;
    },
  };
}
