import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const focusManagedGameFiles = [
    '../../src/components/Arcade/Games/ChromaHafiza/ChromaHafiza.tsx',
    '../../src/components/Arcade/Games/KartDedektifi/KartDedektifi.tsx',
    '../../src/components/Arcade/Games/OruntuluTop/OruntuluTop.tsx',
    '../../src/components/Arcade/Games/NeseliBalonlar/NeseliBalonlar.tsx',
    '../../src/components/Arcade/Games/TersNavigator/TersNavigator.tsx',
    '../../src/components/Arcade/Games/Ayna/AynaUstasi.tsx',
    '../../src/components/Arcade/Games/RenkliLambalar/RenkliLambalar.tsx',
    '../../src/components/Arcade/Games/RenkliBalon/RenkliBalon.tsx',
    '../../src/components/Arcade/Games/YolBulmaca/YolBulmaca.tsx',
    '../../src/components/Arcade/Games/SevimliMantik/SevimliMantik.tsx',
    '../../src/components/Arcade/Games/paper/KraftOrigami.tsx',
    '../../src/components/Arcade/Games/chromabreak/ChromaBreak.tsx',
    '../../src/components/Arcade/Games/labirent/LabirentUstasi.tsx',
    '../../src/components/Arcade/Games/DarkMaze/DarkMaze.tsx',
];

const getArcadeGameFiles = (directoryUrl: URL): URL[] => {
    const entries = readdirSync(directoryUrl, { withFileTypes: true });

    return entries.flatMap((entry) => {
        const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directoryUrl);

        if (entry.isDirectory()) {
            return getArcadeGameFiles(entryUrl);
        }

        return entry.name.endsWith('.tsx') ? [entryUrl] : [];
    });
};

test('kid game shell exposes the shared play area ref contract', () => {
    const shellSource = readFileSync(new URL('../../src/components/kid-ui/KidGameShell.tsx', import.meta.url), 'utf8');
    const focusHookSource = readFileSync(new URL('../../src/hooks/useGameViewportFocus.ts', import.meta.url), 'utf8');
    const viewportAnchorSource = readFileSync(new URL('../../src/hooks/useViewportAnchor.ts', import.meta.url), 'utf8');
    const uxDocSource = readFileSync(new URL('../../docs/game-ux-conventions.md', import.meta.url), 'utf8');

    assert.match(shellSource, /playAreaRef\?: React\.Ref<HTMLDivElement>/);
    assert.match(shellSource, /ref=\{playAreaRef\}/);
    assert.match(focusHookSource, /useViewportAnchor/);
    assert.match(focusHookSource, /deferFrames: 2/);
    assert.match(viewportAnchorSource, /scrollIntoView\(\{ behavior, block \}\)/);
    assert.match(uxDocSource, /useGameViewportFocus/);
    assert.match(uxDocSource, /useArcadeSoundEffects/);
    assert.match(uxDocSource, /BrainTrainerShell/);
});

test('brain trainer shared shell manages viewport focus without top reset scrolls', () => {
    const brainTrainerShellSource = readFileSync(
        new URL('../../src/components/BrainTrainer/shared/BrainTrainerShell.tsx', import.meta.url),
        'utf8',
    );
    const brainTrainerEngineSource = readFileSync(
        new URL('../../src/components/BrainTrainer/shared/useGameEngine.ts', import.meta.url),
        'utf8',
    );
    const reactionTimeControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/reactionTime/useReactionTimeController.ts', import.meta.url),
        'utf8',
    );

    assert.match(brainTrainerShellSource, /useGameViewportFocus/);
    assert.match(brainTrainerShellSource, /const \{ playAreaRef\s*(?:,\s*focusPlayArea)?\s*\} = useGameViewportFocus\(\);/);
    assert.match(brainTrainerShellSource, /playAreaRef/);
    assert.match(brainTrainerShellSource, /ref=\{playAreaRef\}/);

    assert.match(brainTrainerEngineSource, /phaseTransitionTimeoutRef/);
    assert.doesNotMatch(brainTrainerEngineSource, /window\.scrollTo\(0, 0\)/);
    assert.doesNotMatch(reactionTimeControllerSource, /window\.scrollTo\(0, 0\)/);
});

test('bubble numbers game uses the shared viewport focus helper instead of top reset scrolls', () => {
    const bubbleNumbersSource = readFileSync(
        new URL('../../src/components/BubbleNumbersGame/BubbleNumbersGame.tsx', import.meta.url),
        'utf8',
    );
    const bubbleNumbersHookSource = readFileSync(
        new URL('../../src/components/BubbleNumbersGame/hooks/useBubbleNumbersGame.ts', import.meta.url),
        'utf8',
    );

    assert.match(bubbleNumbersSource, /useGameViewportFocus/);
    assert.match(bubbleNumbersSource, /const \{ playAreaRef, focusPlayArea \} = useGameViewportFocus\(\);/);
    assert.match(bubbleNumbersSource, /useBubbleNumbersGame\(\{ focusPlayArea \}\)/);
    assert.match(bubbleNumbersSource, /playAreaRef=\{playAreaRef\}/);
    assert.match(bubbleNumbersHookSource, /focusPlayArea\?\.\(\);/);
    assert.doesNotMatch(bubbleNumbersHookSource, /window\.scrollTo\(0, 0\)/);
});

const arcadeControllerFiles: Record<string, string> = {
    '../../src/components/Arcade/Games/SevimliMantik/SevimliMantik.tsx': '../../src/components/Arcade/Games/SevimliMantik/useSevimliMantikController.ts',
    '../../src/components/Arcade/Games/paper/KraftOrigami.tsx': '../../src/components/Arcade/Games/paper/useKraftOrigamiController.ts',
    '../../src/components/Arcade/Games/labirent/LabirentUstasi.tsx': '../../src/components/Arcade/Games/labirent/useLabirentController.ts',
};

test('migrated kid-shell arcade games use shared viewport focus instead of top reset scroll', () => {
    focusManagedGameFiles.forEach((relativePath) => {
        const componentSource = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
        const controllerPath = arcadeControllerFiles[relativePath];
        const controllerSource = controllerPath
            ? readFileSync(new URL(controllerPath, import.meta.url), 'utf8')
            : '';
        const source = componentSource + '\n' + controllerSource;

        assert.match(source, /KidGameShell/);
        assert.match(source, /KidGameStatusOverlay/);
        assert.match(source, /useGameViewportFocus/);
        assert.match(source, /playAreaRef=\{(?:ctrl\.)?playAreaRef\}/);
        assert.doesNotMatch(source, /window\.scrollTo\(0, 0\)/);
        assert.doesNotMatch(source, /window\.location\.assign\(['"]\/bilsem-zeka['"]\)/);
    });
});

test('kart dedektifi and ayna ustasi clear level transition timeouts before phase changes', () => {
    const kartDedektifiSource = readFileSync(
        new URL('../../src/components/Arcade/Games/KartDedektifi/KartDedektifi.tsx', import.meta.url),
        'utf8',
    );
    const aynaUstasiSource = readFileSync(
        new URL('../../src/components/Arcade/Games/Ayna/AynaUstasi.tsx', import.meta.url),
        'utf8',
    );

    assert.match(kartDedektifiSource, /const clearRoundResetTimeout = useCallback/);
    assert.match(kartDedektifiSource, /useEffect\(\(\) => clearRoundResetTimeout, \[clearRoundResetTimeout\]\)/);
    assert.match(kartDedektifiSource, /clearRoundResetTimeout\(\);\s*roundResetTimeoutRef\.current = window\.setTimeout/);

    assert.match(aynaUstasiSource, /const clearLevelCompleteTimeout = useCallback/);
    assert.match(aynaUstasiSource, /useEffect\(\(\) => clearLevelCompleteTimeout, \[clearLevelCompleteTimeout\]\)/);
    assert.match(aynaUstasiSource, /clearLevelCompleteTimeout\(\);\s*levelCompleteTimeoutRef\.current = window\.setTimeout/);
});

test('neseli balonlar preserves last-life game over saves across result delay cleanup', () => {
    const neseliBalonlarHookSource = readFileSync(
        new URL('../../src/components/Arcade/Games/NeseliBalonlar/useNeseliBalonlarGame.ts', import.meta.url),
        'utf8',
    );

    assert.match(neseliBalonlarHookSource, /const pendingGameOverSaveRef = useRef<ArcadeFinishOptions \| null>\(null\)/);
    assert.match(neseliBalonlarHookSource, /if \(pendingGameOverSaveRef\.current\) \{\s*void saveResult\(pendingGameOverSaveRef\.current\);/);
    assert.match(neseliBalonlarHookSource, /pendingGameOverSaveRef\.current = pendingGameOverResult/);
    assert.match(neseliBalonlarHookSource, /if \(pendingGameOverResult\) \{\s*pendingGameOverSaveRef\.current = null;\s*setPhase\('gameover'\);\s*void finishGame\(\{ \.\.\.pendingGameOverResult, status: 'GAME_OVER' \}\);/);
});

test('arcade games no longer import the legacy arcade shell', () => {
    const arcadeGameFiles = getArcadeGameFiles(new URL('../../src/components/Arcade/Games/', import.meta.url));

    arcadeGameFiles.forEach((fileUrl) => {
        const source = readFileSync(fileUrl, 'utf8');
        assert.doesNotMatch(source, /ArcadeGameShell/);
    });
});

test('arcade games no longer import the legacy arcade feedback banner', () => {
    const arcadeGameFiles = getArcadeGameFiles(new URL('../../src/components/Arcade/Games/', import.meta.url));

    arcadeGameFiles.forEach((fileUrl) => {
        const source = readFileSync(fileUrl, 'utf8');
        assert.doesNotMatch(source, /ArcadeFeedbackBanner/);
    });
});

test('chromabreak visible copy stays free of known broken turkish strings', () => {
    const source = readFileSync(
        new URL('../../src/components/Arcade/Games/chromabreak/components/BreakoutGame.tsx', import.meta.url),
        'utf8',
    );

    assert.doesNotMatch(source, /Topu Firlat/);
    assert.doesNotMatch(source, /Logolu bloklari kir ve guc topla!/);
    assert.doesNotMatch(source, /[ÃÄÅ�]/);
});

test('selected arcade games use the shared soft sound helper', () => {
    const oruntuluTopSource = readFileSync(
        new URL('../../src/components/Arcade/Games/OruntuluTop/OruntuluTop.tsx', import.meta.url),
        'utf8',
    );
    const chromaBreakSource = readFileSync(
        new URL('../../src/components/Arcade/Games/chromabreak/ChromaBreak.tsx', import.meta.url),
        'utf8',
    );
    const neseliBalonlarHookSource = readFileSync(
        new URL('../../src/components/Arcade/Games/NeseliBalonlar/useNeseliBalonlarGame.ts', import.meta.url),
        'utf8',
    );
    const chromaHafizaSource = readFileSync(
        new URL('../../src/components/Arcade/Games/ChromaHafiza/ChromaHafiza.tsx', import.meta.url),
        'utf8',
    );
    const kartDedektifiSource = readFileSync(
        new URL('../../src/components/Arcade/Games/KartDedektifi/KartDedektifi.tsx', import.meta.url),
        'utf8',
    );
    const renkliLambalarSource = readFileSync(
        new URL('../../src/components/Arcade/Games/RenkliLambalar/RenkliLambalar.tsx', import.meta.url),
        'utf8',
    );
    const labirentUstasiComponentSource = readFileSync(
        new URL('../../src/components/Arcade/Games/labirent/LabirentUstasi.tsx', import.meta.url),
        'utf8',
    );
    const labirentUstasiControllerSource = readFileSync(
        new URL('../../src/components/Arcade/Games/labirent/useLabirentController.ts', import.meta.url),
        'utf8',
    );
    const labirentUstasiSource = labirentUstasiComponentSource + '\n' + labirentUstasiControllerSource;

    assert.match(oruntuluTopSource, /useArcadeSoundEffects/);
    assert.match(oruntuluTopSource, /playArcadeSound\('launch'\)/);
    assert.match(chromaBreakSource, /useArcadeSoundEffects/);
    assert.match(chromaBreakSource, /playArcadeSound\('hit'\)/);
    assert.match(neseliBalonlarHookSource, /useArcadeSoundEffects/);
    assert.match(neseliBalonlarHookSource, /playArcadeSound\('levelUp'\)/);
    assert.match(chromaHafizaSource, /useArcadeSoundEffects/);
    assert.match(chromaHafizaSource, /playArcadeSound\('success'\)/);
    assert.match(kartDedektifiSource, /useArcadeSoundEffects/);
    assert.match(kartDedektifiSource, /playArcadeSound\('levelUp'\)/);
    assert.match(renkliLambalarSource, /useArcadeSoundEffects/);
    assert.match(renkliLambalarSource, /playArcadeSound\('fail'\)/);
    assert.match(labirentUstasiSource, /useArcadeSoundEffects/);
    assert.match(labirentUstasiSource, /playArcadeSound\('success'\)/);
});

test('selected brain trainer games use explicit feedback copy without duplicate answer sounds', () => {
    const noiseFilterControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/noiseFilter/useNoiseFilterController.ts', import.meta.url),
        'utf8',
    );
    const reactionTimeControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/reactionTime/useReactionTimeController.ts', import.meta.url),
        'utf8',
    );
    const stroopControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/stroop/useStroopController.ts', import.meta.url),
        'utf8',
    );
    const stroopLogicSource = readFileSync(
        new URL('../../src/components/BrainTrainer/stroop/logic.ts', import.meta.url),
        'utf8',
    );
    const stroopSource = stroopControllerSource + '\n' + stroopLogicSource;
    const faceExpressionControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/faceExpression/useFaceExpressionController.ts', import.meta.url),
        'utf8',
    );
    const faceExpressionLogicSource = readFileSync(
        new URL('../../src/components/BrainTrainer/faceExpression/logic.ts', import.meta.url),
        'utf8',
    );
    const faceExpressionSource = faceExpressionControllerSource + '\n' + faceExpressionLogicSource;
    const directionStroopControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/directionStroop/useDirectionStroopController.ts', import.meta.url),
        'utf8',
    );
    const directionStroopLogicSource = readFileSync(
        new URL('../../src/components/BrainTrainer/directionStroop/logic.ts', import.meta.url),
        'utf8',
    );
    const directionStroopSource = directionStroopControllerSource + '\n' + directionStroopLogicSource;
    const pencilStroopControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/pencilStroop/usePencilStroopController.ts', import.meta.url),
        'utf8',
    );
    const emojiStroopControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/emojiStroop/useEmojiStroopController.ts', import.meta.url),
        'utf8',
    );
    const emojiStroopLogicSource = readFileSync(
        new URL('../../src/components/BrainTrainer/emojiStroop/logic.ts', import.meta.url),
        'utf8',
    );
    const emojiStroopSource = emojiStroopControllerSource + '\n' + emojiStroopLogicSource;
    const colorPerceptionControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/colorPerception/useColorPerceptionController.ts', import.meta.url),
        'utf8',
    );
    const colorPerceptionLogicSource = readFileSync(
        new URL('../../src/components/BrainTrainer/colorPerception/logic.ts', import.meta.url),
        'utf8',
    );
    const colorPerceptionSource = colorPerceptionControllerSource + '\n' + colorPerceptionLogicSource;
    const digitSymbolControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/digitSymbol/useDigitSymbolController.ts', import.meta.url),
        'utf8',
    );
    const digitSymbolLogicSource = readFileSync(
        new URL('../../src/components/BrainTrainer/digitSymbol/logic.ts', import.meta.url),
        'utf8',
    );
    const digitSymbolSource = digitSymbolControllerSource + '\n' + digitSymbolLogicSource;
    const visualScanningControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/visualScanning/useVisualScanningController.ts', import.meta.url),
        'utf8',
    );
    const patternIQSource = readFileSync(
        new URL('../../src/components/BrainTrainer/patternIQ/usePatternIQController.ts', import.meta.url),
        'utf8',
    );
    const mathGridControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/mathGrid/useMathGridController.ts', import.meta.url),
        'utf8',
    );
    const targetGridControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/targetGrid/useTargetGridController.ts', import.meta.url),
        'utf8',
    );
    const auditoryMemoryControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/auditoryMemory/useAuditoryMemoryController.ts', import.meta.url),
        'utf8',
    );
    const attentionCodingControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/attentionCoding/useAttentionCodingController.ts', import.meta.url),
        'utf8',
    );
    const crossMatchControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/crossMatch/useCrossMatchController.ts', import.meta.url),
        'utf8',
    );
    const cosmicMemoryControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/cosmicMemory/useCosmicMemoryController.ts', import.meta.url),
        'utf8',
    );
    const numberMemoryControllerSource = readFileSync(
        new URL('../../src/components/BrainTrainer/numberMemory/useNumberMemoryController.ts', import.meta.url),
        'utf8',
    );

    assert.match(noiseFilterControllerSource, /buildNoiseFilterFeedbackMessage/);
    assert.match(noiseFilterControllerSource, /showFeedback\(isCorrect, feedbackMessage\)/);

    assert.match(reactionTimeControllerSource, /buildReactionFeedbackMessage/);
    assert.doesNotMatch(reactionTimeControllerSource, /playSound\("wrong"\)/);
    assert.doesNotMatch(reactionTimeControllerSource, /playSound\("correct"\)/);

    assert.match(stroopSource, /Doğru renk!/);
    assert.match(stroopSource, /Yanlış seçim! Kelimeye değil yazının rengine bak\./);
    assert.match(stroopSource, /const clearRoundResetTimeout = useCallback/);
    assert.doesNotMatch(stroopSource, /playSound\(isCorrect \? "correct" : "incorrect"\)/);

    assert.match(faceExpressionSource, /Doğru duygu:/);
    assert.match(faceExpressionSource, /Yanlış seçim! Bu ifade/);
    assert.match(faceExpressionSource, /const clearAnswerTimeout = useCallback/);
    assert.doesNotMatch(faceExpressionSource, /playSound\(isCorrect \? "correct" : "incorrect"\)/);

    assert.match(directionStroopSource, /const clearRoundTimeout = useCallback/);
    assert.match(directionStroopSource, /Yanlış seçim! Kelimenin anlamına değil/);
    assert.doesNotMatch(directionStroopSource, /playSound\("correct"\)/);
    assert.doesNotMatch(directionStroopSource, /playSound\("incorrect"\)/);

    assert.match(pencilStroopControllerSource, /buildPencilStroopFeedbackMessage/);
    assert.match(pencilStroopControllerSource, /showFeedback\(correct, feedbackMessage\)/);
    assert.doesNotMatch(pencilStroopControllerSource, /playSound\(correct \? "correct" : "incorrect"\)/);

    assert.match(emojiStroopSource, /buildEmojiStroopFeedbackMessage/);
    assert.match(emojiStroopSource, /const clearAnswerTimeout = useCallback/);
    assert.doesNotMatch(emojiStroopSource, /playSound\("correct"\)/);
    assert.doesNotMatch(emojiStroopSource, /playSound\("incorrect"\)/);

    assert.match(colorPerceptionSource, /buildColorPerceptionFeedbackMessage/);
    assert.match(colorPerceptionSource, /const clearRevealTimeout = useCallback/);
    assert.match(colorPerceptionSource, /const clearAnswerTimeout = useCallback/);
    assert.doesNotMatch(colorPerceptionSource, /playSound\(isCorrect \? "correct" : "incorrect"\)/);

    assert.match(digitSymbolSource, /buildDigitSymbolFeedbackMessage/);
    assert.match(digitSymbolSource, /const clearResultTimeout = useCallback/);
    assert.doesNotMatch(digitSymbolSource, /playSound\("correct"\)/);
    assert.doesNotMatch(digitSymbolSource, /playSound\("incorrect"\)/);

    assert.match(visualScanningControllerSource, /buildVisualScanningFeedbackMessage/);
    assert.doesNotMatch(visualScanningControllerSource, /playSound\("correct"\)/);
    assert.doesNotMatch(visualScanningControllerSource, /playSound\("incorrect"\)/);

    assert.match(patternIQSource, /buildPatternIQFeedbackMessage/);
    assert.match(patternIQSource, /const clearAnswerTimeout = useCallback/);
    assert.doesNotMatch(patternIQSource, /playSound\(isCorrect \? "correct" : "incorrect"\)/);

    assert.match(mathGridControllerSource, /buildMathGridFeedbackMessage/);
    assert.doesNotMatch(mathGridControllerSource, /playSound\("correct"\)/);
    assert.doesNotMatch(mathGridControllerSource, /playSound\("incorrect"\)/);

    assert.match(targetGridControllerSource, /buildTargetGridFeedbackMessage/);
    assert.doesNotMatch(targetGridControllerSource, /playSound\("correct"\)/);
    assert.doesNotMatch(targetGridControllerSource, /playSound\("incorrect"\)/);

    assert.match(auditoryMemoryControllerSource, /buildAuditoryMemoryFeedbackMessage/);
    assert.doesNotMatch(auditoryMemoryControllerSource, /playSound\("correct"\)/);
    assert.doesNotMatch(auditoryMemoryControllerSource, /playSound\("incorrect"\)/);

    assert.match(attentionCodingControllerSource, /buildAttentionCodingFeedbackMessage/);
    assert.doesNotMatch(attentionCodingControllerSource, /playSound\("correct"\)/);
    assert.doesNotMatch(attentionCodingControllerSource, /playSound\("incorrect"\)/);

    assert.match(crossMatchControllerSource, /buildCrossMatchFeedbackMessage/);
    assert.doesNotMatch(crossMatchControllerSource, /playSound\("correct"\)/);
    assert.doesNotMatch(crossMatchControllerSource, /playSound\("incorrect"\)/);

    assert.match(cosmicMemoryControllerSource, /buildCosmicMemoryFeedbackMessage/);
    assert.doesNotMatch(cosmicMemoryControllerSource, /playSound\("correct"\)/);
    assert.doesNotMatch(cosmicMemoryControllerSource, /playSound\("incorrect"\)/);

    assert.match(numberMemoryControllerSource, /buildNumberMemoryFeedbackMessage/);
    assert.doesNotMatch(numberMemoryControllerSource, /playSound\("correct"\)/);
    assert.doesNotMatch(numberMemoryControllerSource, /playSound\("incorrect"\)/);
});
