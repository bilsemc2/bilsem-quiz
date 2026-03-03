const fs = require('fs');
const path = require('path');

const stroopFn = path.join(__dirname, 'src/components/BrainTrainer/StroopGame.tsx');
let stroop = fs.readFileSync(stroopFn, 'utf8');
stroop = stroop.replace(/const avgReaction =[\s\S]*?\:\s*0;/g, '/* const avgReaction removed */');
fs.writeFileSync(stroopFn, stroop);

const visMemFn = path.join(__dirname, 'src/components/BrainTrainer/VisualMemoryGame.tsx');
let visMem = fs.readFileSync(visMemFn, 'utf8');
visMem = visMem.replace(/const cols =[\s\S]*?"grid-cols-5";/g, '/* cols removed */');
visMem = visMem.replace(/ICON_MAP: Record<IconType, React\.ElementType<any>>/g, 'ICON_MAP: Record<IconType, unknown>');
fs.writeFileSync(visMemFn, visMem);

const visAlgFn = path.join(__dirname, 'src/components/BrainTrainer/VisualAlgebraGame.tsx');
let va = fs.readFileSync(visAlgFn, 'utf8');
va = va.replace(/let shuf /g, 'const shuf ');
fs.writeFileSync(visAlgFn, va);

const wordHuntFn = path.join(__dirname, 'src/components/BrainTrainer/WordHuntGame.tsx');
if (fs.existsSync(wordHuntFn)) {
    let wh = fs.readFileSync(wordHuntFn, 'utf8');
    wh = wh.replace(/\[key: string\]: unknown/g, '[key: string]: string | number | boolean | object | null');
    fs.writeFileSync(wordHuntFn, wh);
}

console.log('Final ESLint fixes applied');
