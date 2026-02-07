import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidReset, setIsValidReset] = useState(false);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setIsValidReset(true);
    } else {
      setError('Geçersiz şifre sıfırlama bağlantısı. Lütfen tekrar şifre sıfırlama isteği gönderin.');
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (newPassword !== confirmPassword) {
        throw new Error('Şifreler eşleşmiyor');
      }

      if (newPassword.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalıdır');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess(true);
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Şifre güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-violet-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h1 className="text-2xl font-bold text-white text-center mb-6">
            Yeni Şifre Belirle
          </h1>

          {success ? (
            <div className="flex items-start gap-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-4 text-emerald-300">
              <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
              <span>Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz...</span>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300 mb-1">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={!isValidReset}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 transition-all"
                  placeholder="En az 6 karakter"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">
                  Şifreyi Tekrar Girin
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!isValidReset}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 transition-all"
                  placeholder="Şifrenizi tekrar yazın"
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 bg-red-500/20 border border-red-500/40 rounded-xl p-4 text-red-300">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isValidReset}
                className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                  boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(168, 85, 247, 0.4)'
                }}
              >
                {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </button>

              {!isValidReset && (
                <div className="flex items-start gap-3 bg-amber-500/20 border border-amber-500/40 rounded-xl p-4 text-amber-300">
                  <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                  <span>Bu sayfaya doğrudan erişemezsiniz. Lütfen email'inize gönderilen şifre sıfırlama bağlantısını kullanın.</span>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
