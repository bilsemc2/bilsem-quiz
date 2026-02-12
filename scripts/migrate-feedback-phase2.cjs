#!/usr/bin/env node

/**
 * Phase 2 Migration: Fix games that have showFeedback/isCorrectFeedback state name collision.
 * Also clean up any remaining old feedback overlays and unreferenced variables.
 */

const fs = require('fs');
const path = require('path');

const BRAIN_TRAINER_DIR = path.join(__dirname, '..', 'src', 'components', 'BrainTrainer');

// Files with showFeedback state collision
const collisionFiles = [
    'CosmicMemoryGame.tsx',
    'MathGridGame.tsx',
    'WordHuntGame.tsx',
    'NBackGame.tsx',
    'DualBindGame.tsx',
    'NumberSequenceGame.tsx',
    'PuzzleMasterGame.tsx',
    'MagicCubeGame.tsx',
];

let fixedCount = 0;

for (const file of collisionFiles) {
    const filePath = path.join(BRAIN_TRAINER_DIR, file);
    if (!fs.existsSync(filePath)) {
        console.log(`  ⏭️  ${file} — not found, skipping`);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    try {
        // Rename old showFeedback state to showOldFeedback to avoid collision
        content = content.replace(/const \[showFeedback, setShowFeedback\]/g, 'const [showOldFeedback, setShowOldFeedback]');
        content = content.replace(/setShowFeedback\(/g, 'setShowOldFeedback(');
        // Be careful not to replace the hook's showFeedback
        // Replace showFeedback references that are the old state boolean (not the hook function)
        // The old pattern uses showFeedback as a condition in JSX
        content = content.replace(/\{showOldFeedback && \(/g, '{showOldFeedback && (');

        // Rename isCorrectFeedback to isOldCorrectFeedback
        content = content.replace(/const \[isCorrectFeedback, setIsCorrectFeedback\]/g, 'const [isOldCorrectFeedback, setIsOldCorrectFeedback]');
        content = content.replace(/setIsCorrectFeedback\(/g, 'setIsOldCorrectFeedback(');
        content = content.replace(/isCorrectFeedback/g, 'isOldCorrectFeedback');

        // Now remove the old state declarations entirely
        content = content.replace(/\s*const \[showOldFeedback, setShowOldFeedback\] = useState(<.*?>)?\(.*?\);\n/g, '\n');
        content = content.replace(/\s*const \[isOldCorrectFeedback, setIsOldCorrectFeedback\] = useState(<.*?>)?\(.*?\);\n/g, '\n');

        // Remove setShowOldFeedback and setIsOldCorrectFeedback calls
        content = content.replace(/\s*setShowOldFeedback\([^)]*\);?\n?/g, '\n');
        content = content.replace(/\s*setIsOldCorrectFeedback\([^)]*\);?\n?/g, '\n');

        // Remove the old feedback overlay (fixed inset-0 z-50 with showOldFeedback)
        // Pattern: {showOldFeedback &&  or <AnimatePresence>{showOldFeedback &&
        const oldOverlayRegex = /\{showOldFeedback && \(\s*<motion\.div[\s\S]*?className="fixed inset-0 z-50[\s\S]*?<\/motion\.div>\s*\)\}/;
        if (oldOverlayRegex.test(content)) {
            content = content.replace(oldOverlayRegex, '');
        }

        // Some games wrap in AnimatePresence
        const wrappedOverlayRegex = /<AnimatePresence>\s*\{showOldFeedback && \(\s*<motion\.div[\s\S]*?className="fixed inset-0 z-50[\s\S]*?<\/motion\.div>\s*\)\}\s*<\/AnimatePresence>/;
        if (wrappedOverlayRegex.test(content)) {
            content = content.replace(wrappedOverlayRegex, '');
        }

        // Remove feedbackMessage references (they've been cleaned up by phase 1 but may have leftover uses)
        // Replace feedbackMessage variable with feedbackState?.message
        content = content.replace(/\{feedbackMessage\}/g, '{feedbackState?.message}');

        // Remove unused SUCCESS_MESSAGES / FAIL_MESSAGES constants
        content = content.replace(/const SUCCESS_MESSAGES\s*=\s*\[[\s\S]*?\];\s*\n/g, '');
        content = content.replace(/const FAIL_MESSAGES\s*=\s*\[[\s\S]*?\];\s*\n/g, '');
        content = content.replace(/const FAILURE_MESSAGES\s*=\s*\[[\s\S]*?\];\s*\n/g, '');

        // Remove feedbackCorrect declarations
        content = content.replace(/\s*const \[feedbackCorrect, setFeedbackCorrect\] = useState(<.*?>)?\(.*?\);\n/g, '\n');

        // Clean up any double blank lines
        content = content.replace(/\n{3,}/g, '\n\n');

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            const removedLines = original.split('\n').length - content.split('\n').length;
            console.log(`  ✅ ${file} — fixed (${removedLines > 0 ? `-${removedLines}` : `+${Math.abs(removedLines)}`} lines)`);
            fixedCount++;
        } else {
            console.log(`  ⚠️  ${file} — no changes needed`);
        }
    } catch (err) {
        console.error(`  ❌ ${file} — error: ${err.message}`);
    }
}

// Also check ALL migrated files for remaining feedbackMessage references
console.log('\n--- Checking all files for remaining issues ---\n');

const allGameFiles = fs.readdirSync(BRAIN_TRAINER_DIR)
    .filter(f => f.endsWith('Game.tsx'));

for (const file of allGameFiles) {
    const filePath = path.join(BRAIN_TRAINER_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    const issues = [];
    if (content.includes('setFeedbackMessage(') && !content.includes('// feedback managed')) {
        issues.push('has setFeedbackMessage');
    }
    if (content.includes('feedbackMessage') && !content.includes('// feedback managed') && !content.includes('feedbackState?.message')) {
        // Check if it's used as a variable (not just a comment)
        const lines = content.split('\n');
        const usageLines = lines.filter(l => l.includes('feedbackMessage') && !l.trim().startsWith('//'));
        if (usageLines.length > 0) {
            issues.push(`still references feedbackMessage (${usageLines.length} lines)`);
        }
    }
    if (/const \[showFeedback,/.test(content)) {
        issues.push('still has showFeedback state (name collision!)');
    }
    if (content.includes('fixed inset-0 z-50') && content.includes('feedbackMessage')) {
        issues.push('still has old feedback overlay');
    }

    if (issues.length > 0) {
        console.log(`  ⚠️  ${file}: ${issues.join(', ')}`);
    }
}

console.log(`\nPhase 2 complete: ${fixedCount} files fixed`);
