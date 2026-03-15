import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('blog page injects article schema via Helmet instead of manual head mutation', () => {
    const source = readFileSync(
        new URL('../../src/pages/BlogPage.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /Helmet/);
    assert.match(source, /type="application\/ld\+json"/);
    assert.match(source, /JSON\.stringify\(structuredData\)/);
    assert.doesNotMatch(source, /document\.createElement\('script'\)/);
    assert.doesNotMatch(source, /document\.head\.appendChild/);
});

test('on-demand pdf button reuses a hidden anchor ref for downloads', () => {
    const source = readFileSync(
        new URL('../../src/pages/Story/components/OnDemandPdfDownloadButton.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /const linkRef = useRef<HTMLAnchorElement \| null>\(null\);/);
    assert.match(source, /linkRef\.current\.click\(\);/);
    assert.match(source, /<a ref=\{linkRef\} className="hidden" aria-hidden="true" tabIndex=\{-1\}>/);
    assert.doesNotMatch(source, /document\.createElement\('a'\)/);
    assert.doesNotMatch(source, /document\.body\.appendChild/);
});

test('gunun sorusu uses declarative style and watermark markup for image protection', () => {
    const source = readFileSync(
        new URL('../../src/components/GununSorusu.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /<style>\{getImageProtectionStyles\(\)\}<\/style>/);
    assert.match(source, /Array\.from\(\{ length: 9 \}, \(_, index\) => \(/);
    assert.match(source, /BILSEMC2/);
    assert.doesNotMatch(source, /document\.createElement/);
    assert.doesNotMatch(source, /appendChild/);
    assert.doesNotMatch(source, /document\.head\.appendChild/);
});

test('ai question pool settings export reuses a hidden anchor ref', () => {
    const source = readFileSync(
        new URL('../../src/components/admin/AIQuestionPoolSettingsManagement.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /const downloadLinkRef = useRef<HTMLAnchorElement \| null>\(null\);/);
    assert.match(source, /downloadLinkRef\.current\.click\(\);/);
    assert.match(source, /<a ref=\{downloadLinkRef\} className="hidden" aria-hidden="true" tabIndex=\{-1\}>/);
    assert.doesNotMatch(source, /document\.createElement\('a'\)/);
    assert.doesNotMatch(source, /document\.body\.appendChild/);
});

test('blog rich text editor opens image upload through a hidden file input ref', () => {
    const source = readFileSync(
        new URL('../../src/components/admin/BlogRichTextEditor.tsx', import.meta.url),
        'utf8',
    );

    assert.match(source, /const fileInputRef = useRef<HTMLInputElement \| null>\(null\);/);
    assert.match(source, /const handleImagePickerOpen = useCallback/);
    assert.match(source, /fileInputRef\.current\?\.click\(\);/);
    assert.match(source, /onAddImage=\{handleImagePickerOpen\}/);
    assert.match(source, /ref=\{fileInputRef\}/);
    assert.doesNotMatch(source, /document\.createElement\('input'\)/);
});

test('canvas-heavy renderers delegate canvas allocation to the shared helper', () => {
    const helperSource = readFileSync(
        new URL('../../src/utils/createCanvasElement.ts', import.meta.url),
        'utf8',
    );

    assert.match(helperSource, /document\.createElement\("canvas"\)/);

    const canvasFiles = [
        '../../src/components/BrainTrainer/mazeRunner/MazeRunnerBoard.tsx',
        '../../src/components/Arcade/Games/DarkMaze/canvasRendering.ts',
        '../../src/components/BrainTrainer/laserMazeEngine.ts',
        '../../src/components/BrainTrainer/puzzleMaster/imageGenerator.ts',
        '../../src/components/ClothReceipt3D/receiptTexture.ts',
    ];

    for (const filePath of canvasFiles) {
        const source = readFileSync(new URL(filePath, import.meta.url), 'utf8');

        assert.match(source, /createCanvasElement/);
        assert.doesNotMatch(source, /document\.createElement\((["'])canvas\1\)/);
    }
});

test('laser maze renderer delegates DOM mounting to the shared container helper', () => {
    const helperSource = readFileSync(
        new URL('../../src/utils/mountElementInContainer.ts', import.meta.url),
        'utf8',
    );
    const source = readFileSync(
        new URL('../../src/components/BrainTrainer/laserMazeEngine.ts', import.meta.url),
        'utf8',
    );

    assert.match(helperSource, /container\.appendChild\(element\)/);
    assert.match(helperSource, /container\.removeChild\(element\)/);
    assert.match(source, /attachElementToContainer\(container, renderer\.domElement\)/);
    assert.match(source, /detachElementFromContainer\(container, renderer\.domElement\)/);
    assert.doesNotMatch(source, /appendChild\(/);
    assert.doesNotMatch(source, /removeChild\(/);
});
