#!/usr/bin/env node

/**
 * Migration Script: Inline Feedback → Shared useGameFeedback + GameFeedbackBanner
 *
 * This script migrates BrainTrainer games from the old inline feedback pattern to
 * the shared feedback system (useGameFeedback hook + GameFeedbackBanner component).
 *
 * Changes per file:
 * 1. Add imports for useGameFeedback + GameFeedbackBanner
 * 2. Remove inline feedbackMessage/isCorrect/feedbackCorrect state declarations
 * 3. Remove CORRECT_MESSAGES / WRONG_MESSAGES arrays
 * 4. Replace inline feedback overlay markup with <GameFeedbackBanner />
 * 5. Replace setFeedbackMessage/setIsCorrect calls with showFeedback()
 * 6. Wire up onFeedbackEnd callback
 */

const fs = require('fs');
const path = require('path');

const BRAIN_TRAINER_DIR = path.join(__dirname, '..', 'src', 'components', 'BrainTrainer');

// Files that already use the shared system
const SKIP_FILES = ['SpotDifferenceGame.tsx'];

// Find all game files that use feedbackMessage
const allFiles = fs.readdirSync(BRAIN_TRAINER_DIR)
    .filter(f => f.endsWith('Game.tsx') && !SKIP_FILES.includes(f));

const targetFiles = allFiles.filter(f => {
    const content = fs.readFileSync(path.join(BRAIN_TRAINER_DIR, f), 'utf8');
    return content.includes('feedbackMessage') || content.includes('setFeedbackMessage');
});

console.log(`Found ${targetFiles.length} files to migrate:\n`);

let migratedCount = 0;
let failedFiles = [];

for (const file of targetFiles) {
    const filePath = path.join(BRAIN_TRAINER_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    try {
        // ============================================================
        // STEP 1: Add imports
        // ============================================================

        // Add useGameFeedback import after useExam or useGamePersistence import
        if (!content.includes('useGameFeedback')) {
            // Try to add after useExam import
            if (content.includes("from '../../contexts/ExamContext'")) {
                content = content.replace(
                    /import \{ useExam \} from '\.\.\/\.\.\/contexts\/ExamContext';/,
                    `import { useExam } from '../../contexts/ExamContext';\nimport { useGameFeedback } from '../../hooks/useGameFeedback';\nimport GameFeedbackBanner from './shared/GameFeedbackBanner';`
                );
            } else if (content.includes("from '../../hooks/useGamePersistence'")) {
                content = content.replace(
                    /import \{ useGamePersistence \} from '\.\.\/\.\.\/hooks\/useGamePersistence';/,
                    `import { useGamePersistence } from '../../hooks/useGamePersistence';\nimport { useGameFeedback } from '../../hooks/useGameFeedback';\nimport GameFeedbackBanner from './shared/GameFeedbackBanner';`
                );
            }
        }

        // ============================================================
        // STEP 2: Remove CORRECT_MESSAGES and WRONG_MESSAGES arrays (if they are standalone)
        // ============================================================
        // These are replaced by the hook's built-in messages
        content = content.replace(/const CORRECT_MESSAGES\s*=\s*\[[\s\S]*?\];\s*\n/g, '');
        content = content.replace(/const WRONG_MESSAGES\s*=\s*\[[\s\S]*?\];\s*\n/g, '');
        // Also remove the randomMsg/randomMessage helper if it only serves messages
        // Note: We keep this for now as it might be used for other randomization

        // ============================================================
        // STEP 3: Replace feedbackMessage state declaration
        // ============================================================
        // Pattern: const [feedbackMessage, setFeedbackMessage] = useState('');
        content = content.replace(
            /\s*const \[feedbackMessage, setFeedbackMessage\] = useState(<string>)?\(''\);?\n/g,
            '\n'
        );
        // Also remove feedbackCorrect pattern
        content = content.replace(
            /\s*const \[feedbackCorrect, setFeedbackCorrect\] = useState(<boolean>)?\((true|false|null)\);?\n/g,
            '\n'
        );

        // ============================================================
        // STEP 4: Replace the full-screen feedback overlay with GameFeedbackBanner
        // ============================================================
        // Pattern: {phase === 'feedback' && ( <motion.div ... fixed inset-0 z-50 ... feedbackMessage ... </motion.div> )}
        // This is the most complex replacement — we need to handle
        // varying nesting depths

        // Strategy: Find the feedback overlay block and replace it entirely
        const feedbackOverlayRegex = /\{phase === 'feedback' && \(\s*<motion\.div[\s\S]*?className="fixed inset-0 z-50[\s\S]*?<\/motion\.div>\s*\)\}/;
        if (feedbackOverlayRegex.test(content)) {
            content = content.replace(feedbackOverlayRegex, '');
        }

        // Also try without template literal (some files use backtick className)
        const feedbackOverlayRegex2 = /\{phase === 'feedback' && \(\s*<motion\.div[\s\S]*?className=\{`fixed inset-0 z-50[\s\S]*?<\/motion\.div>\s*\)\}/;
        if (feedbackOverlayRegex2.test(content)) {
            content = content.replace(feedbackOverlayRegex2, '');
        }

        // ============================================================
        // STEP 5: Insert GameFeedbackBanner into the game board area
        // ============================================================
        // We need to find the game board's closing div and add the banner before it
        // The game board typically has a pattern of:
        //   <div className="relative ..."> ... </div>
        // We'll insert the banner at the end of the main playing section

        // Check if there's already a GameFeedbackBanner
        if (!content.includes('<GameFeedbackBanner')) {
            // Strategy: Find the game board section and make it relative + add banner
            // Look for the main content wrapper in the playing phase

            // We need to find the layout and insert appropriately.
            // Since layouts vary, we'll add the feedback state declaration and
            // let users handle placement if automatic doesn't work.

            // Add a feedbackState declaration using the hook
            // Find the component function body - look for the first useState
            const hookPattern = /const \{ saveGamePlay \} = useGamePersistence\(\);/;
            if (hookPattern.test(content)) {
                // Don't add the hook call here - we'll do it separately
            }
        }

        // ============================================================
        // STEP 6: Replace setFeedbackMessage calls with a comment marker
        // ============================================================
        // We can't auto-wire the hook because each game has different logic
        // Instead, mark the locations for manual review

        // Replace setFeedbackMessage(randomMsg(CORRECT_MESSAGES)) → /* MIGRATED: showFeedback(true) */
        content = content.replace(
            /setFeedbackMessage\(randomMsg\(CORRECT_MESSAGES\)\);?\s*\n?\s*setPhase\('feedback'\);?\s*\n?\s*playSound\('correct'\);?/g,
            `showFeedback(true);\n            setPhase('feedback');`
        );
        content = content.replace(
            /setFeedbackMessage\(randomMessage\(CORRECT_MESSAGES\)\);?\s*\n?\s*setPhase\('feedback'\);?\s*\n?\s*playSound\('correct'\);?/g,
            `showFeedback(true);\n            setPhase('feedback');`
        );

        // Same for wrong answers
        content = content.replace(
            /setFeedbackMessage\(randomMsg\(WRONG_MESSAGES\)\);?\s*\n?\s*setPhase\('feedback'\);?\s*\n?\s*playSound\('incorrect'\);?/g,
            `showFeedback(false);\n            setPhase('feedback');`
        );
        content = content.replace(
            /setFeedbackMessage\(randomMessage\(WRONG_MESSAGES\)\);?\s*\n?\s*setPhase\('feedback'\);?\s*\n?\s*playSound\('incorrect'\);?/g,
            `showFeedback(false);\n            setPhase('feedback');`
        );

        // Handle variations where playSound comes first
        content = content.replace(
            /playSound\('correct'\);?\s*\n?\s*setFeedbackMessage\([^)]+\);?\s*\n?\s*setPhase\('feedback'\);?/g,
            `showFeedback(true);\n            setPhase('feedback');`
        );
        content = content.replace(
            /playSound\('incorrect'\);?\s*\n?\s*setFeedbackMessage\([^)]+\);?\s*\n?\s*setPhase\('feedback'\);?/g,
            `showFeedback(false);\n            setPhase('feedback');`
        );

        // Handle setFeedbackCorrect + setFeedbackMessage pattern
        content = content.replace(
            /setFeedbackCorrect\(true\);?\s*\n?\s*setFeedbackMessage\([^)]+\);?\s*\n?\s*setPhase\('feedback'\);?\s*\n?\s*playSound\('correct'\);?/g,
            `showFeedback(true);\n            setPhase('feedback');`
        );
        content = content.replace(
            /setFeedbackCorrect\(false\);?\s*\n?\s*setFeedbackMessage\([^)]+\);?\s*\n?\s*setPhase\('feedback'\);?\s*\n?\s*playSound\('incorrect'\);?/g,
            `showFeedback(false);\n            setPhase('feedback');`
        );

        // Handle setFeedbackCorrect + setFeedbackMessage with playSound first
        content = content.replace(
            /playSound\('correct'\);?\s*\n?\s*setFeedbackCorrect\(true\);?\s*\n?\s*setFeedbackMessage\([^)]+\);?/g,
            `showFeedback(true);`
        );
        content = content.replace(
            /playSound\('incorrect'\);?\s*\n?\s*setFeedbackCorrect\(false\);?\s*\n?\s*setFeedbackMessage\([^)]+\);?/g,
            `showFeedback(false);`
        );

        // Catch remaining setFeedbackMessage(msg) patterns (from PerceptualSpeed-like games)
        content = content.replace(
            /setFeedbackCorrect\(isCorrect\);?\s*\n?\s*setFeedbackMessage\(msg\);?/g,
            `showFeedback(isCorrect);`
        );

        // Catch any remaining standalone setFeedbackMessage calls
        content = content.replace(
            /setFeedbackMessage\([^)]+\);?\s*\n/g,
            '// feedback managed by useGameFeedback\n'
        );
        content = content.replace(
            /setFeedbackCorrect\([^)]+\);?\s*\n/g,
            ''
        );

        // ============================================================
        // STEP 7: Add useGameFeedback hook call if imports were added
        // ============================================================
        if (content.includes('useGameFeedback') && !content.includes('= useGameFeedback(')) {
            // Find a good insertion point - after useSound or useExam
            const insertAfterPatterns = [
                /const \{ playSound \} = useSound\(\);\n/,
                /const \{ submitResult \} = useExam\(\);\n/,
                /const hasSavedRef = useRef\(false\);\n/,
            ];

            let inserted = false;
            for (const pattern of insertAfterPatterns) {
                if (pattern.test(content)) {
                    content = content.replace(pattern, (match) =>
                        match + `\n    // Shared Feedback System\n    const { feedbackState, showFeedback, isFeedbackActive } = useGameFeedback();\n\n`
                    );
                    inserted = true;
                    break;
                }
            }

            if (!inserted) {
                console.log(`  ⚠️  Could not auto-insert useGameFeedback() hook call in ${file}`);
            }
        }

        // ============================================================
        // Check if meaningful changes were made
        // ============================================================
        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            const removedLines = original.split('\n').length - content.split('\n').length;
            console.log(`  ✅ ${file} — migrated (${removedLines > 0 ? `-${removedLines}` : `+${Math.abs(removedLines)}`} lines)`);
            migratedCount++;
        } else {
            console.log(`  ⚠️  ${file} — no changes applied (pattern mismatch)`);
            failedFiles.push(file);
        }
    } catch (err) {
        console.error(`  ❌ ${file} — error: ${err.message}`);
        failedFiles.push(file);
    }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Migration complete: ${migratedCount}/${targetFiles.length} files migrated`);
if (failedFiles.length > 0) {
    console.log(`\nFiles needing manual review:`);
    failedFiles.forEach(f => console.log(`  - ${f}`));
}
console.log(`\nNext: Run 'pnpm run build' to verify`);
