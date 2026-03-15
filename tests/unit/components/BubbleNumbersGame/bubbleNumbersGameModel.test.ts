import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceBubblePopProgress,
  createBubble,
  createLevelState,
  formatBubbleGameTime,
  generateOperation,
  getLevelSettings,
  pickNextTargetNumber,
  updateBubblePositions
} from '../../../../src/components/BubbleNumbersGame/model/bubbleNumbersGameModel.ts';

const createSequenceRandom = (values: number[]) => {
  let index = 0;
  return () => {
    const value = values[Math.min(index, values.length - 1)] ?? 0;
    index += 1;
    return value;
  };
};

test('getLevelSettings returns configured and fallback values', () => {
  assert.equal(getLevelSettings(1).bubbleCount, 8);
  assert.equal(getLevelSettings(7).bubbleCount, 20);
  assert.equal(getLevelSettings(7).timeBonus, 22);
});

test('generateOperation keeps subtraction non-negative', () => {
  const operation = generateOperation(2, createSequenceRandom([0.8, 0.1, 0.9]));

  assert.equal(operation.operation, '13 - 2');
  assert.equal(operation.result, 11);
});

test('createBubble and createLevelState keep bubbles inside the game bounds', () => {
  const bubble = createBubble(4, 1, createSequenceRandom([0.5, 0.2, 0.4, 0.6, 0.3, 0.7, 0.9]));
  assert.equal(bubble.id, 4);
  assert.ok(bubble.x >= bubble.size);
  assert.ok(bubble.x <= 800 - bubble.size);
  assert.ok(bubble.y >= bubble.size);
  assert.ok(bubble.y <= 600 - bubble.size);

  const levelState = createLevelState(2, createSequenceRandom(Array(80).fill(0.25)));
  assert.equal(levelState.bubbles.length, getLevelSettings(2).bubbleCount);
  assert.ok(levelState.bubbles.some((entry) => entry.result === levelState.targetNumber));
});

test('pickNextTargetNumber ignores the popped bubble', () => {
  const targetNumber = pickNextTargetNumber(
    [
      { id: 1, x: 0, y: 0, size: 40, dx: 1, dy: 1, operation: '1 + 1', result: 2 },
      { id: 2, x: 0, y: 0, size: 40, dx: 1, dy: 1, operation: '2 + 2', result: 4 },
      { id: 3, x: 0, y: 0, size: 40, dx: 1, dy: 1, operation: '3 + 3', result: 6, popping: true }
    ],
    1,
    createSequenceRandom([0.2])
  );

  assert.equal(targetNumber, 4);
});

test('updateBubblePositions bounces on walls and applies slow motion', () => {
  const [bubble] = updateBubblePositions(
    [
      {
        id: 1,
        x: 45,
        y: 60,
        size: 40,
        dx: -10,
        dy: 8,
        operation: '1 + 1',
        result: 2
      }
    ],
    1,
    ['slowMotion']
  );

  assert.equal(bubble.x, 40);
  assert.equal(bubble.dx, 5);
  assert.equal(bubble.dy, 4);
});

test('advanceBubblePopProgress removes finished bubbles and increments active ones', () => {
  const bubbles = advanceBubblePopProgress([
    {
      id: 1,
      x: 0,
      y: 0,
      size: 40,
      dx: 1,
      dy: 1,
      operation: '1 + 1',
      result: 2,
      popping: true,
      popProgress: 0.2
    },
    {
      id: 2,
      x: 0,
      y: 0,
      size: 40,
      dx: 1,
      dy: 1,
      operation: '2 + 2',
      result: 4,
      popping: true,
      popProgress: 0.95
    }
  ]);

  assert.equal(bubbles.length, 1);
  assert.equal(bubbles[0].popProgress, 0.30000000000000004);
});

test('formatBubbleGameTime returns mm:ss format', () => {
  assert.equal(formatBubbleGameTime(65), '1:05');
});
