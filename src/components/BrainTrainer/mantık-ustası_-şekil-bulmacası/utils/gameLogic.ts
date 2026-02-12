import { LevelData, GameVariable, Equation, ShapeType, ColorType, EquationItem } from '../types';

const SHAPES: ShapeType[] = ['square', 'triangle', 'circle', 'star', 'diamond', 'pentagon', 'hexagon'];
const COLORS: ColorType[] = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'teal'];

// Helper to get random item from array
const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateLevel = (level: number): LevelData => {
  // 1. Determine Difficulty
  // Level 1-2: 2 Variables, Simple equations
  // Level 3-5: 3 Variables
  // Level 6-9: 4 Variables
  // Level 10+: 5 Variables
  let numVariables = 2;
  if (level >= 3) numVariables = 3;
  if (level >= 6) numVariables = 4;
  if (level >= 10) numVariables = 5;

  const maxVarValue = 5 + Math.floor(level / 2); // Values get slightly larger

  // 2. Select Variables (Shape + Color)
  const usedCombos = new Set<string>();
  const variables: GameVariable[] = [];

  while (variables.length < numVariables) {
    const shape = getRandom(SHAPES);
    const color = getRandom(COLORS);
    const key = `${shape}-${color}`;
    
    if (!usedCombos.has(key)) {
      usedCombos.add(key);
      variables.push({
        id: generateId(),
        shape,
        color,
        value: Math.floor(Math.random() * maxVarValue) + 1 // 1 to max
      });
    }
  }

  // 3. Generate Equations
  const equations: Equation[] = [];
  const varsInOrder = [...variables]; 
  
  for (let i = 0; i < numVariables; i++) {
    const items: EquationItem[] = [];
    let currentSum = 0;

    // Row length
    const rowLength = Math.floor(Math.random() * 2) + 2; // 2 or 3 items usually
    
    for (let k = 0; k < rowLength; k++) {
      const possibleVars = varsInOrder.slice(0, i + 1);
      
      let chosenVar: GameVariable;
      if (k === 0) {
        chosenVar = varsInOrder[i];
      } else {
        chosenVar = getRandom(possibleVars);
      }
      
      items.push({ variableId: chosenVar.id, count: 1 });
      currentSum += chosenVar.value;
    }

    equations.push({
      id: generateId(),
      items,
      result: currentSum
    });
  }

  if (level > 2) {
    equations.sort(() => Math.random() - 0.5);
  }

  // 4. Generate Question
  // Levels 1-3: Simple Identification (What is A?)
  // Levels 4+: Mixed (What is A? OR What is A + B?)
  
  let questionItems: EquationItem[] = [];
  let answer = 0;
  let questionText = "Aşağıdaki şekil kaç eder?";

  const allowComplexQuestions = level >= 4;
  const isComplex = allowComplexQuestions && Math.random() > 0.5;

  if (isComplex) {
    // Generate an expression (A + B)
    const v1 = getRandom(variables);
    const v2 = getRandom(variables);
    
    questionItems = [
      { variableId: v1.id, count: 1 },
      { variableId: v2.id, count: 1 }
    ];
    answer = v1.value + v2.value;
    questionText = "İşlemin sonucu kaçtır?";
  } else {
    // Single variable
    const target = getRandom(variables);
    questionItems = [{ variableId: target.id, count: 1 }];
    answer = target.value;
  }

  return {
    level,
    variables,
    equations,
    question: {
      text: questionText,
      items: questionItems,
      answer
    }
  };
};

export const checkAnswer = (levelData: LevelData, answer: number): boolean => {
  return levelData.question.answer === answer;
};