import assert from 'node:assert/strict';
import test from 'node:test';
import { loadQuestionImageBlob } from '../../../../src/features/content/model/questionImageUseCases.ts';

test('loadQuestionImageBlob returns null for blank paths', async () => {
    const blob = await loadQuestionImageBlob('   ', {
        download: async () => {
            throw new Error('Should not be called');
        }
    });

    assert.equal(blob, null);
});

test('loadQuestionImageBlob downloads from the questions bucket', async () => {
    const blob = new Blob(['image-data'], { type: 'image/png' });
    let receivedBucket = '';
    let receivedPath = '';

    const result = await loadQuestionImageBlob('folder/question.png', {
        download: async (bucket, path) => {
            receivedBucket = bucket;
            receivedPath = path;
            return blob;
        }
    });

    assert.equal(receivedBucket, 'questions');
    assert.equal(receivedPath, 'folder/question.png');
    assert.equal(result, blob);
});
