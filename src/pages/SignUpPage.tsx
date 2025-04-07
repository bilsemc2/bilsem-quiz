import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

const INITIAL_XP = 50; // Başlangıç XP'si

export default function SignUpPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        school: '',
        grade: '1',
        password: '',
        confirmPassword: '',
        referralCode: searchParams.get('ref') || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (formData.password !== formData.confirmPassword) {
                throw new Error('Şifreler eşleşmiyor');
            }

            if (formData.password.length < 6) {
                throw new Error('Şifre en az 6 karakter olmalıdır');
            }

            // Referans kodunu kontrol et
            let referrerId = null;
            if (formData.referralCode) {
                const { data: referrer, error: refError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('referral_code', formData.referralCode)
                    .single();

                if (refError || !referrer) {
                    throw new Error('Geçersiz referans kodu');
                }
                referrerId = referrer.id;
            }

            // Kullanıcı oluştur
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name: formData.name,
                        school: formData.school,
                        grade: parseInt(formData.grade)
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // Profili güncelle
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        name: formData.name,
                        email: formData.email,
                        school: formData.school,
                        grade: parseInt(formData.grade),
                        referred_by: formData.referralCode || null,
                        avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${formData.name}&backgroundColor=b6e3f4,c0aede,d1d4f9&mood=happy`,
                        points: 0,
                        experience: INITIAL_XP
                    })
                    .eq('id', authData.user.id);

                if (profileError) throw profileError;

                // Referral kullanıldıysa referans veren kullanıcıya da XP ver
                if (referrerId) {
                    const { error: referrerError } = await supabase.rpc('increment_xp', {
                        user_id: referrerId,
                        amount: INITIAL_XP
                    });

                    if (referrerError) {
                        console.error('Referans XP hatası:', referrerError);
                    }
                }

                // Otomatik giriş yap
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password
                });

                if (signInError) throw signInError;

                // Başarı mesajı
                const successMessage = formData.referralCode
                    ? `Kayıt başarılı! ${INITIAL_XP} XP ile başlıyorsunuz ve arkadaşınız da ${INITIAL_XP} XP kazandı.`
                    : `Kayıt başarılı! ${INITIAL_XP} XP ile başlıyorsunuz.`;
                
                alert(successMessage);
                
                // Quiz sayfasına yönlendir
                navigate('/quiz');
            }
        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        BilsemC2'ye Hoş Geldin!
                    </h2>
                    <p className="text-gray-600">
                        Hemen ücretsiz hesap oluştur ve öğrenmeye başla
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Adresin
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                            placeholder="ornek@gmail.com"
                        />
                    </div>

                    {/* Ad Soyad */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ad Soyad
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                            placeholder="Adın ve soyadın"
                        />
                    </div>

                    {/* Okul */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Okul
                        </label>
                        <input
                            type="text"
                            name="school"
                            required
                            value={formData.school}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                            placeholder="Okulunun adı"
                        />
                    </div>

                    {/* Sınıf */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sınıf
                        </label>
                        <select
                            name="grade"
                            value={formData.grade}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                                <option key={grade} value={grade}>
                                    {grade}. Sınıf
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Şifre */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Şifre
                        </label>
                        <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                            placeholder="En az 6 karakter"
                        />
                    </div>

                    {/* Şifre Tekrar */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Şifre Tekrar
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                            placeholder="Şifreni tekrar gir"
                        />
                    </div>

                    {/* Referans Kodu */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Referans Kodu (İsteğe bağlı)
                        </label>
                        <input
                            type="text"
                            name="referralCode"
                            value={formData.referralCode}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                            placeholder="Arkadaşının referans kodu"
                        />
                    </div>

                    {/* Kayıt Ol Butonu */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
                    </button>

                    {/* Giriş Yap Linki */}
                    <div className="text-center text-sm text-gray-600">
                        Zaten hesabın var mı?{' '}
                        <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
                            Giriş Yap
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
