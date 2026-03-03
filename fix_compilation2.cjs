const fs = require('fs');
const path = require('path');

const bDir = path.join(__dirname, 'src/components/BrainTrainer');

// 1. VisualMemoryGame.tsx
const vmgP = path.join(bDir, 'VisualMemoryGame.tsx');
let vmg = fs.readFileSync(vmgP, 'utf8');
vmg = vmg.replace(/const ICON_MAP: Record<IconType, any> = \{/g, 'const ICON_MAP: Record<IconType, React.ElementType> = {');
vmg = vmg.replace(/const ICON_MAP: Record<IconType, \{\}> = \{/g, 'const ICON_MAP: Record<IconType, React.ElementType> = {');
fs.writeFileSync(vmgP, vmg);

// 2. ShapeAlgebraGame.tsx
const sagP = path.join(bDir, 'ShapeAlgebraGame.tsx');
let sag = fs.readFileSync(sagP, 'utf8');
sag = sag.replace(/\.\/hooks\/useGameEngine/g, '../../hooks/useGameEngine');
sag = sag.replace(/\.\/hooks\/useGameFeedback/g, '../../hooks/useGameFeedback');
sag = sag.replace(/const \{ feedbackState, showFeedback, dismissFeedback \} = useGameFeedback\(/g, 'const feedback = useGameFeedback(\n  ');
sag = sag.replace(/duration: 1500,\n  \}\);/g, 'duration: 1500,\n  });\n  const { feedbackState, showFeedback, dismissFeedback } = feedback;');
sag = sag.replace(/<BrainTrainerShell\n\s*engine=\{engine\}\n\s*config/g, '<BrainTrainerShell\n      engine={engine}\n      feedback={feedback}\n      config');
sag = sag.replace(/const _i = idx; \/\/ ESLint silmeyelim diye boş variable/g, '');
fs.writeFileSync(sagP, sag);

// 3. SentenceSynonymGame.tsx
const ssgP = path.join(bDir, 'SentenceSynonymGame.tsx');
let ssg = fs.readFileSync(ssgP, 'utf8');
ssg = ssg.replace(/\.\/hooks\/useGameEngine/g, '../../hooks/useGameEngine');
ssg = ssg.replace(/\.\/hooks\/useGameFeedback/g, '../../hooks/useGameFeedback');
// Import useGameFeedback if not present
if (!ssg.includes('useGameFeedback')) {
    ssg = ssg.replace(/import \{ useGameEngine \} from "\.\.\/\.\.\/hooks\/useGameEngine";/g, 'import { useGameEngine } from "../../hooks/useGameEngine";\nimport { useGameFeedback } from "../../hooks/useGameFeedback";');
}
ssg = ssg.replace(/const \[feedbackState, setFeedbackState\] = useState<\{ correct: boolean \} \| null>\(null\);/g, `const feedback = useGameFeedback({ duration: 1500 });\n  const { feedbackState, showFeedback, dismissFeedback } = feedback;`);
ssg = ssg.replace(/setFeedbackState\(\{ correct \}\);/g, 'showFeedback(correct);');
ssg = ssg.replace(/setFeedbackState\(null\);/g, 'dismissFeedback();');
ssg = ssg.replace(/<BrainTrainerShell\n\s*engine=\{engine\}\n\s*config/g, '<BrainTrainerShell\n      engine={engine}\n      feedback={feedback}\n      config');
fs.writeFileSync(ssgP, ssg);

// 4. SpotDifferenceGame.tsx
const sdgP = path.join(bDir, 'SpotDifferenceGame.tsx');
let sdg = fs.readFileSync(sdgP, 'utf8');
sdg = sdg.replace(/\.\/hooks\/useGameEngine/g, '../../hooks/useGameEngine');
sdg = sdg.replace(/\.\/hooks\/useGameFeedback/g, '../../hooks/useGameFeedback');
sdg = sdg.replace(/const \{ feedbackState, showFeedback, dismissFeedback \} = useGameFeedback\(\{/g, 'const feedback = useGameFeedback({');
sdg = sdg.replace(/duration: 1500,\n  \}\);/g, 'duration: 1500,\n  });\n  const { feedbackState, showFeedback, dismissFeedback } = feedback;');
sdg = sdg.replace(/<BrainTrainerShell\n\s*engine=\{engine\}\n\s*config/g, '<BrainTrainerShell\n      engine={engine}\n      feedback={feedback}\n      config');
fs.writeFileSync(sdgP, sdg);

console.log('Compilation fixed 2');
