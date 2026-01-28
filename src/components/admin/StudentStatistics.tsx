import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import {
    Users, Search, Loader2, X, BarChart3, Trophy,
    Gamepad2, Brain, Clock, TrendingUp, ChevronLeft, ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ZEKA_RENKLERI, ZekaTuru, WORKSHOP_LABELS, WorkshopType } from '../../constants/intelligenceTypes';

interface Student {
    id: string;
    name: string;
    email: string;
    grade: number | null;
    experience: number;
    points: number;
    is_vip: boolean;
    created_at: string;
}

interface GamePlay {
    id: string;
    game_id: string;
    score_achieved: number;
    duration_seconds: number;
    intelligence_type: string | null;
    workshop_type: string | null;
    created_at: string;
}

interface StudentStats {
    totalGames: number;
    avgScore: number;
    totalDuration: number;
    intelligenceBreakdown: Record<string, number>;
    workshopBreakdown: Record<string, number>;
    recentGames: GamePlay[];
}

const StudentStatistics = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [gradeFilter, setGradeFilter] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    // Detail Modal
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        let result = [...students];
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.name?.toLowerCase().includes(term) ||
                s.email.toLowerCase().includes(term)
            );
        }
        if (gradeFilter !== '') {
            result = result.filter(s => String(s.grade) === gradeFilter);
            // Sınıf filtrelemesinde sadece XP'si olanları göster
            result = result.filter(s => (s.experience || 0) > 0);
        }
        setFilteredStudents(result);
        setPage(0);
    }, [students, searchTerm, gradeFilter]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, email, grade, experience, points, is_vip, created_at')
                .order('name', { ascending: true });

            if (error) throw error;
            setStudents(data || []);
        } catch (err) {
            console.error('Öğrenciler yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentStats = useCallback(async (studentId: string) => {
        try {
            setLoadingStats(true);

            const { data: plays, error } = await supabase
                .from('game_plays')
                .select('id, game_id, score_achieved, duration_seconds, intelligence_type, workshop_type, created_at')
                .eq('user_id', studentId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const gamePlays = plays || [];
            const totalGames = gamePlays.length;
            const totalScore = gamePlays.reduce((sum, g) => sum + (g.score_achieved || 0), 0);
            const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
            const totalDuration = gamePlays.reduce((sum, g) => sum + (g.duration_seconds || 0), 0);

            // Zeka türü dağılımı
            const intelligenceBreakdown: Record<string, number> = {};
            gamePlays.forEach(g => {
                if (g.intelligence_type) {
                    intelligenceBreakdown[g.intelligence_type] = (intelligenceBreakdown[g.intelligence_type] || 0) + 1;
                }
            });

            // Workshop dağılımı
            const workshopBreakdown: Record<string, number> = {};
            gamePlays.forEach(g => {
                if (g.workshop_type) {
                    workshopBreakdown[g.workshop_type] = (workshopBreakdown[g.workshop_type] || 0) + 1;
                }
            });

            setStudentStats({
                totalGames,
                avgScore,
                totalDuration,
                intelligenceBreakdown,
                workshopBreakdown,
                recentGames: gamePlays.slice(0, 15),
            });
        } catch (err) {
            console.error('Öğrenci istatistikleri yüklenirken hata:', err);
        } finally {
            setLoadingStats(false);
        }
    }, []);

    const handleOpenDetail = (student: Student) => {
        setSelectedStudent(student);
        setStudentStats(null);
        setDetailOpen(true);
        fetchStudentStats(student.id);
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 60) {
            const hours = Math.floor(mins / 60);
            return `${hours}s ${mins % 60}dk`;
        }
        return `${mins}dk ${secs}sn`;
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const paginatedStudents = filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-indigo-500" />
                Öğrenci İstatistikleri
            </h1>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 bg-white rounded-xl p-4 shadow-sm items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="İsim veya e-posta ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                    />
                </div>
                <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                >
                    <option value="">Tüm Sınıflar</option>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(g => (
                        <option key={g} value={g}>{g === 0 ? 'Anaokulu' : `${g}. Sınıf`}</option>
                    ))}
                </select>
                <div className="text-sm text-slate-500">
                    {filteredStudents.length} öğrenci
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left py-3 px-4 font-bold text-slate-600 uppercase text-xs">Ad Soyad</th>
                                <th className="text-left py-3 px-4 font-bold text-slate-600 uppercase text-xs">E-posta</th>
                                <th className="text-center py-3 px-4 font-bold text-slate-600 uppercase text-xs">Sınıf</th>
                                <th className="text-right py-3 px-4 font-bold text-slate-600 uppercase text-xs">XP</th>
                                <th className="text-right py-3 px-4 font-bold text-slate-600 uppercase text-xs">Puan</th>
                                <th className="text-center py-3 px-4 font-bold text-slate-600 uppercase text-xs">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedStudents.map((student, idx) => (
                                <motion.tr
                                    key={student.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className="hover:bg-slate-50"
                                >
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-800">{student.name || '-'}</span>
                                            {student.is_vip && (
                                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-bold rounded">VIP</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-slate-600">{student.email}</td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                            {student.grade === 0 ? 'Anaokulu' : `${student.grade}. Sınıf`}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded font-bold">{student.experience}</span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded font-bold">{student.points}</span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => handleOpenDetail(student)}
                                            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition"
                                        >
                                            Detay
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span>Sayfa başına:</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
                            className="px-2 py-1 border border-slate-300 rounded text-sm"
                        >
                            {[10, 15, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">
                            {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredStudents.length)} / {filteredStudents.length}
                        </span>
                        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1 rounded hover:bg-slate-200 disabled:opacity-50">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 rounded hover:bg-slate-200 disabled:opacity-50">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                    <Dialog.Content
                        aria-describedby={undefined}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto z-50"
                    >
                        {selectedStudent && (
                            <>
                                {/* Header */}
                                <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-t-2xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-xl font-bold">{selectedStudent.name || 'İsimsiz'}</Dialog.Title>
                                                <p className="text-white/80 text-sm">
                                                    {selectedStudent.grade === 0 ? 'Anaokulu' : `${selectedStudent.grade}. Sınıf`} • {selectedStudent.email}
                                                </p>
                                            </div>
                                        </div>
                                        <Dialog.Close asChild>
                                            <button className="p-2 hover:bg-white/20 rounded-lg transition">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </Dialog.Close>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-3 gap-4 mt-6">
                                        <div className="bg-white/10 rounded-xl p-3 text-center">
                                            <div className="text-2xl font-bold">{selectedStudent.experience}</div>
                                            <div className="text-xs text-white/70">XP</div>
                                        </div>
                                        <div className="bg-white/10 rounded-xl p-3 text-center">
                                            <div className="text-2xl font-bold">{selectedStudent.points}</div>
                                            <div className="text-xs text-white/70">Puan</div>
                                        </div>
                                        <div className="bg-white/10 rounded-xl p-3 text-center">
                                            <div className="text-2xl font-bold">{studentStats?.totalGames || '-'}</div>
                                            <div className="text-xs text-white/70">Toplam Oyun</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-6">
                                    {loadingStats ? (
                                        <div className="flex justify-center py-12">
                                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                        </div>
                                    ) : studentStats ? (
                                        <>
                                            {/* Stats Summary */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-emerald-50 rounded-xl p-4 flex items-center gap-3">
                                                    <Trophy className="w-8 h-8 text-emerald-500" />
                                                    <div>
                                                        <div className="text-2xl font-bold text-emerald-600">{studentStats.avgScore}</div>
                                                        <div className="text-xs text-emerald-600/70">Ortalama Skor</div>
                                                    </div>
                                                </div>
                                                <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                                                    <Clock className="w-8 h-8 text-blue-500" />
                                                    <div>
                                                        <div className="text-2xl font-bold text-blue-600">{formatDuration(studentStats.totalDuration)}</div>
                                                        <div className="text-xs text-blue-600/70">Toplam Süre</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Intelligence Breakdown */}
                                            {Object.keys(studentStats.intelligenceBreakdown).length > 0 && (
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                                                        <Brain className="w-5 h-5 text-indigo-500" />
                                                        Zeka Türü Dağılımı
                                                    </h3>
                                                    <div className="space-y-2">
                                                        {Object.entries(studentStats.intelligenceBreakdown)
                                                            .sort((a, b) => b[1] - a[1])
                                                            .map(([type, count]) => {
                                                                const maxCount = Math.max(...Object.values(studentStats.intelligenceBreakdown));
                                                                const percentage = Math.round((count / studentStats.totalGames) * 100);
                                                                return (
                                                                    <div key={type} className="space-y-1">
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="font-medium text-slate-700">{type}</span>
                                                                            <span className="text-slate-500">{count} oyun ({percentage}%)</span>
                                                                        </div>
                                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                            <motion.div
                                                                                initial={{ width: 0 }}
                                                                                animate={{ width: `${(count / maxCount) * 100}%` }}
                                                                                className="h-full rounded-full"
                                                                                style={{ backgroundColor: ZEKA_RENKLERI[type as ZekaTuru] || '#6366F1' }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Workshop Breakdown */}
                                            {Object.keys(studentStats.workshopBreakdown).length > 0 && (
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                                                        <Gamepad2 className="w-5 h-5 text-indigo-500" />
                                                        Workshop Dağılımı
                                                    </h3>
                                                    <div className="flex flex-wrap gap-3">
                                                        {Object.entries(studentStats.workshopBreakdown).map(([type, count]) => (
                                                            <div key={type} className="px-4 py-2 bg-slate-100 rounded-xl">
                                                                <div className="text-lg font-bold text-slate-700">{count}</div>
                                                                <div className="text-xs text-slate-500">
                                                                    {WORKSHOP_LABELS[type as WorkshopType] || type}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Recent Games */}
                                            {studentStats.recentGames.length > 0 && (
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                                                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                                                        Son Oyunlar
                                                    </h3>
                                                    <div className="bg-slate-50 rounded-xl overflow-hidden">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-slate-100">
                                                                <tr>
                                                                    <th className="text-left py-2 px-3 font-medium text-slate-600">Oyun</th>
                                                                    <th className="text-right py-2 px-3 font-medium text-slate-600">Skor</th>
                                                                    <th className="text-right py-2 px-3 font-medium text-slate-600">Süre</th>
                                                                    <th className="text-right py-2 px-3 font-medium text-slate-600">Tarih</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-200">
                                                                {studentStats.recentGames.map((game, idx) => (
                                                                    <tr key={game.id || idx} className="hover:bg-white">
                                                                        <td className="py-2 px-3 font-medium text-slate-700">{game.game_id}</td>
                                                                        <td className="py-2 px-3 text-right">
                                                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded font-bold text-xs">
                                                                                {game.score_achieved}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-2 px-3 text-right text-slate-500">{formatDuration(game.duration_seconds)}</td>
                                                                        <td className="py-2 px-3 text-right text-slate-400 text-xs">{formatDate(game.created_at)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {studentStats.totalGames === 0 && (
                                                <div className="text-center py-12 text-slate-400">
                                                    <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                    <p>Bu öğrenci henüz oyun oynamamış.</p>
                                                </div>
                                            )}
                                        </>
                                    ) : null}
                                </div>
                            </>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
};

export default StudentStatistics;
