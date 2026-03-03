const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'BrainTrainer');
const files = fs.readdirSync(dir).filter(f => f.endsWith('Game.tsx'));

let processedCounter = 0;

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('bg-[#FAF9F6]')) return;

    // Background replacement logic
    content = content.replace(
        /min-h-screen bg-gradient-to-[a-zA-Z0-9-\s]+flex[a-zA-Z0-9-\s]*text-white/g,
        'min-h-screen bg-[#FAF9F6] dark:bg-slate-900 flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 relative overflow-hidden'
    );
    content = content.replace(
        /min-h-screen bg-gradient-to-[a-zA-Z0-9-\s]+text-white/g,
        'min-h-screen bg-[#FAF9F6] dark:bg-slate-900 text-black dark:text-white transition-colors duration-300 relative overflow-hidden flex flex-col'
    );

    // Common HUD styles
    content = content.replace(/bg-amber-[0-9]+\/20 border border-amber-[0-9]+\/[0-9]+/g, 'bg-cyber-yellow border-4 border-black shadow-[4px_4px_0_#000] rotate-1 px-4 py-2 sm:px-5 sm:py-3 rounded-2xl');
    content = content.replace(/text-amber-400 fill-amber-400/g, 'text-black fill-black');

    content = content.replace(/bg-red-[0-9]+\/20 border border-red-[0-9]+\/[0-9]+/g, 'bg-cyber-pink border-4 border-black shadow-[4px_4px_0_#000] -rotate-1 px-4 py-2 sm:px-5 sm:py-3 rounded-2xl');
    content = content.replace(/text-red-400 fill-red-400/g, 'text-black fill-black');
    content = content.replace(/text-red-900/g, 'text-black/20 fill-black/20');

    content = content.replace(/bg-blue-[0-9]+\/20 border border-blue-[0-9]+\/[0-9]+/g, 'bg-cyber-blue border-4 border-black shadow-[4px_4px_0_#000] rotate-2 px-4 py-2 sm:px-5 sm:py-3 rounded-2xl');
    content = content.replace(/text-blue-400/g, 'text-white');

    // Zap specific
    content = content.replace(/background:\s*'linear-gradient[^\)]+\)',\s*border:\s*'1px solid[^\)]+'\s*}/gi, '} className="px-4 py-2 sm:px-5 sm:py-3 rounded-2xl bg-emerald-400 border-4 border-black shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#0f172a] -rotate-2"');

    // General glass
    content = content.replace(/bg-white\/[0-9]+ backdrop-blur-[A-Za-z0-9]+ rounded-[\[]?([0-9a-zA-Z-\s]+)[\]]? p-[0-9]+ border border-white\/[0-9]+ shadow-[A-Za-z0-9]+/g, 'bg-white dark:bg-slate-800 rounded-3xl p-8 border-4 border-black shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#0f172a]');

    // Write back
    fs.writeFileSync(filePath, content);
    processedCounter++;
});

console.log(`Successfully processed ${processedCounter} files.`);
