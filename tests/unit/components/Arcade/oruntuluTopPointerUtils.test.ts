import assert from 'node:assert/strict';
import test from 'node:test';

import { toCanvasPoint } from '../../../../src/components/Arcade/Games/OruntuluTop/pointerUtils.ts';

test('toCanvasPoint converts viewport coordinates into local canvas coordinates', () => {
    assert.deepEqual(
        toCanvasPoint(360, 520, { left: 240, top: 380 }),
        { x: 120, y: 140 },
    );
});
