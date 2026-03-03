const fs = require('fs');
const path = require('path');

const bDir = path.join(__dirname, 'src/components/BrainTrainer');

// 1. VisualMemoryGame.tsx
const vmgP = path.join(bDir, 'VisualMemoryGame.tsx');
let vmg = fs.readFileSync(vmgP, 'utf8');
vmg = vmg.replace(/const ICON_MAP: Record<IconType, \{\}> = \{/g, 'const ICON_MAP: Record<IconType, React.ElementType> = {');
fs.writeFileSync(vmgP, vmg);

// 2. ShapeAlgebraGame.tsx
const sagP = path.join(bDir, 'ShapeAlgebraGame.tsx');
let sag = fs.readFileSync(sagP, 'utf8');
sag = sag.replace(/\.\.\/\.\.\/hooks\/useGameEngine/g, './hooks/useGameEngine');
sag = sag.replace(/\.\.\/\.\.\/hooks\/useGameFeedback/g, './hooks/useGameFeedback');
sag = sag.replace(/<div className="w-full h-full flex flex-col items-center justify-center">/g, '{() => (\n      <div className="w-full h-full flex flex-col items-center justify-center">');
sag = sag.replace(/<\/div>\n\s*<\/BrainTrainerShell>/g, '</div>\n      )}\n    </BrainTrainerShell>');
// Remove saveGamePlay calls if any
sag = sag.replace(/saveGamePlay\(\{[\s\S]*?\}\);/g, '');
fs.writeFileSync(sagP, sag);

// 3. SentenceSynonymGame.tsx
const ssgP = path.join(bDir, 'SentenceSynonymGame.tsx');
let ssg = fs.readFileSync(ssgP, 'utf8');
ssg = ssg.replace(/\.\.\/\.\.\/hooks\/useGameEngine/g, './hooks/useGameEngine');
ssg = ssg.replace(/\.\.\/\.\.\/hooks\/useGameFeedback/g, './hooks/useGameFeedback');
ssg = ssg.replace(/<div className="w-full h-full flex flex-col items-center justify-center">/g, '{() => (\n      <div className="w-full h-full flex flex-col items-center justify-center">');
ssg = ssg.replace(/<\/div>\n\s*<\/BrainTrainerShell>/g, '</div>\n      )}\n    </BrainTrainerShell>');
fs.writeFileSync(ssgP, ssg);

// 4. SpotDifferenceGame.tsx
const sdgP = path.join(bDir, 'SpotDifferenceGame.tsx');
let sdg = fs.readFileSync(sdgP, 'utf8');
sdg = sdg.replace(/\.\.\/\.\.\/hooks\/useGameEngine/g, './hooks/useGameEngine');
sdg = sdg.replace(/\.\.\/\.\.\/hooks\/useGameFeedback/g, './hooks/useGameFeedback');
sdg = sdg.replace(/<div className="w-full h-full flex flex-col items-center justify-center">/g, '{() => (\n      <div className="w-full h-full flex flex-col items-center justify-center">');
sdg = sdg.replace(/<\/div>\n\s*<\/BrainTrainerShell>/g, '</div>\n      )}\n    </BrainTrainerShell>');
fs.writeFileSync(sdgP, sdg);

console.log('Compilation fixed');
