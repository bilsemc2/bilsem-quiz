import { CheckCircle, Trophy, Clock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatsSectionProps {
    stats: any;
    formatDuration: (minutes: number) => string;
}

const StatsSection = ({ stats, formatDuration }: StatsSectionProps) => {
    if (!stats) return null;

    const statCards = [
        {
            title: 'Tamamlanan Ödevler',
            value: `${stats.completedCount}/${stats.totalCount}`,
            icon: CheckCircle,
            color: 'emerald',
            progress: stats.completionRate,
            subtext: `% ${stats.completionRate} Oranında Tamamlandı`
        },
        {
            title: 'Ortalama Başarı',
            value: `${stats.averageScore}%`,
            icon: Trophy,
            color: 'indigo',
            progress: stats.averageScore,
            subtext: `Sınıf Ortalaması: %${stats.averageScore}`
        },
        {
            title: 'Ortalama Süre',
            value: `${stats.averageTime} dk`,
            icon: Clock,
            color: 'blue',
            subtext: `Toplam Harcanan: ${formatDuration(stats.totalTime || 0)}`
        }
    ];

    const progressColors: Record<string, string> = {
        emerald: 'bg-emerald-500',
        indigo: 'bg-gradient-to-r from-indigo-500 to-purple-500',
        blue: 'bg-blue-500'
    };

    const textColors: Record<string, string> = {
        emerald: 'text-emerald-600',
        indigo: 'text-indigo-600',
        blue: 'text-blue-600'
    };

    const bgColors: Record<string, string> = {
        emerald: 'bg-emerald-50',
        indigo: 'bg-indigo-50',
        blue: 'bg-blue-50'
    };

    return (
        <div className="mt-8 space-y-8">
            <h3 className="text-xl font-bold text-slate-800">Ödev İstatistiklerin</h3>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((card) => (
                    <div key={card.title} className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-center gap-2 text-slate-500 font-medium mb-2">
                            <card.icon className={`w-5 h-5 ${textColors[card.color]}`} />
                            {card.title}
                        </div>
                        <div className="text-3xl font-extrabold text-slate-800 mb-4">{card.value}</div>
                        {card.progress !== undefined && (
                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                                <div
                                    className={`h-full ${progressColors[card.color]} transition-all`}
                                    style={{ width: `${card.progress}%` }}
                                />
                            </div>
                        )}
                        <p className={`text-xs font-bold ${textColors[card.color]} ${!card.progress ? `p-3 ${bgColors[card.color]} rounded-lg mt-2` : ''}`}>
                            {card.subtext}
                        </p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            {stats.progressData && stats.progressData.length > 0 && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h4 className="font-bold text-slate-800 mb-4">Ödev Başarı Grafiği</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats.progressData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`%${value}`, 'Başarı Oranı']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="başarı"
                                    stroke="#6366f1"
                                    strokeWidth={4}
                                    dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                    name="Başarı"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h4 className="font-bold text-slate-800 mb-4">Doğru/Yanlış Dağılımı</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.progressData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="doğru" fill="#10b981" radius={[4, 4, 0, 0]} name="Doğru" />
                                <Bar dataKey="yanlış" fill="#ef4444" radius={[4, 4, 0, 0]} name="Yanlış" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatsSection;
