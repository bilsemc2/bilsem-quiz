export interface Coordinate {
  row: number;
  col: number;
}

export enum GameState {
  IDLE = 'IDLE',         // Game hasn't started or waiting for start
  LOADING = 'LOADING',   // Fetching path from AI
  PREVIEW = 'PREVIEW',   // Showing the path to user
  PLAYING = 'PLAYING',   // User is drawing
  SUCCESS = 'SUCCESS',   // Round complete
  GAME_OVER = 'GAME_OVER' // Wrong move
}

export interface LevelConfig {
  gridSize: number;
  pathLength: number;
  levelNumber: number;
  allowDiagonals: boolean;
}

export interface GameStats {
  score: number;
  level: number;
  highScore: number;
}