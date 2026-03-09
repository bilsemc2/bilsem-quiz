import { register } from 'node:module';

register(new URL('./test-alias-loader.mjs', import.meta.url));
