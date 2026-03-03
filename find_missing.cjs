const fs = require('fs');

const taskContent = fs.readFileSync('/Users/yetenekvezeka/.gemini/antigravity/brain/3660fbec-07ed-4358-ac29-51dc27358699/task.md', 'utf8');

const files = fs.readdirSync('src/components/BrainTrainer')
    .filter(f => f.endsWith('.tsx') && f !== 'BrainTrainer.tsx' && f !== 'ColorGrid.tsx' && f !== 'ColorPerception.tsx'); // and other non-*Game.tsx

const missing = files.filter(f => !taskContent.includes(f));
console.log(missing);
