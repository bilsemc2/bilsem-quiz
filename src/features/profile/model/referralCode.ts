const DEFAULT_REFERRAL_CODE_LENGTH = 6;

const normalizeFragment = (value: number): string => {
    return value
        .toString(36)
        .replace(/^0\./, '')
        .replace(/[^a-z0-9]/gi, '');
};

export const generateReferralCode = (
    randomFn: () => number = Math.random,
    length: number = DEFAULT_REFERRAL_CODE_LENGTH
): string => {
    let code = '';

    while (code.length < length) {
        const fragment = normalizeFragment(randomFn());
        code += fragment || 'x';
    }

    return code.slice(0, length).toUpperCase();
};
