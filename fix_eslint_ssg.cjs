const fs = require('fs');
const path = require('path');

const fileP = path.join(__dirname, 'src/components/BrainTrainer/SentenceSynonymGame.tsx');
let content = fs.readFileSync(fileP, 'utf8');

content = content.replace(/import \{\s*Trophy,\s*RotateCcw,\s*Play,\s*Star,\s*Heart,\s*CheckCircle2,\s*XCircle,\s*ChevronLeft,\s*Zap,\s*MessageSquare,\s*Loader2,\s*Sparkles,\s*Eye,\s*Timer as TimerIcon,\s*\} from "lucide-react";/g, `import { CheckCircle2, XCircle, MessageSquare, Loader2, Eye } from "lucide-react";`);
content = content.replace(/import \{ Link, useLocation, useNavigate \} from "react-router-dom";\n/g, '');
content = content.replace(/import \{ useGamePersistence \} from "\.\.\/\.\.\/hooks\/useGamePersistence";\n/g, '');
content = content.replace(/import \{ useExam \} from "\.\.\/\.\.\/contexts\/ExamContext";\n/g, '');
content = content.replace(/const INITIAL_LIVES = 5;\n/g, '');

content = content.replace(/\s*const \[correctCount, setCorrectCount\] = useState\(0\);\n\s*const \[wrongCount, setWrongCount\] = useState\(0\);/g, '');
content = content.replace(/\s*setCorrectCount\(\(p\) => p \+ 1\);/g, '');
content = content.replace(/\s*setWrongCount\(\(p\) => p \+ 1\);/g, '');
content = content.replace(/\s*setCorrectCount\(0\);\n\s*setWrongCount\(0\);/g, '');

content = content.replace(/\s*const formatTime = \(s: number\) =>\n\s*`\$\{Math.floor\(s \/ 60\)\}:\$\{\(s % 60\).toString\(\).padStart\(2, "0"\)\}`;/g, '');
content = content.replace(/\s*const backLink = location.state[\s\S]*?"Geri Dön";\n/g, '');

content = content.replace(/const fetchQuestions = useCallback/g, '// eslint-disable-next-line react-hooks/exhaustive-deps\n  const fetchQuestions = useCallback');

fs.writeFileSync(fileP, content);
console.log('ESLint fixed for SSG');
