import { Eye, Play, RotateCcw } from 'lucide-react';
import { Assignment } from './types';

interface AssignmentSectionProps {
    assignments: Assignment[];
    onStart: (id: string) => void;
    onViewResults: (assignment: Assignment) => void;
}

const AssignmentSection = ({
    assignments,
    onStart,
    onViewResults,
}: AssignmentSectionProps) => {
    const pending = assignments.filter(a => a.status === 'pending');
    const completed = assignments.filter(a => a.status === 'completed');

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Ödevler</h2>

            {/* Yeni Ödevler */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-lg font-bold text-indigo-600">Yeni Ödevler</h3>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold">
                        {pending.length}
                    </span>
                </div>

                {pending.length > 0 ? (
                    <div className="space-y-4">
                        {pending.map((assignment) => (
                            <div
                                key={assignment.id}
                                className="border border-slate-100 rounded-xl p-5 hover:bg-slate-50/50 transition-colors"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800">{assignment.title}</h4>
                                        <p className="text-slate-500 mt-1 text-sm">
                                            {assignment.description || 'Bu ödev için açıklama bulunmuyor.'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onStart(assignment.id)}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors shadow-sm"
                                    >
                                        <Play className="w-4 h-4" />
                                        Başla
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-slate-400 font-medium">Yeni ödev bulunmuyor.</p>
                    </div>
                )}
            </div>

            {/* Tamamlanan Ödevler */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-lg font-bold text-emerald-600">Tamamlanan Ödevler</h3>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-bold">
                        {completed.length}
                    </span>
                </div>

                {completed.length > 0 ? (
                    <div className="space-y-4">
                        {completed.map((assignment) => (
                            <div
                                key={assignment.id}
                                className="border border-slate-100 rounded-xl p-5 hover:bg-slate-50/50 transition-colors"
                            >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-bold text-slate-800">{assignment.title}</h4>
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
                                                Tamamlandı
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-sm">{assignment.description}</p>
                                        <div className="flex items-center gap-4 mt-3">
                                            <span className="text-sm font-bold text-emerald-600 px-3 py-1 bg-emerald-50 rounded-lg">
                                                Skor: {assignment.score}/{assignment.total_questions}
                                            </span>
                                            {assignment.duration_minutes && (
                                                <span className="text-sm font-bold text-indigo-600 px-3 py-1 bg-indigo-50 rounded-lg">
                                                    {assignment.duration_minutes} dk
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onViewResults(assignment)}
                                            className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl font-medium transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Sonuçları Gör
                                        </button>
                                        <button
                                            onClick={() => onStart(assignment.id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            Tekrar Çöz
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-slate-400 font-medium">Henüz tamamlanan ödev yok.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignmentSection;
