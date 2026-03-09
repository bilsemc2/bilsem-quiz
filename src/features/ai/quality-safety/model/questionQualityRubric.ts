import { toQuestionOptions } from '../../question-generation/model/generationPersistenceModel.ts';

export interface QuestionQualityRubricInput {
    stem: string;
    options: readonly string[] | string;
    explanation: string;
    difficultyLevel: number | null | undefined;
    reviewStatus?: string | null;
    reviewReasons?: string[];
}

export interface QuestionQualityRubricResult {
    score: number;
    band: 'excellent' | 'good' | 'needs_review' | 'poor';
    penalties: string[];
}

const trimText = (value: string): string => value.trim();

const hasDuplicateOptions = (options: string[]): boolean => {
    const normalized = options.map((option) => option.toLocaleLowerCase('tr-TR'));
    return new Set(normalized).size !== normalized.length;
};

export const scoreQuestionQuality = (
    input: QuestionQualityRubricInput
): QuestionQualityRubricResult => {
    const penalties: string[] = [];
    let score = 100;
    const stem = trimText(input.stem);
    const explanation = trimText(input.explanation);
    const options = toQuestionOptions(input.options).map(trimText);

    if (stem.length < 18) {
        score -= 20;
        penalties.push('stem_too_short');
    } else if (stem.length < 32) {
        score -= 10;
        penalties.push('stem_minimal');
    } else if (stem.length > 220) {
        score -= 10;
        penalties.push('stem_too_long');
    }

    if (explanation.length < 18) {
        score -= 20;
        penalties.push('explanation_too_short');
    } else if (explanation.length < 32) {
        score -= 10;
        penalties.push('explanation_minimal');
    }

    if (options.length !== 4) {
        score -= 30;
        penalties.push('option_count_invalid');
    }

    if (options.some((option) => option.length === 0)) {
        score -= 15;
        penalties.push('empty_option');
    }

    if (hasDuplicateOptions(options)) {
        score -= 15;
        penalties.push('duplicate_options');
    }

    if (!Number.isFinite(input.difficultyLevel) || Number(input.difficultyLevel) < 1 || Number(input.difficultyLevel) > 5) {
        score -= 10;
        penalties.push('difficulty_invalid');
    }

    if (input.reviewStatus === 'rejected') {
        score -= 20;
        penalties.push('review_rejected');
    }

    const reviewReasons = Array.isArray(input.reviewReasons)
        ? input.reviewReasons.filter((reason) => reason.trim().length > 0)
        : [];
    if (reviewReasons.length > 0) {
        score -= Math.min(25, reviewReasons.length * 5);
        penalties.push('review_reasons_present');
    }

    const boundedScore = Math.max(0, Math.min(100, score));
    const band =
        boundedScore >= 90
            ? 'excellent'
            : boundedScore >= 75
                ? 'good'
                : boundedScore >= 60
                    ? 'needs_review'
                    : 'poor';

    return {
        score: boundedScore,
        band,
        penalties
    };
};
