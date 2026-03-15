import {
    musicReportRepository,
    type MusicOverallReportRecord,
    type MusicReportRepository
} from '@/server/repositories/musicReportRepository';

export type MusicReportSummary = MusicOverallReportRecord;

export interface MusicReportCardData {
    report: MusicReportSummary | null;
    completedCount: number;
}

export const loadMusicReportCardData = async (
    userId: string,
    deps: Pick<
        MusicReportRepository,
        'getLatestOverallReportByUserId' | 'countCompletedTestsByUserId'
    > = musicReportRepository
): Promise<MusicReportCardData> => {
    const [report, completedCount] = await Promise.all([
        deps.getLatestOverallReportByUserId(userId),
        deps.countCompletedTestsByUserId(userId)
    ]);

    return {
        report,
        completedCount
    };
};
