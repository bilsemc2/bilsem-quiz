import { Color, Shape, CardData, RuleType } from './types';

export const COLORS: Record<Color, string> = {
  [Color.Red]: 'bg-red-500',
  [Color.Blue]: 'bg-blue-500',
  [Color.Green]: 'bg-emerald-500',
  [Color.Yellow]: 'bg-yellow-400',
};

// Shapes managed via components in Card.tsx

export const REFERENCE_CARDS: CardData[] = [
  { id: 'ref1', color: Color.Red, shape: Shape.Star, number: 1 },
  { id: 'ref2', color: Color.Blue, shape: Shape.Heart, number: 2 },
  { id: 'ref3', color: Color.Green, shape: Shape.Cloud, number: 3 },
  { id: 'ref4', color: Color.Yellow, shape: Shape.Moon, number: 4 },
];

export const RULE_LABELS: Record<RuleType, string> = {
  [RuleType.Color]: 'Renk',
  [RuleType.Shape]: 'Şekil',
  [RuleType.Number]: 'Sayı',
};

export const CONSECUTIVE_LIMIT = 5; // Change rule after 5 correct matches
