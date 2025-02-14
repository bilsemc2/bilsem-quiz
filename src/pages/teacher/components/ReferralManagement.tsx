import React from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface ReferredStudent {
  id: string;
  full_name: string;
  email: string;
  joined_at: string;
}

const ReferralManagement: React.FC = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = React.useState('');
  const [referredStudents, setReferredStudents] = React.useState<ReferredStudent[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchReferralInfo = async () => {
    if (!user) return;

    setLoading(true);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    if (profileError) {
      toast.error('Referans kodu alınırken bir hata oluştu');
      setLoading(false);
      return;
    }

    setReferralCode(profile.referral_code || '');

    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('referred_by', profile.referral_code)
      .order('created_at', { ascending: false });

    if (studentsError) {
      toast.error('Öğrenci listesi alınırken bir hata oluştu');
      setLoading(false);
      return;
    }

    setReferredStudents(
      students.map((s) => ({
        ...s,
        joined_at: s.created_at,
      }))
    );
    setLoading(false);
  };

  React.useEffect(() => {
    fetchReferralInfo();
  }, [user]);

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referans kodu kopyalandı');
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Referans Yönetimi</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Referans Kodunuz
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={referralCode}
            readOnly
            className="border p-2 rounded flex-1"
          />
          <button
            onClick={copyReferralCode}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Kopyala
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3">Referans Olan Öğrenciler</h3>
        <div className="space-y-3">
          {referredStudents.map((student) => (
            <div
              key={student.id}
              className="border p-3 rounded flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{student.full_name}</p>
                <p className="text-sm text-gray-500">{student.email}</p>
                <p className="text-xs text-gray-400">
                  Katılım: {new Date(student.joined_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => {/* Öğrenci detayına git */}}
                className="text-blue-500 hover:text-blue-600"
              >
                Detaylar
              </button>
            </div>
          ))}
          {referredStudents.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              Henüz referans olan öğrenci bulunmuyor.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferralManagement;