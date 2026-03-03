const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'BrainTrainer');
const files = fs.readdirSync(dir).filter(f => f.endsWith('Game.tsx'));

let count = 0;
files.forEach(file => {
    const p = path.join(dir, file);
    let c = fs.readFileSync(p, 'utf8');

    // Only apply to files that HAVE the new Cyber-Pop container to be safe
    if (!c.includes('bg-[#FAF9F6]')) return;

    // 1. Remove absolute glow blobs
    c = c.replace(/<div className="absolute[^"]+w-[0-9]+ h-[0-9]+ bg-[a-zA-Z]+-[0-9]+\/[0-9]+ rounded-full blur-[a-zA-Z0-9]+" \/>/g, '');
    c = c.replace(/<div className="fixed inset-0 overflow-hidden pointer-events-none">\s*<\/div>/g, '');

    // 2. Fix Tebrikler
    c = c.replace(/text-3xl font-bold text-[a-zA-Z]+-[0-9]+ mb-2/g, 'text-4xl sm:text-5xl font-syne font-black text-black dark:text-white mb-4 uppercase tracking-tight');

    // 3. Fix H1s
    c = c.replace(/text-4xl font-bold mb-4 bg-gradient-to-r from-[a-zA-Z]+-[0-9]+ to-[a-zA-Z]+-[0-9]+ bg-clip-text text-transparent/g, 'text-3xl sm:text-5xl font-syne font-black text-black dark:text-white mb-6 uppercase tracking-tight drop-shadow-sm');

    // 4. Fix Backlinks
    c = c.replace(/<Link to=\{backLink\} className="block text-slate-500 hover:text-white transition-colors">([^<]+)<\/Link>/g, '<Link to={backLink} className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-slate-800 text-black dark:text-white font-syne font-black text-xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#0f172a] hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] dark:hover:shadow-[12px_12px_0_#0f172a] active:translate-y-2 active:translate-x-1 active:shadow-none transition-all text-center">$1</Link>');

    // 5. Fix Start Button
    c = c.replace(/px-[0-9]+ py-[0-9]+ rounded-2xl font-bold text-xl/g, 'px-10 py-5 bg-cyber-blue text-white font-syne font-black border-4 border-black shadow-[8px_8px_0_#000] rounded-2xl hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:translate-x-1 active:shadow-none transition-all text-xl');
    c = c.replace(/style=\{\{ background: 'linear-gradient[^}]+\}\}/g, '');

    // 6. Fix "play" icon fill
    c = c.replace(/Play size=\{28\} className="(fill-white|text-white)"/g, 'Play size={28} className="fill-white"');

    // 7. Slate 400 texts
    c = c.replace(/className="text-slate-400 mb-6"/g, 'className="text-slate-600 dark:text-slate-300 font-chivo font-medium text-lg mb-8"');
    c = c.replace(/className="text-slate-400 mb-8"/g, 'className="text-slate-600 dark:text-slate-300 font-chivo font-medium text-lg mb-8"');

    // 8. Fix Score/Level labels
    c = c.replace(/className="text-slate-400 text-sm"/g, 'className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-sm mb-2"');
    c = c.replace(/className="text-2xl font-bold text-[a-zA-Z]+-[0-9]+"/g, 'className="text-4xl font-black text-cyber-blue drop-shadow-sm"');

    // 9. Fix How to Play header
    c = c.replace(/text-lg font-bold text-[a-zA-Z]+-[0-9]+ mb-3/g, 'text-lg sm:text-xl font-syne font-black text-black dark:text-white mb-4 uppercase tracking-wide');

    // 10. Fix How to Play lists
    c = c.replace(/className="space-y-2 text-[a-zA-Z]+-[0-9]+ text-sm"/g, 'className="space-y-3 text-slate-700 dark:text-slate-300 font-chivo font-bold text-sm sm:text-base leading-relaxed"');

    fs.writeFileSync(p, c);
    count++;
});
console.log(`Refined ${count} games.`);
