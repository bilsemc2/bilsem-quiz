import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClassInfo } from '@/types/profile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface ClassListProps {
  classes?: ClassInfo[];
}

const ClassList: React.FC<ClassListProps> = ({ classes }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const getUserRole = async () => {
      if (user?.id) {
        try {
          // Kullanıcının rolünü profiles tablosundan çek
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Kullanıcı rolü alınamadı:', error);
            return;
          }

          setUserRole(data?.role || null);
          console.log('Kullanıcı rolü:', data?.role); // Debug için log
        } catch (error) {
          console.error('Bir hata oluştu:', error);
        }
      }
    };

    getUserRole();
  }, [user]);

  const navigateToTeacherPanel = () => {
    navigate('/teacher');
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">Sınıflarım</h3>
      {classes && classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((classInfo) => (
            <button
              key={classInfo.id}
              onClick={() => navigate(`/classroom/${classInfo.id}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 flex items-center justify-between w-full"
            >
              <div className="flex flex-col items-start">
                <span className="text-lg">{classInfo.name}</span>
                <span className="text-sm opacity-75">{classInfo.grade}. Sınıf</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      ) : (
        <>
          {userRole === 'teacher' ? (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-white mb-3">Öğretmen Paneli</h3>
              <p className="text-white mb-4">Öğrenci takibi, sınıf yönetimi ve quiz oluşturma işlemleri için öğretmen panelinize gidebilirsiniz.</p>
              <button
                onClick={navigateToTeacherPanel}
                className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-2 px-6 rounded-lg shadow transition duration-300 flex items-center"
              >
                <span>Öğretmen Paneline Git</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Henüz bir sınıfa atanmadınız.</p>
          )}
        </>
      )}
    </div>
  );
};

export default ClassList;
