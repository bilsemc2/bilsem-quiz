import type {
    GamePlayCreateInput,
    GamePlayRecord,
    GamePlayRepository
} from '../../../server/repositories/gamePlayRepository';
import type { AppError, Result } from '../../../shared/types/result';

export interface RecentGameSummary {
    game_id: string;
    score: number;
    created_at: string;
    game_name: string;
}

export interface GameProgressSummary {
    game_id: string;
    game_name: string;
    playCount: number;
    firstScore: number;
    lastScore: number;
    bestScore: number;
    improvement: number;
}

export interface GameStatsSummary {
    totalPlays: number;
    totalScore: number;
    averageScore: number;
    totalDuration: number;
    intelligenceBreakdown: Record<string, number>;
    recentGames: RecentGameSummary[];
    thisWeek: { plays: number; score: number; avgScore: number };
    lastWeek: { plays: number; score: number; avgScore: number };
    gameProgress: GameProgressSummary[];
}

export const emptyGameStatsSummary: GameStatsSummary = {
    totalPlays: 0,
    totalScore: 0,
    averageScore: 0,
    totalDuration: 0,
    intelligenceBreakdown: {},
    recentGames: [],
    thisWeek: { plays: 0, score: 0, avgScore: 0 },
    lastWeek: { plays: 0, score: 0, avgScore: 0 },
    gameProgress: [],
};

const getGameName = (play: Pick<GamePlayRecord, 'game_id' | 'metadata'>): string => {
    if (!play.metadata || typeof play.metadata !== 'object') {
        return play.game_id;
    }

    const gameName = play.metadata.game_name;
    return typeof gameName === 'string' && gameName.trim().length > 0
        ? gameName
        : play.game_id;
};

const toTimestamp = (dateValue: string): number => {
    const timestamp = new Date(dateValue).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
};

export const persistGamePlay = async (
    input: GamePlayCreateInput,
    deps?: Pick<GamePlayRepository, 'createGamePlay'>
): Promise<Result<void, AppError>> => {
    const repository = deps ?? (await import('../../../server/repositories/gamePlayRepository')).gamePlayRepository;
    return repository.createGamePlay(input);
};

export const loadUserGamePlays = async (
    userId: string,
    deps?: Pick<GamePlayRepository, 'listGamePlaysByUserId'>
): Promise<GamePlayRecord[]> => {
    const repository = deps ?? (await import('../../../server/repositories/gamePlayRepository')).gamePlayRepository;
    return repository.listGamePlaysByUserId(userId);
};

export const buildGameStatsSummary = (
    plays: GamePlayRecord[],
    now: Date = new Date()
): GameStatsSummary => {
    if (plays.length === 0) {
        return emptyGameStatsSummary;
    }

    const sortedByNewest = [...plays].sort((left, right) => (
        toTimestamp(right.created_at) - toTimestamp(left.created_at)
    ));

    const totalScore = sortedByNewest.reduce((sum, play) => (
        sum + (play.score_achieved || 0)
    ), 0);
    const totalDuration = sortedByNewest.reduce((sum, play) => (
        sum + (play.duration_seconds || 0)
    ), 0);

    const intelligenceBreakdown: Record<string, number> = {};
    for (const play of sortedByNewest) {
        if (play.intelligence_type) {
            intelligenceBreakdown[play.intelligence_type] = (
                intelligenceBreakdown[play.intelligence_type] || 0
            ) + 1;
        }
    }

    const recentGames = sortedByNewest.slice(0, 5).map((play) => ({
        game_id: play.game_id,
        score: play.score_achieved || 0,
        created_at: play.created_at,
        game_name: getGameName(play)
    }));

    const oneWeekAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = now.getTime() - (14 * 24 * 60 * 60 * 1000);

    const thisWeekPlays = sortedByNewest.filter((play) => (
        toTimestamp(play.created_at) >= oneWeekAgo
    ));
    const lastWeekPlays = sortedByNewest.filter((play) => {
        const timestamp = toTimestamp(play.created_at);
        return timestamp >= twoWeeksAgo && timestamp < oneWeekAgo;
    });

    const getPeriodSummary = (periodPlays: GamePlayRecord[]) => {
        const score = periodPlays.reduce((sum, play) => sum + (play.score_achieved || 0), 0);
        return {
            plays: periodPlays.length,
            score,
            avgScore: periodPlays.length > 0 ? Math.round(score / periodPlays.length) : 0
        };
    };

    const groupedScores = new Map<string, { name: string; scores: Array<{ score: number; createdAt: string }> }>();
    for (const play of sortedByNewest) {
        const current = groupedScores.get(play.game_id) ?? {
            name: getGameName(play),
            scores: []
        };

        current.scores.push({
            score: play.score_achieved || 0,
            createdAt: play.created_at
        });
        groupedScores.set(play.game_id, current);
    }

    const gameProgress = [...groupedScores.entries()]
        .filter(([, value]) => value.scores.length >= 2)
        .map(([gameId, value]) => {
            const sortedScores = [...value.scores].sort((left, right) => (
                toTimestamp(left.createdAt) - toTimestamp(right.createdAt)
            ));

            const firstScore = sortedScores[0].score;
            const lastScore = sortedScores[sortedScores.length - 1].score;
            const bestScore = Math.max(...sortedScores.map((item) => item.score));
            const improvement = firstScore > 0
                ? Math.round(((lastScore - firstScore) / firstScore) * 100)
                : lastScore > 0 ? 100 : 0;

            return {
                game_id: gameId,
                game_name: value.name,
                playCount: sortedScores.length,
                firstScore,
                lastScore,
                bestScore,
                improvement
            };
        })
        .sort((left, right) => right.playCount - left.playCount)
        .slice(0, 5);

    return {
        totalPlays: sortedByNewest.length,
        totalScore,
        averageScore: Math.round(totalScore / sortedByNewest.length),
        totalDuration,
        intelligenceBreakdown,
        recentGames,
        thisWeek: getPeriodSummary(thisWeekPlays),
        lastWeek: getPeriodSummary(lastWeekPlays),
        gameProgress
    };
};
