import React, { useState, useEffect } from 'react';
import ColorGrid from '../components/BrainTrainer/ColorGrid';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const ColorGridPage: React.FC = () => {
  const [isVip, setIsVip] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkVipStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_vip')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('VIP durumu kontrol edilirken hata:', error);
          setIsVip(false);
        } else {
          setIsVip(data?.is_vip || false);
        }
      } catch (error) {
        console.error('Hata:', error);
        setIsVip(false);
      } finally {
        setLoading(false);
      }
    };

    checkVipStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Giriş Yapmanız Gerekiyor
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Renk Sekansı oyununu oynamak için lütfen giriş yapın
            </p>
          </div>
          <div className="mt-5">
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isVip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              VIP Üyelik Gerekli
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Renk Sekansı oyunu sadece VIP üyeler için kullanılabilir. VIP üyelik için lütfen yönetici ile iletişime geçin.
            </p>
            <p className="mt-4 text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg">
              <strong>Bu oyun ne işe yarar?</strong><br />
              Renk Sekansı, hafızanızı ve dikkat becerinizi geliştirmek için tasarlanmış interaktif bir oyundur. Ekranda beliren renk sırasını hatırlayarak aynı sırayla tekrar etmeniz gerekir. Seviyeler ilerledikçe zorluk düzeyi artırılır. Düzenli oynayarak görsel hafıza ve dikkat becerinizi geliştirebilirsiniz.
            </p>
          </div>
          <div className="mt-5">
            <Link
              to="/profile"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Profile Git
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <ColorGrid />
    </div>
  );
};

export default ColorGridPage;
