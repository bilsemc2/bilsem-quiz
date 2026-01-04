// src/pages/workshops/muzik/constants/index.ts

// Timing and animation
export const TRANSITION_DELAY_MS = 3000;
export const AUDIO_PLAYBACK_BUFFER_MS = 200;
export const DEFAULT_COMMAND_TIMEOUT_MS = 120000;

// Audio Analysis
export const PITCH_TOLERANCE_CENTS = 50;
export const FREQUENCY_TOLERANCE_HZ = 25;
export const DURATION_TOLERANCE_RATIO = 0.35;
export const MIN_NOTE_DURATION_SECONDS = 0.1;

// Rhythm Analysis
export const RHYTHM_ABS_TOLERANCE_MS = 150;
export const RHYTHM_REL_TOLERANCE = 0.25;

// Pitch Detection Windowing
export const PITCH_WINDOW_SIZE = 2048;
export const PITCH_HOP_SIZE_DIVISOR = 4;

// Scoring Weights
export const MELODY_PITCH_WEIGHT = 0.5;
export const MELODY_DURATION_WEIGHT = 0.3;
export const MELODY_SEQUENCE_WEIGHT = 0.2;

// Workshop Rounds and Rules
export const SINGLE_NOTE_ROUNDS = 4;
export const DOUBLE_NOTE_ROUNDS = 4;
export const TRIPLE_NOTE_ROUNDS = 2;
export const MIN_MELODY_NOTES = 10;
export const RHYTHM_MIN_BEATS = 13;
export const RHYTHM_MAX_BEATS = 16;

// UI Aesthetics
export const COLOR_SUCCESS = '#4CAF50';
export const COLOR_WARNING = '#FFC107';
export const COLOR_ERROR = '#F44336';
export const COLOR_INFO = '#2196F3';
export const COLOR_NEUTRAL = '#555';

// Z-index
export const Z_INDEX_OVERLAY = 1000;
export const Z_INDEX_MODAL = 9999;

// Note Conversion Bases
export const A4 = 440;
export const SEMITONE = 69;
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
