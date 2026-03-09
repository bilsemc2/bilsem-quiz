import type { AdaptiveQuestion, DifficultyLevel } from '../../model/types';
import { buildQuestionFingerprint } from '../../question-generation/model/generationPersistenceModel.ts';
import { isQuestionSafe, sanitizeQuestion } from './questionSafety.ts';

export type QuestionCandidateStatus = 'candidate' | 'active' | 'rejected';

export interface ReviewAdaptiveQuestionCandidateInput {
    question: AdaptiveQuestion | null;
    previousQuestionFingerprints?: string[];
    expectedDifficultyLevel?: DifficultyLevel;
}

export interface ReviewedAdaptiveQuestionCandidate {
    status: QuestionCandidateStatus;
    question: AdaptiveQuestion | null;
    fingerprint: string | null;
    reasons: string[];
}

const toRejectedCandidate = (
    reasons: string[],
    fingerprint: string | null = null
): ReviewedAdaptiveQuestionCandidate => ({
    status: 'rejected',
    question: null,
    fingerprint,
    reasons
});

export const reviewAdaptiveQuestionCandidate = (
    input: ReviewAdaptiveQuestionCandidateInput
): ReviewedAdaptiveQuestionCandidate => {
    if (!input.question) {
        return toRejectedCandidate(['provider_returned_null']);
    }

    const sanitizedQuestion = sanitizeQuestion(input.question);
    const fingerprint = buildQuestionFingerprint({
        stem: sanitizedQuestion.stem,
        options: sanitizedQuestion.options
    });
    const reasons: string[] = [];

    if (sanitizedQuestion.source !== 'ai') {
        reasons.push('source_must_be_ai');
    }

    if (!isQuestionSafe(sanitizedQuestion)) {
        reasons.push('failed_safety_checks');
    }

    if (
        typeof input.expectedDifficultyLevel === 'number' &&
        sanitizedQuestion.difficultyLevel !== input.expectedDifficultyLevel
    ) {
        reasons.push('unexpected_difficulty_level');
    }

    if (!fingerprint) {
        reasons.push('missing_fingerprint');
    }

    if (
        fingerprint &&
        (input.previousQuestionFingerprints ?? []).includes(fingerprint)
    ) {
        reasons.push('duplicate_fingerprint');
    }

    if (reasons.length > 0) {
        return toRejectedCandidate(reasons, fingerprint || null);
    }

    return {
        status: 'active',
        question: sanitizedQuestion,
        fingerprint,
        reasons: []
    };
};
