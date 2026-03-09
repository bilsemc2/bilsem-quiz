import type { AdaptiveQuestion } from '../../model/types.ts';
import { reviewAdaptiveQuestionCandidate } from '../../quality-safety/model/questionCandidateReview.ts';
import { buildQuestionFingerprint } from './generationPersistenceModel.ts';
import { scoreQuestionQuality } from '../../quality-safety/model/questionQualityRubric.ts';

export interface QuestionPublicationDecision {
    question: AdaptiveQuestion;
    fingerprint: string | null;
    reviewStatus: 'active' | 'rejected';
    reviewNotes: Record<string, unknown>;
    publishToPool: boolean;
}

export interface CreateQuestionPublicationDecisionsInput {
    questions: AdaptiveQuestion[];
    existingFingerprints?: string[];
    reviewedAtISO?: string;
}

const createRejectedDecision = (
    question: AdaptiveQuestion,
    fingerprint: string | null,
    reviewedAtISO: string,
    reasons: string[]
): QuestionPublicationDecision => ({
    question,
    fingerprint,
    reviewStatus: 'rejected',
    reviewNotes: (() => {
        const quality = scoreQuestionQuality({
            stem: question.stem,
            options: question.options,
            explanation: question.explanation,
            difficultyLevel: question.difficultyLevel,
            reviewStatus: 'rejected',
            reviewReasons: reasons
        });

        return {
        qualityGate: 'runtime_review',
        reviewedAtISO,
        reasons,
        qualityRubricScore: quality.score,
        qualityRubricBand: quality.band,
        qualityRubricPenalties: quality.penalties
    };
    })(),
    publishToPool: false
});

export const createQuestionPublicationDecisions = (
    input: CreateQuestionPublicationDecisionsInput
): QuestionPublicationDecision[] => {
    const reviewedAtISO = input.reviewedAtISO ?? new Date().toISOString();
    const seenFingerprints = new Set(
        (input.existingFingerprints ?? []).filter((fingerprint) => fingerprint.length > 0)
    );

    return input.questions.map((question) => {
        const fingerprint = buildQuestionFingerprint({
            stem: question.stem,
            options: question.options
        });

        if (!fingerprint) {
            return createRejectedDecision(question, null, reviewedAtISO, ['missing_fingerprint']);
        }

        if (seenFingerprints.has(fingerprint)) {
            return createRejectedDecision(question, fingerprint, reviewedAtISO, ['duplicate_fingerprint']);
        }

        if (question.source === 'fallback') {
            seenFingerprints.add(fingerprint);
            const quality = scoreQuestionQuality({
                stem: question.stem,
                options: question.options,
                explanation: question.explanation,
                difficultyLevel: question.difficultyLevel,
                reviewStatus: 'active',
                reviewReasons: []
            });

            return {
                question,
                fingerprint,
                reviewStatus: 'active',
                reviewNotes: {
                    qualityGate: 'fallback_bypass',
                    reviewedAtISO,
                    reasons: [],
                    qualityRubricScore: quality.score,
                    qualityRubricBand: quality.band,
                    qualityRubricPenalties: quality.penalties
                },
                publishToPool: true
            };
        }

        const review = reviewAdaptiveQuestionCandidate({
            question,
            previousQuestionFingerprints: Array.from(seenFingerprints),
            expectedDifficultyLevel: question.difficultyLevel
        });

        if (review.status === 'active' && review.question && review.fingerprint) {
            seenFingerprints.add(review.fingerprint);
            const quality = scoreQuestionQuality({
                stem: review.question.stem,
                options: review.question.options,
                explanation: review.question.explanation,
                difficultyLevel: review.question.difficultyLevel,
                reviewStatus: 'active',
                reviewReasons: []
            });

            return {
                question: review.question,
                fingerprint: review.fingerprint,
                reviewStatus: 'active',
                reviewNotes: {
                    qualityGate: 'runtime_review',
                    reviewedAtISO,
                    reasons: [],
                    qualityRubricScore: quality.score,
                    qualityRubricBand: quality.band,
                    qualityRubricPenalties: quality.penalties
                },
                publishToPool: true
            };
        }

        return createRejectedDecision(
            question,
            review.fingerprint ?? fingerprint,
            reviewedAtISO,
            review.reasons
        );
    });
};
