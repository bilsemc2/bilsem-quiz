import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('memory game start flow uses shared viewport focus instead of top reset scrolls', () => {
    const source = readFileSync(
        new URL('../../src/components/MemoryGame/MemoryGame.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /useGameViewportFocus/);
    assert.match(source, /const \{ playAreaRef, focusPlayArea \} = useGameViewportFocus\(\);/);
    assert.match(source, /setGameStarted\(true\);\s*focusPlayArea\(\);/);
    assert.match(source, /ref=\{playAreaRef\}/);
    assert.doesNotMatch(source, /window\.scrollTo\(0, 0\)/);
});

test('deyimler page scrolls to its content anchor for mode and pagination changes', () => {
    const source = readFileSync(
        new URL('../../src/pages/DeyimlerPage.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /useViewportAnchor/);
    assert.match(source, /const \{ anchorRef: pageTopRef, scrollToAnchor: scrollToPageTop \} = useViewportAnchor\(\);/);
    assert.match(source, /ref=\{pageTopRef\}/);
    assert.match(source, /scrollToPageTop\(\);/);
    assert.doesNotMatch(source, /window\.scrollTo\(0, 0\)/);
});

test('resim page reuses the shared viewport anchor helper across workshop access states', () => {
    const source = readFileSync(
        new URL('../../src/pages/workshops/ResimPage.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /useViewportAnchor/);
    assert.match(source, /const \{ anchorRef: pageTopRef, scrollToAnchor: scrollToPageTop \} = useViewportAnchor\(\);/);
    assert.match(source, /ref=\{pageTopRef\}/);
    assert.match(source, /scrollToPageTop\(\);/);
    assert.doesNotMatch(source, /window\.scrollTo\(0, 0\)/);
});

test('viewport anchor helper centralizes smooth scroll-to-ref behavior', () => {
    const source = readFileSync(
        new URL('../../src/hooks/useViewportAnchor.ts', import.meta.url),
        'utf8',
    );

    assert.match(source, /export const useViewportAnchor/);
    assert.match(source, /export const scrollElementIntoView/);
    assert.match(source, /deferFrames\?: number/);
    assert.match(source, /element\.scrollIntoView\(\{ behavior, block \}\)/);
    assert.match(source, /scrollElementIntoView\(anchorRef\.current, \{ behavior, block, deferFrames \}\)/);
});

test('stories list scrolls unanswered questions through the shared viewport helper', () => {
    const source = readFileSync(
        new URL('../../src/pages/Story/components/StoriesList.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /scrollElementIntoView/);
    assert.match(source, /const questionRefs = useRef<Record<string, HTMLDivElement \| null>>\(\{\}\);/);
    assert.match(source, /const focusFirstUnansweredQuestion = useCallback/);
    assert.match(source, /questionRefs\.current\[questionId\] = element;/);
    assert.match(source, /scrollElementIntoView\(\s*firstUnansweredQuestionId \? questionRefs\.current\[firstUnansweredQuestionId\] : null,/);
    assert.doesNotMatch(source, /document\.querySelectorAll/);
});

test('breakout board start flow uses the shared viewport anchor hook', () => {
    const source = readFileSync(
        new URL('../../src/components/Arcade/Games/chromabreak/components/BreakoutGame.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /useViewportAnchor/);
    assert.match(source, /const \{ anchorRef: boardRef, scrollToAnchor: scrollToBoard \} = useViewportAnchor<HTMLDivElement>\(/);
    assert.match(source, /defaultBlock: 'center'/);
    assert.match(source, /scrollToBoard\(\);/);
    assert.doesNotMatch(source, /boardRef\.current\?\.scrollIntoView/);
});

test('create pdf page uses ref-based capture and declarative watermarks', () => {
    const source = readFileSync(
        new URL('../../src/pages/CreatePdfPage.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /const \[showWatermark, setShowWatermark\] = useState\(false\);/);
    assert.match(source, /const pageRefs = useRef<Array<HTMLDivElement \| null>>\(\[\]\);/);
    assert.match(source, /const setPageRef = useCallback/);
    assert.match(source, /const getRegisteredPages = useCallback/);
    assert.match(source, /await waitForPaint\(\);/);
    assert.match(source, /ref=\{\(element\) => setPageRef\(pageIndex, element\)\}/);
    assert.match(source, /ref=\{\(element\) => setPageRef\(totalQuestionPages, element\)\}/);
    assert.match(source, /showWatermark && \(/);
    assert.doesNotMatch(source, /document\.querySelectorAll/);
    assert.doesNotMatch(source, /document\.createElement/);
    assert.doesNotMatch(source, /appendChild/);
    assert.doesNotMatch(source, /getElementsByClassName/);
});
