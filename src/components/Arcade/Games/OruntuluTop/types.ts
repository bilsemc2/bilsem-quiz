
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type GamePhase = 'idle' | 'playing' | 'paused' | 'game_over' | 'victory';

export interface Point {
  x: number;
  y: number;
}

export type BubbleColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export interface Bubble {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  color: BubbleColor;
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

/**
 * Interface representing a strategic suggestion from the AI
 */
export interface StrategicHint {
  message: string;
  rationale?: string;
  targetRow?: number;
  targetCol?: number;
  recommendedColor?: BubbleColor;
}

/**
 * Interface for debugging and performance monitoring data
 */
export interface DebugInfo {
  latency: number;
  screenshotBase64: string;
  promptContext: string;
  rawResponse: string;
  timestamp: string;
  error?: string;
  parsedResponse?: any;
}

/**
 * Wrapper interface for the AI service result
 */
export interface AiResponse {
  hint: StrategicHint;
  debug: DebugInfo;
}
