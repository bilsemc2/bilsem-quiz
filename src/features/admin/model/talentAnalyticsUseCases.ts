import type {
    AdminStatisticsProfileNameRecord,
    AdminStatisticsRecentWorkshopPlayRecord,
    AdminStatisticsWorkshopPlayRecord
} from '@/server/repositories/adminStatisticsRepository';

export interface TalentAnalyticsTopPlayer {
    name: string;
    plays: number;
    avgScore: number;
}

export interface TalentAnalyticsRecentActivity {
    game_id: string;
    user_name: string;
    score: number;
    created_at: string;
}

export interface TalentAnalyticsData {
    totalPlays: number;
    tabletPlays: number;
    bireyselPlays: number;
    intelligenceBreakdown: Record<string, number>;
    topPlayers: TalentAnalyticsTopPlayer[];
    recentActivity: TalentAnalyticsRecentActivity[];
}

interface BuildTalentAnalyticsDataInput {
    workshopPlays: AdminStatisticsWorkshopPlayRecord[];
    recentPlays: AdminStatisticsRecentWorkshopPlayRecord[];
    profiles: AdminStatisticsProfileNameRecord[];
    topPlayersLimit?: number;
    recentActivityLimit?: number;
}

export const createEmptyTalentAnalyticsData = (): TalentAnalyticsData => ({
    totalPlays: 0,
    tabletPlays: 0,
    bireyselPlays: 0,
    intelligenceBreakdown: {},
    topPlayers: [],
    recentActivity: []
});

export const buildIntelligenceBreakdown = (
    plays: AdminStatisticsWorkshopPlayRecord[]
): Record<string, number> => {
    const breakdown: Record<string, number> = {};

    for (const play of plays) {
        if (!play.intelligence_type) {
            continue;
        }

        breakdown[play.intelligence_type] = (breakdown[play.intelligence_type] || 0) + 1;
    }

    return breakdown;
};

export const collectProfileIdsFromRecentPlays = (
    plays: AdminStatisticsRecentWorkshopPlayRecord[]
): string[] => {
    const profileIdSet = new Set<string>();

    for (const play of plays) {
        if (play.user_id) {
            profileIdSet.add(play.user_id);
        }
    }

    return Array.from(profileIdSet);
};

export const toProfileNameMap = (
    profiles: AdminStatisticsProfileNameRecord[]
): Record<string, string> => {
    const nameMap: Record<string, string> = {};

    for (const profile of profiles) {
        nameMap[profile.id] = profile.name?.trim() || 'Bilinmiyor';
    }

    return nameMap;
};

const toSafeScore = (value: number | null): number => {
    return Number(value) || 0;
};

export const buildTopPlayers = (
    recentPlays: AdminStatisticsRecentWorkshopPlayRecord[],
    profileNameMap: Record<string, string>,
    limit = 5
): TalentAnalyticsTopPlayer[] => {
    const playerStats: Record<string, { plays: number; totalScore: number }> = {};

    for (const play of recentPlays) {
        const userId = play.user_id;
        if (!userId) {
            continue;
        }

        if (!playerStats[userId]) {
            playerStats[userId] = { plays: 0, totalScore: 0 };
        }

        playerStats[userId].plays += 1;
        playerStats[userId].totalScore += toSafeScore(play.score_achieved);
    }

    return Object.entries(playerStats)
        .map(([userId, stats]) => ({
            name: profileNameMap[userId] || 'Bilinmiyor',
            plays: stats.plays,
            avgScore: Math.round(stats.totalScore / stats.plays)
        }))
        .sort((a, b) => b.plays - a.plays)
        .slice(0, limit);
};

export const buildRecentActivity = (
    recentPlays: AdminStatisticsRecentWorkshopPlayRecord[],
    profileNameMap: Record<string, string>,
    limit = 10
): TalentAnalyticsRecentActivity[] => {
    return recentPlays.slice(0, limit).map((play) => ({
        game_id: play.game_id || '-',
        user_name: profileNameMap[play.user_id] || 'Bilinmiyor',
        score: toSafeScore(play.score_achieved),
        created_at: play.created_at
    }));
};

export const buildTalentAnalyticsData = (
    input: BuildTalentAnalyticsDataInput
): TalentAnalyticsData => {
    const profileNameMap = toProfileNameMap(input.profiles);

    return {
        totalPlays: input.workshopPlays.length,
        tabletPlays: input.workshopPlays.filter((play) => play.workshop_type === 'tablet').length,
        bireyselPlays: input.workshopPlays.filter((play) => play.workshop_type === 'bireysel').length,
        intelligenceBreakdown: buildIntelligenceBreakdown(input.workshopPlays),
        topPlayers: buildTopPlayers(input.recentPlays, profileNameMap, input.topPlayersLimit ?? 5),
        recentActivity: buildRecentActivity(input.recentPlays, profileNameMap, input.recentActivityLimit ?? 10)
    };
};
