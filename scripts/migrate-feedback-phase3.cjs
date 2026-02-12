#!/usr/bin/env node

/**
 * Phase 3 Migration: Final cleanup of any remaining setFeedbackMessage references
 * and removal of the old feedback overlay patterns across ALL games.
 */

const fs = require('fs');
const path = require('path');

const BRAIN_TRAINER_DIR = path.join(__dirname, '..', 'src', 'components', 'BrainTrainer');

const allGameFiles = fs.readdirSync(BRAIN_TRAINER_DIR)
    .filter(f => f.endsWith('Game.tsx'));

let fixedCount = 0;
const issues = [];

for (const file of allGameFiles) {
    const filePath = path.join(BRAIN_TRAINER_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // 1. Remove all remaining setFeedbackMessage calls
    content = content.replace(/\s*setFeedbackMessage\([^)]*\);?\n?/g, '\n');

    // 2. Remove feedbackMessage state declaration if still present
    content = content.replace(/\s*const \[feedbackMessage, setFeedbackMessage\] = useState(<string>)?\(''\);?\n/g, '\n');
    content = content.replace(/\s*const \[feedbackMessage, setFeedbackMessage\] = useState\(''\);?\n/g, '\n');

    // 3. Replace feedbackMessage variable usage with feedbackState?.message
    content = content.replace(/\{feedbackMessage\}/g, '{feedbackState?.message}');

    // 4. Remove old full-screen feedback overlays (fixed inset-0 z-50 patterns)
    // Various patterns exist:
    // a) {phase === 'feedback' && ( <motion.div ... fixed inset-0 z-50 ... </motion.div> )}
    const feedbackPhaseOverlay = /\{phase === 'feedback' && \(\s*<motion\.div[\s\S]*?className=[\s\S]*?fixed inset-0 z-50[\s\S]*?<\/motion\.div>\s*\)\}/;
    while (feedbackPhaseOverlay.test(content)) {
        content = content.replace(feedbackPhaseOverlay, '');
    }

    // b) Wrapped in AnimatePresence
    const animatedFeedbackOverlay = /<AnimatePresence>\s*\{phase === 'feedback' && \(\s*<motion\.div[\s\S]*?fixed inset-0 z-50[\s\S]*?<\/motion\.div>\s*\)\}\s*<\/AnimatePresence>/;
    while (animatedFeedbackOverlay.test(content)) {
        content = content.replace(animatedFeedbackOverlay, '');
    }

    // 5. Remove remaining feedbackCorrect state
    content = content.replace(/\s*const \[feedbackCorrect, setFeedbackCorrect\] = useState(<.*?>)?\(.*?\);?\n/g, '\n');
    content = content.replace(/\s*setFeedbackCorrect\([^)]*\);?\n?/g, '\n');

    // 6. Remove remaining isCorrect state for feedback (but NOT local isCorrect variables)
    // Only remove if it's used as useState<boolean | null>
    content = content.replace(/\s*const \[isCorrect, setIsCorrect\] = useState<boolean \| null>\(null\);?\n/g, '\n');

    // 7. Remove any leftover `setIsCorrect` that was used for feedback UI (not local logic)
    // Be careful here — some games use isCorrect as a local variable, not state

    // 8. Remove SUCCESS_MESSAGES/FAIL_MESSAGES/randomMsg/randomMessage if unused
    // Only remove if no other reference exists after our changes
    if (!content.includes('CORRECT_MESSAGES') || (content.match(/CORRECT_MESSAGES/g) || []).length <= 1) {
        content = content.replace(/const CORRECT_MESSAGES\s*=\s*\[[\s\S]*?\];\s*\n/g, '');
    }
    if (!content.includes('WRONG_MESSAGES') || (content.match(/WRONG_MESSAGES/g) || []).length <= 1) {
        content = content.replace(/const WRONG_MESSAGES\s*=\s*\[[\s\S]*?\];\s*\n/g, '');
    }
    // randomMsg helper  
    const randomMsgMatches = content.match(/randomMsg/g);
    if (randomMsgMatches && randomMsgMatches.length <= 1) {
        content = content.replace(/const randomMsg\s*=[\s\S]*?;\s*\n/g, '');
    }
    const randomMessageMatches = content.match(/randomMessage/g);
    if (randomMessageMatches && randomMessageMatches.length <= 1) {
        content = content.replace(/const randomMessage\s*=[\s\S]*?;\s*\n/g, '');
    }

    // 9. Clean up triple+ blank lines
    content = content.replace(/\n{3,}/g, '\n\n');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        const removedLines = original.split('\n').length - content.split('\n').length;
        console.log(`  ✅ ${file} — cleaned (${removedLines > 0 ? `-${removedLines}` : `+${Math.abs(removedLines)}`} lines)`);
        fixedCount++;
    }
}

// Final verification
console.log('\n--- Final verification ---\n');
let cleanCount = 0;
for (const file of allGameFiles) {
    const filePath = path.join(BRAIN_TRAINER_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    const remaining = [];
    if (content.includes('setFeedbackMessage(')) remaining.push('setFeedbackMessage');
    if (/const \[feedbackMessage/.test(content)) remaining.push('feedbackMessage state');
    if (/const \[showFeedback, setShowFeedback\]/.test(content)) remaining.push('showFeedback state collision');
    if (/const \[feedbackCorrect/.test(content)) remaining.push('feedbackCorrect state');
    // Check for old overlay but exclude GameFeedbackBanner
    const lines = content.split('\n');
    const oldOverlayLines = lines.filter(l => l.includes('fixed inset-0 z-50') && l.includes('feedback'));
    if (oldOverlayLines.length > 0) remaining.push('old overlay');

    if (remaining.length > 0) {
        console.log(`  ⚠️  ${file}: ${remaining.join(', ')}`);
    } else {
        cleanCount++;
    }
}

console.log(`\n${cleanCount}/${allGameFiles.length} files clean`);
console.log(`Phase 3 complete: ${fixedCount} files cleaned`);
