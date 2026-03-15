import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const extractMatches = (source: string, pattern: RegExp): string[] => {
    return [...source.matchAll(pattern)].map((match) => match[1]);
};

test('arcade catalog and route registry stay in sync', () => {
    const routeSource = readFileSync(new URL('../../src/routes/arcadeRoutes.tsx', import.meta.url), 'utf8');
    const catalogSource = readFileSync(new URL('../../src/data/arcade/games.tsx', import.meta.url), 'utf8');

    const routePaths = extractMatches(routeSource, /path="(\/bilsem-zeka\/[^"]+)"/g)
        .filter((path) => path !== '/bilsem-zeka')
        .sort();
    const catalogLinks = extractMatches(catalogSource, /link:\s*"(\/bilsem-zeka\/[^"]+)"/g).sort();
    const catalogIds = extractMatches(catalogSource, /id:\s*'([^']+)'/g);
    const uniqueCatalogLinks = new Set(catalogLinks);
    const uniqueCatalogIds = new Set(catalogIds);

    assert.equal(uniqueCatalogIds.size, catalogIds.length);
    assert.equal(uniqueCatalogLinks.size, catalogLinks.length);
    assert.deepEqual(routePaths, catalogLinks);
});
