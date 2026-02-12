import { Coordinate } from "../types";

const THEMES = [
  "PROTOCOL_ALPHA", "NEON_SNAKE", "VECTOR_LOCK", "CYBER_TRACE", 
  "DATA_STREAM", "SYNTH_WAVE", "MATRIX_ROOT", "VOID_LINK",
  "NET_RUNNER", "CORE_DUMP", "LOGIC_GATE", "ZERO_DAY"
];

const generateRandomPath = (size: number, length: number, allowDiagonals: boolean): Coordinate[] => {
  const path: Coordinate[] = [];
  let attempts = 0;
  const maxAttempts = 50;

  // Retry loop in case we get stuck
  while (attempts < maxAttempts) {
    path.length = 0; // Clear path
    
    // Start at a random position
    let currentRow = Math.floor(Math.random() * size);
    let currentCol = Math.floor(Math.random() * size);
    
    path.push({ row: currentRow, col: currentCol });

    let stuck = false;

    for (let i = 1; i < length; i++) {
      const moves = [
        { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 } // Cardinal
      ];

      if (allowDiagonals) {
        moves.push(
          { r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 } // Diagonals
        );
      }
      
      // Filter valid moves
      const validMoves = moves.filter(move => {
        const newR = currentRow + move.r;
        const newC = currentCol + move.c;
        
        // Check bounds
        if (newR < 0 || newR >= size || newC < 0 || newC >= size) return false;
        
        // Prevent visiting same node twice
        if (path.some(p => p.row === newR && p.col === newC)) return false;
        
        return true;
      });

      if (validMoves.length > 0) {
        const move = validMoves[Math.floor(Math.random() * validMoves.length)];
        currentRow += move.r;
        currentCol += move.c;
        path.push({ row: currentRow, col: currentCol });
      } else {
        stuck = true;
        break;
      }
    }

    if (!stuck && path.length === length) {
      return path; // Success
    }
    
    attempts++;
  }

  // Fallback: Just return whatever we managed to generate if max attempts reached
  return path;
};

export const generateGamePath = async (size: number, length: number, allowDiagonals: boolean = false): Promise<{ path: Coordinate[], theme: string }> => {
  // Simulate a small delay for dramatic effect (calculating...)
  await new Promise(resolve => setTimeout(resolve, 600));

  const path = generateRandomPath(size, length, allowDiagonals);
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)];

  return {
    path,
    theme
  };
};