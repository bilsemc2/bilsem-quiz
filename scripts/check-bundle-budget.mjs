import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const jsDir = path.join(projectRoot, 'dist/assets/js');
const cssDir = path.join(projectRoot, 'dist/assets/css');

const DEFAULT_JS_BUDGET_KB = 350;
const DEFAULT_CSS_BUDGET_KB = 250;

const JS_BUDGET_OVERRIDES = [
  { prefix: 'three-core-', maxKb: 750 },
  { prefix: 'react-pdf-engine-', maxKb: 800 },
  { prefix: 'editor-vendor-', maxKb: 450 },
  { prefix: 'jspdf-core-', maxKb: 400 },
  { prefix: 'react-pdf-fonts-', maxKb: 350 }
];

const formatKb = (bytes) => `${(bytes / 1024).toFixed(2)} kB`;

const readAssetSizes = async (directory, extension) => {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
      .map(async (entry) => {
        const filePath = path.join(directory, entry.name);
        const fileStats = await stat(filePath);

        return {
          name: entry.name,
          size: fileStats.size
        };
      })
  );

  return files.sort((left, right) => right.size - left.size);
};

const resolveJsBudget = (fileName) =>
  JS_BUDGET_OVERRIDES.find((rule) => fileName.startsWith(rule.prefix))?.maxKb ?? DEFAULT_JS_BUDGET_KB;

const findViolations = (files, resolveBudgetKb) =>
  files
    .map((file) => ({
      ...file,
      maxKb: resolveBudgetKb(file.name)
    }))
    .filter((file) => file.size > file.maxKb * 1024);

const jsFiles = await readAssetSizes(jsDir, '.js');
const cssFiles = await readAssetSizes(cssDir, '.css');

const jsViolations = findViolations(jsFiles, resolveJsBudget);
const cssViolations = findViolations(cssFiles, () => DEFAULT_CSS_BUDGET_KB);

if (jsViolations.length > 0 || cssViolations.length > 0) {
  console.error('Bundle budget failed.');

  if (jsViolations.length > 0) {
    console.error('JS chunks over budget:');
    jsViolations.forEach((file) => {
      console.error(`- ${file.name}: ${formatKb(file.size)} > ${file.maxKb} kB`);
    });
  }

  if (cssViolations.length > 0) {
    console.error('CSS chunks over budget:');
    cssViolations.forEach((file) => {
      console.error(`- ${file.name}: ${formatKb(file.size)} > ${file.maxKb} kB`);
    });
  }

  process.exit(1);
}

const largestJs = jsFiles.slice(0, 5).map((file) => `${file.name} (${formatKb(file.size)})`).join(', ');
const largestCss = cssFiles.slice(0, 3).map((file) => `${file.name} (${formatKb(file.size)})`).join(', ');

console.log('Bundle budget passed.');
console.log(`Largest JS: ${largestJs || 'n/a'}`);
console.log(`Largest CSS: ${largestCss || 'n/a'}`);
