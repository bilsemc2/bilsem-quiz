import assert from 'node:assert/strict';
import test from 'node:test';
import {
    DEFAULT_POST_LOGIN_PATH,
    resolvePostLoginPath
} from '../../../../src/features/auth/model/loginRedirect.ts';

test('resolvePostLoginPath falls back when login state is missing or unsafe', () => {
    assert.equal(resolvePostLoginPath(undefined), DEFAULT_POST_LOGIN_PATH);
    assert.equal(resolvePostLoginPath(null), DEFAULT_POST_LOGIN_PATH);
    assert.equal(resolvePostLoginPath({}), DEFAULT_POST_LOGIN_PATH);
    assert.equal(resolvePostLoginPath({ from: 'https://example.com' }), DEFAULT_POST_LOGIN_PATH);
    assert.equal(resolvePostLoginPath({ from: { pathname: 'profile' } }), DEFAULT_POST_LOGIN_PATH);
});

test('resolvePostLoginPath supports direct string targets from manual login prompts', () => {
    assert.equal(
        resolvePostLoginPath({ from: '/atolyeler/resim' }),
        '/atolyeler/resim'
    );
});

test('resolvePostLoginPath preserves pathname, search and hash for guarded routes', () => {
    assert.equal(
        resolvePostLoginPath({
            from: {
                pathname: '/games/stroop',
                search: '?difficulty=hard',
                hash: '#welcome'
            }
        }),
        '/games/stroop?difficulty=hard#welcome'
    );
});
