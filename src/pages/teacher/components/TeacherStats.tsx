
import React from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Stats {
  totalStudents: number;
  totalClasses: number;
  totalAssignments: number;
  referredStudents: number;
}

const StatCard: React.FC<{ title: string; value: number }> = ({ title, value }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
    <p className="text-3xl font-bold mt-2">{value}</p>
  </div>
);

const TeacherStats: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<Stats>({
    totalStudents: 0,
    totalClasses: 0,
    totalAssignments: 0,
    referredStudents: 0,
  });

  React.useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // Önce öğretmenin referans kodunu al
        const { data: profile } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('id', user.id)
          .single();

        if (!profile?.referral_code) {
          throw new Error('Referans kodu bulunamadı');
        }

        const [classesResponse, studentsResponse, assignmentsResponse, referralsResponse] = await Promise.all([
          supabase
            .from('classes')
            .select('*', { count: 'exact' })
            .eq('teacher_id', user.id),
          supabase
            .from('class_students')
            .select('*, classes!inner(*)', { count: 'exact' })
            .eq('classes.teacher_id', user.id),
          supabase
            .from('assignments')
            .select('*', { count: 'exact' })
            .eq('created_by', user.id),
          supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .eq('referred_by', profile.referral_code),
        ]);

      setStats({
        totalClasses: classesResponse.count || 0,
        totalStudents: studentsResponse.count || 0,
        totalAssignments: assignmentsResponse.count || 0,
        referredStudents: referralsResponse.count || 0,
      });
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast.error('İstatistikler yüklenirken bir hata oluştu');
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <StatCard title="Toplam Öğrenci" value={stats.totalStudents} />
      <StatCard title="Toplam Sınıf" value={stats.totalClasses} />
      <StatCard title="Toplam Ödev" value={stats.totalAssignments} />
      <StatCard title="Referanslı Öğrenci" value={stats.referredStudents} />
    </div>
  );
};

export default TeacherStats;