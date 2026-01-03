import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, School, FileQuestion, TrendingUp, User, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalClasses: number;
  totalQuizzes: number;
  recentUsers: any[];
  recentQuizzes: any[];
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalClasses: 0,
    totalQuizzes: 0,
    recentUsers: [],
    recentQuizzes: [],
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*');

      if (usersError) throw usersError;

      const activeUsers = users?.filter(user => user.is_active).length || 0;

      const recentUsers = users
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5) || [];

      const { count: classCount, error: classError } = await supabase
        .from('classes')
        .select('*', { count: 'exact' });

      if (classError) throw classError;

      const { data: quizzes, error: quizError } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (quizError) throw quizError;

      setStats({
        totalUsers: users?.length || 0,
        activeUsers,
        totalClasses: classCount || 0,
        totalQuizzes: quizzes?.length || 0,
        recentUsers,
        recentQuizzes: quizzes?.slice(0, 5) || [],
      });

      setError(null);
    } catch (err) {
      console.error('Dashboard istatistikleri alınırken hata:', err);
      setError('İstatistikler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
        {error}
      </div>
    );
  }

  const statCards = [
    { title: 'Toplam Kullanıcı', value: stats.totalUsers, sub: `${stats.activeUsers} aktif kullanıcı`, icon: Users, color: 'indigo' },
    { title: 'Toplam Sınıf', value: stats.totalClasses, icon: School, color: 'purple' },
    { title: 'Toplam Quiz', value: stats.totalQuizzes, icon: FileQuestion, color: 'emerald' },
    { title: 'Aktif Oran', value: `${stats.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%`, icon: TrendingUp, color: 'amber' },
  ];

  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`${colorClasses[card.color]} rounded-2xl p-6 text-white shadow-lg`}
          >
            <div className="flex items-center gap-3 mb-4">
              <card.icon className="w-6 h-6" />
              <span className="font-semibold">{card.title}</span>
            </div>
            <div className="text-4xl font-bold">{card.value}</div>
            {card.sub && <div className="text-sm opacity-80 mt-2">{card.sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* Son Aktiviteler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Son Kullanıcılar */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Son Kayıt Olan Kullanıcılar</h2>
          <ul className="divide-y divide-slate-100">
            {stats.recentUsers.map((user) => (
              <li key={user.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="font-medium text-slate-700">{user.name || user.email}</div>
                    <div className="text-sm text-slate-500">
                      {new Date(user.created_at).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
                {user.is_active && (
                  <span className="p-1 bg-emerald-100 rounded-full">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Son Quizler */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Son Eklenen Quizler</h2>
          <ul className="divide-y divide-slate-100">
            {stats.recentQuizzes.map((quiz) => (
              <li key={quiz.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileQuestion className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="font-medium text-slate-700">{quiz.title}</div>
                    <div className="text-sm text-slate-500">
                      {quiz.grade}. Sınıf - {quiz.subject}
                    </div>
                  </div>
                </div>
                {quiz.is_active && (
                  <span className="p-1 bg-emerald-100 rounded-full">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
