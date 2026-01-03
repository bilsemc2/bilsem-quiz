import { motion } from 'framer-motion';
import { Settings, UserPlus } from 'lucide-react';

interface ClassroomHeaderProps {
    classData: { name: string; grade: number };
    classId?: string;
    onInviteClick: () => void;
    onSettingsClick: () => void;
}

const ClassroomHeader = ({
    classData,
    classId,
    onInviteClick,
    onSettingsClick,
}: ClassroomHeaderProps) => {
    const displayCode = classId?.split('-')[0].toUpperCase() || '';

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                    >
                        {classData.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2">
                            {classData.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium">
                                {classData.grade}. Sınıf
                            </span>
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                                Kod: {displayCode}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onInviteClick}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors shadow-sm"
                    >
                        <UserPlus className="w-4 h-4" />
                        Öğrenci Davet Et
                    </button>
                    <button
                        onClick={onSettingsClick}
                        className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        Sınıf Ayarları
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ClassroomHeader;
