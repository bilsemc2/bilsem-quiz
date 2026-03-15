import { appendFileSync } from 'node:fs';

import {
  formatPlaywrightCIAuthSummary,
  validatePlaywrightCIAuthEnv,
} from './playwrightAuthEnv.mjs';

const validation = validatePlaywrightCIAuthEnv(process.env);
const summary = formatPlaywrightCIAuthSummary(validation);

console.log(summary);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}

if (!validation.ok) {
  console.error(validation.message);
  process.exit(1);
}
