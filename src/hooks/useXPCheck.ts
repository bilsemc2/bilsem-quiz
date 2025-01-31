import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface XPCheckResult {
  hasEnoughXP: boolean;
  userXP: number;
  requiredXP: number;
  error: string | null;
  loading: boolean;
}

export const useXPCheck = (skipCheck: boolean = false) => {
  const { user } = useAuth();
  const location = useLocation();
  
  const [hasEnoughXP, setHasEnoughXP] = useState(false);
  const [userXP, setUserXP] = useState<number | null>(null);
  const [requiredXP, setRequiredXP] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [xpDeducted, setXPDeducted] = useState(false);

  useEffect(() => {
    const checkXP = async () => {
      if (skipCheck) {
        setLoading(false);
        setHasEnoughXP(true);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Ödev sayfaları için XP kontrolü yapmıyoruz
        if (location.pathname.includes('/assignments/')) {
          setLoading(false);
          setHasEnoughXP(true);
          return;
        }

        // XP gereksinimini kontrol et
        const { data: requirement, error: reqError } = await supabase
          .from('xp_requirements')
          .select('required_xp')
          .eq('page_path', location.pathname)
          .single();

        if (reqError) {
          setLoading(false);
          setHasEnoughXP(true);
          return;
        }

        if (!requirement?.required_xp) {
          setLoading(false);
          setHasEnoughXP(true);
          return;
        }

        setRequiredXP(requirement.required_xp);

        // Kullanıcı XP'sini kontrol et
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('experience')
          .eq('id', user?.id)
          .single();

        if (profileError) {
          setError('Kullanıcı profili yüklenemedi');
          setLoading(false);
          return;
        }

        if (!profile) {
          setError('Kullanıcı profili bulunamadı');
          setLoading(false);
          return;
        }

        setUserXP(profile.experience);

        // XP yeterli mi kontrol et
        if (profile.experience < requirement.required_xp) {
          setHasEnoughXP(false);
          return;
        }

        setHasEnoughXP(true);

        // XP azaltma işlemi
        if (!xpDeducted) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ experience: profile.experience - requirement.required_xp })
            .eq('id', user?.id);

          if (updateError) {
            setError('XP azaltma işlemi başarısız oldu');
            setLoading(false);
            return;
          }

          setXPDeducted(true);
        }

        setLoading(false);
      } catch (err) {
        console.error('XP kontrol hatası:', err);
        setError('XP kontrolü sırasında bir hata oluştu');
        setLoading(false);
      }
    };

    if (user?.id) {
      checkXP();
    }
  }, [user?.id, location.pathname, skipCheck, xpDeducted]);

  return {
    hasEnoughXP,
    userXP: userXP || 0,
    requiredXP: requiredXP || 0,
    error,
    loading
  } as XPCheckResult;
};