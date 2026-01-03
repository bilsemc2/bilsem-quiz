import { Plus, Calendar, Clock } from 'lucide-react';
import { Announcement } from './types';

interface AnnouncementSectionProps {
    announcements: Announcement[];
    userRole?: string;
    onNewAnnouncement: () => void;
}

const AnnouncementSection = ({
    announcements,
    userRole,
    onNewAnnouncement,
}: AnnouncementSectionProps) => {
    const priorityStyles = {
        high: 'border-red-200 bg-red-50/50',
        normal: 'border-blue-200 bg-blue-50/50',
        low: 'border-slate-200 bg-slate-50/50',
    };

    const priorityLabels = {
        high: { text: 'Önemli', color: 'bg-red-100 text-red-600' },
        normal: { text: 'Normal', color: 'bg-blue-100 text-blue-600' },
        low: { text: 'Bilgi', color: 'bg-slate-100 text-slate-600' },
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Duyurular</h2>
                {userRole === 'teacher' && (
                    <button
                        onClick={onNewAnnouncement}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Duyuru
                    </button>
                )}
            </div>

            {announcements.length > 0 ? (
                <div className="space-y-4">
                    {announcements.map((announcement) => (
                        <div
                            key={announcement.id}
                            className={`p-5 rounded-xl border-2 ${priorityStyles[announcement.priority as keyof typeof priorityStyles] || priorityStyles.low} transition-shadow hover:shadow-md`}
                        >
                            <div className="flex items-start gap-3 mb-2">
                                <h3 className="text-lg font-bold text-slate-800 flex-1">
                                    {announcement.title}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityLabels[announcement.priority as keyof typeof priorityLabels]?.color || priorityLabels.low.color}`}>
                                    {priorityLabels[announcement.priority as keyof typeof priorityLabels]?.text || 'Bilgi'}
                                </span>
                            </div>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {announcement.content}
                            </p>
                            <div className="mt-4 flex items-center gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(announcement.created_at).toLocaleDateString('tr-TR')}
                                </span>
                                {announcement.expires_at && (
                                    <span className="flex items-center gap-1 text-orange-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        Son: {new Date(announcement.expires_at).toLocaleDateString('tr-TR')}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">Henüz duyuru bulunmuyor.</p>
                </div>
            )}
        </div>
    );
};

export default AnnouncementSection;
