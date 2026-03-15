// Story GPT Service — Re-export barrel
// Preserves all original public exports from split modules.

export { generateStory } from './storyGeneration.ts';
export { generateQuestions } from './questionGeneration.ts';
export type { GeneratedQuestion, Story } from './gptTypes.ts';
