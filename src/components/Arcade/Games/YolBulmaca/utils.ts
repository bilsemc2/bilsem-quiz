import { COLORS, GRID_SIZE } from './constants.ts';
import type { SequenceItem, Question, GridPos } from './types.ts';

type RandomFn = () => number;

const shuffleArray = <T>(items: T[], random: RandomFn): T[] => {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
  }

  return nextItems;
};

export const generateSequence = (level: number, random: RandomFn = Math.random): SequenceItem[] => {
  const length = Math.min(3 + Math.floor(level / 2), 8);
  const items: SequenceItem[] = [];

  for (let i = 0; i < length; i++) {
    if (random() > 0.5) {
      const color = COLORS[Math.floor(random() * COLORS.length)];
      items.push({ type: 'color', value: color.name });
    } else {
      items.push({ type: 'number', value: Math.floor(random() * 20) + 1 });
    }
  }
  return items;
};

export const generateQuestion = (
  sequence: SequenceItem[],
  level: number,
  random: RandomFn = Math.random
): Question => {
  // Question types: position (forward), reversePosition (backward), logic (sum)
  const questionTypes = ['position', 'reversePosition'];
  if (level >= 3) {
    questionTypes.push('logic');
  }

  const type = questionTypes[Math.floor(random() * questionTypes.length)];
  const optionsCount = 4;

  if (type === 'position') {
    // Forward ordering: "X. sıradaki..."
    const idx = Math.floor(random() * sequence.length);
    const item = sequence[idx];
    const text = `${idx + 1}. sıradaki ${item.type === 'color' ? 'renk' : 'rakam'} nedir?`;

    const optionsSet = new Set<string | number>([item.value]);
    while (optionsSet.size < optionsCount) {
      if (item.type === 'color') {
        optionsSet.add(COLORS[Math.floor(random() * COLORS.length)].name);
      } else {
        optionsSet.add(Math.floor(random() * 30));
      }
    }

    return {
      text,
      answer: item.value,
      options: shuffleArray(Array.from(optionsSet), random)
    };
  } else if (type === 'reversePosition') {
    // Reverse ordering: "Sondan X. sıradaki..."
    const reverseIdx = Math.floor(random() * sequence.length);
    const actualIdx = sequence.length - 1 - reverseIdx;
    const item = sequence[actualIdx];

    // Generate question text based on position
    let text: string;
    if (reverseIdx === 0) {
      text = `Son sıradaki ${item.type === 'color' ? 'renk' : 'rakam'} nedir?`;
    } else if (reverseIdx === 1) {
      text = `Sondan bir önceki ${item.type === 'color' ? 'renk' : 'rakam'} nedir?`;
    } else {
      text = `Sondan ${reverseIdx + 1}. sıradaki ${item.type === 'color' ? 'renk' : 'rakam'} nedir?`;
    }

    const optionsSet = new Set<string | number>([item.value]);
    while (optionsSet.size < optionsCount) {
      if (item.type === 'color') {
        optionsSet.add(COLORS[Math.floor(random() * COLORS.length)].name);
      } else {
        optionsSet.add(Math.floor(random() * 30));
      }
    }

    return {
      text,
      answer: item.value,
      options: shuffleArray(Array.from(optionsSet), random)
    };
  } else {
    // Logic questions: various math operations
    const numbers = sequence.filter(s => s.type === 'number');
    if (numbers.length >= 2) {
      // Get all number values and their positions
      const numberData = numbers.map(n => ({
        value: n.value as number,
        idx: sequence.indexOf(n) + 1
      }));

      // Different logic question types
      const logicTypes = ['sum', 'difference', 'firstLastDiff', 'firstLastSum'];

      // Add multiplication only if numbers are small (1-10) to avoid complex answers
      const firstTwo = [numberData[0].value, numberData[1].value];
      if (firstTwo[0] <= 10 && firstTwo[1] <= 10) {
        logicTypes.push('multiply');
      }

      const logicType = logicTypes[Math.floor(random() * logicTypes.length)];

      let answer: number;
      let text: string;

      const n1 = numberData[0];
      const n2 = numberData[1];
      const firstNum = numberData[0];
      const lastNum = numberData[numberData.length - 1];

      switch (logicType) {
        case 'sum':
          answer = n1.value + n2.value;
          text = `${n1.idx}. ve ${n2.idx}. sıradaki rakamların toplamı kaçtır?`;
          break;
        case 'difference':
          answer = Math.abs(n1.value - n2.value);
          text = `${n1.idx}. ve ${n2.idx}. sıradaki rakamların farkı kaçtır?`;
          break;
        case 'multiply':
          answer = n1.value * n2.value;
          text = `${n1.idx}. ve ${n2.idx}. sıradaki rakamların çarpımı kaçtır?`;
          break;
        case 'firstLastDiff':
          answer = Math.abs(firstNum.value - lastNum.value);
          text = `İlk ve son rakamın farkı kaçtır?`;
          break;
        case 'firstLastSum':
        default:
          answer = firstNum.value + lastNum.value;
          text = `İlk ve son rakamın toplamı kaçtır?`;
          break;
      }

      const optionsSet = new Set<number>([answer]);
      while (optionsSet.size < optionsCount) {
        // Generate distractors close to the answer
        const offset = Math.floor(random() * 15) - 7;
        const distractor = answer + offset;
        if (distractor >= 0) {
          optionsSet.add(distractor);
        }
      }

      return {
        text,
        answer,
        options: shuffleArray(Array.from(optionsSet), random)
      };
    } else {
      // Fallback to position question
      return generateQuestion(sequence, 1, random);
    }
  }
};


export const getRandomGridPos = (exclude: GridPos[] = [], random: RandomFn = Math.random): GridPos => {
  let pos: GridPos;
  do {
    pos = {
      row: Math.floor(random() * GRID_SIZE),
      col: Math.floor(random() * GRID_SIZE)
    };
  } while (exclude.some(p => p.row === pos.row && p.col === pos.col));
  return pos;
};

/**
 * Generate smart positions for the game grid
 * Ensures:
 * 1. Start and goal are in opposite areas of the grid
 * 2. Correct answer is positioned between start and goal (on a potential path)
 * 3. Wrong answers are placed away from the direct path
 */
export const generateSmartPositions = (
  correctAnswerIndex: number,
  optionCount: number,
  random: RandomFn = Math.random
): { start: GridPos; goal: GridPos; optionPositions: GridPos[] } => {
  // Place start and goal in opposite corners/areas
  const corners = [
    { row: 0, col: 0 },      // top-left
    { row: 0, col: GRID_SIZE - 1 },  // top-right
    { row: GRID_SIZE - 1, col: 0 },  // bottom-left
    { row: GRID_SIZE - 1, col: GRID_SIZE - 1 }  // bottom-right
  ];

  // Pick random corner pair (opposite corners)
  const cornerPairs = [
    [0, 3], // top-left to bottom-right
    [1, 2], // top-right to bottom-left
    [3, 0], // bottom-right to top-left
    [2, 1]  // bottom-left to top-right
  ];

  const pairIndex = Math.floor(random() * cornerPairs.length);
  const [startIdx, goalIdx] = cornerPairs[pairIndex];

  const start = corners[startIdx];
  const goal = corners[goalIdx];

  // Calculate the middle area between start and goal for the correct answer
  const midRow = Math.floor((start.row + goal.row) / 2);
  const midCol = Math.floor((start.col + goal.col) / 2);

  // Get cells that are on or near the path (within 1 cell of the diagonal)
  const pathCells: GridPos[] = [];
  const nonPathCells: GridPos[] = [];

  // BAŞLA/BİTİŞ butonları 2 hücre genişliğinde — komşu hücreleri de exclude et
  const excludedCells: GridPos[] = [
    start,
    goal,
    // Start button komşusu (yatay)
    { row: start.row, col: start.col + (start.col === 0 ? 1 : -1) },
    // Goal button komşusu (yatay)
    { row: goal.row, col: goal.col + (goal.col === 0 ? 1 : -1) },
  ];
  const isExcluded = (r: number, c: number) =>
    excludedCells.some(e => e.row === r && e.col === c);

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      // Skip start/goal and their adjacent cells (BAŞLA/BİTİŞ span)
      if (isExcluded(r, c)) {
        continue;
      }

      // Check if cell is near the diagonal path
      const expectedCol = start.col + ((goal.col - start.col) * (r - start.row)) / (goal.row - start.row || 1);
      const distanceFromPath = Math.abs(c - expectedCol);

      if (distanceFromPath <= 1.5) {
        pathCells.push({ row: r, col: c });
      } else {
        nonPathCells.push({ row: r, col: c });
      }
    }
  }

  // Shuffle arrays
  const shuffledPathCells = shuffleArray(pathCells, random);
  const shuffledNonPathCells = shuffleArray(nonPathCells, random);

  // Place options
  const optionPositions: GridPos[] = [];

  for (let i = 0; i < optionCount; i++) {
    if (i === correctAnswerIndex) {
      // Correct answer goes on the path
      if (shuffledPathCells.length > 0) {
        optionPositions.push(shuffledPathCells.shift()!);
      } else {
        // Fallback: place near middle
        optionPositions.push({ row: midRow, col: midCol });
      }
    } else {
      // Wrong answers go away from the path
      if (shuffledNonPathCells.length > 0) {
        optionPositions.push(shuffledNonPathCells.shift()!);
      } else if (shuffledPathCells.length > 0) {
        // Fallback: use path cells but not blocking
        optionPositions.push(shuffledPathCells.shift()!);
      } else {
        // Last resort: random
        optionPositions.push(getRandomGridPos([start, goal, ...optionPositions], random));
      }
    }
  }

  return { start, goal, optionPositions };
};
