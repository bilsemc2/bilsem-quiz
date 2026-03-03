import type {
    AdminStatisticsGamePlayRecord,
    AdminStatisticsStudentRecord
} from '@/server/repositories/adminStatisticsRepository';

export interface StudentListItem {
    id: string;
    name: string;
    email: string;
    grade: number | null;
    experience: number;
    points: number;
    is_vip: boolean;
    created_at: string;
}

export interface StudentGamePlayItem {
    id: string;
    game_id: string;
    score_achieved: number;
    duration_seconds: number;
    intelligence_type: string | null;
    workshop_type: string | null;
    created_at: string;
}

export interface StudentStatsSummary {
    totalGames: number;
    avgScore: number;
    totalDuration: number;
    intelligenceBreakdown: Record<string, number>;
    workshopBreakdown: Record<string, number>;
    recentGames: StudentGamePlayItem[];
}

export const toStudentListItems = (
    students: AdminStatisticsStudentRecord[]
): StudentListItem[] => {
    return students.map((student) => ({
        id: student.id,
        name: student.name?.trim() || 'İsimsiz Kullanıcı',
        email: student.email?.trim() || '-',
        grade: student.grade,
        experience: Number(student.experience) || 0,
        points: Number(student.points) || 0,
        is_vip: Boolean(student.is_vip),
        created_at: student.created_at
    }));
};

export const toStudentGamePlayItems = (
    gamePlays: AdminStatisticsGamePlayRecord[]
): StudentGamePlayItem[] => {
    return gamePlays.map((gamePlay) => ({
        id: gamePlay.id,
        game_id: gamePlay.game_id,
        score_achieved: Number(gamePlay.score_achieved) || 0,
        duration_seconds: Number(gamePlay.duration_seconds) || 0,
        intelligence_type: gamePlay.intelligence_type,
        workshop_type: gamePlay.workshop_type,
        created_at: gamePlay.created_at
    }));
};

export const filterStudentsForStatistics = (
    students: StudentListItem[],
    searchTerm: string,
    gradeFilter: string
): StudentListItem[] => {
    let result = [...students];

    if (searchTerm.trim()) {
        const term = searchTerm.trim().toLocaleLowerCase('tr-TR');
        result = result.filter((student) =>
            student.name.toLocaleLowerCase('tr-TR').includes(term) ||
            student.email.toLocaleLowerCase('tr-TR').includes(term)
        );
    }

    if (gradeFilter.trim() !== '') {
        result = result.filter((student) => String(student.grade) === gradeFilter);
        result = result.filter((student) => student.experience > 0);
    }

    return result;
};

export const buildStudentStatsSummary = (
    gamePlays: StudentGamePlayItem[]
): StudentStatsSummary => {
    const totalGames = gamePlays.length;
    const totalScore = gamePlays.reduce((sum, gamePlay) => sum + gamePlay.score_achieved, 0);
    const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
    const totalDuration = gamePlays.reduce((sum, gamePlay) => sum + gamePlay.duration_seconds, 0);

    const intelligenceBreakdown: Record<string, number> = {};
    const workshopBreakdown: Record<string, number> = {};

    for (const gamePlay of gamePlays) {
        if (gamePlay.intelligence_type) {
            intelligenceBreakdown[gamePlay.intelligence_type] = (intelligenceBreakdown[gamePlay.intelligence_type] || 0) + 1;
        }

        if (gamePlay.workshop_type) {
            workshopBreakdown[gamePlay.workshop_type] = (workshopBreakdown[gamePlay.workshop_type] || 0) + 1;
        }
    }

    return {
        totalGames,
        avgScore,
        totalDuration,
        intelligenceBreakdown,
        workshopBreakdown,
        recentGames: gamePlays.slice(0, 15)
    };
};
