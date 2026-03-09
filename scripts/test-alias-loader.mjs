import { access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const sourceRoot = path.resolve(process.cwd(), 'src');
const supabaseStubUrl = pathToFileURL(
    path.resolve(process.cwd(), 'scripts', 'test-supabase-stub.mjs')
).href;
const candidateSuffixes = [
    '',
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mjs',
    path.join('index.ts'),
    path.join('index.tsx'),
    path.join('index.js'),
    path.join('index.mjs')
];

const resolveAliasUrl = async (specifier) => {
    const relativeTarget = specifier.slice(2);
    const basePath = path.resolve(sourceRoot, relativeTarget);

    for (const suffix of candidateSuffixes) {
        const candidatePath = suffix ? `${basePath}${suffix.startsWith('.') ? suffix : path.sep + suffix}` : basePath;

        try {
            await access(candidatePath);
            return pathToFileURL(candidatePath).href;
        } catch {
            continue;
        }
    }

    return null;
};

export const resolve = async (specifier, context, defaultResolve) => {
    if (specifier === '@/lib/supabase' || specifier.endsWith('/src/lib/supabase.ts')) {
        return defaultResolve(supabaseStubUrl, context, defaultResolve);
    }

    if (specifier.startsWith('@/')) {
        const resolvedUrl = await resolveAliasUrl(specifier);
        if (resolvedUrl) {
            return defaultResolve(resolvedUrl, context, defaultResolve);
        }
    }

    return defaultResolve(specifier, context, defaultResolve);
};
