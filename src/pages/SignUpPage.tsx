import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const SignUpPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        school: '',
        grade: '1',
        password: '',
        confirmPassword: ''
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
            // Şifre kontrolü
            if (formData.password !== formData.confirmPassword) {
                throw new Error('Şifreler eşleşmiyor');
            }

            if (formData.password.length < 6) {
                throw new Error('Şifre en az 6 karakter olmalıdır');
            }

            // Supabase auth ile kullanıcı oluştur
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

            if (authError) {
                console.error('Auth Error:', authError);
                if (authError.message.includes('User already registered')) {
                    throw new Error('Bu email adresi zaten kayıtlı');
                }
                throw new Error(authError.message);
            }

            if (!authData.user) {
                throw new Error('Kullanıcı oluşturulamadı');
            }

            // Önce profil var mı kontrol et
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select()
                .eq('id', authData.user.id)
                .single();

            if (!existingProfile) {
                // Profil yoksa oluştur
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: authData.user.id,
                            email: formData.email,
                            name: formData.name,
                            school: formData.school,
                            grade: parseInt(formData.grade),
                            avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${formData.name}&backgroundColor=b6e3f4,c0aede,d1d4f9&mood=happy`,
                            points: 0,
                            experience: 0
                        }
                    ])
                    .select()
                    .single();

                if (profileError) {
                    console.error('Profile Error:', profileError);
                    throw new Error('Profil oluşturulamadı: ' + profileError.message);
                }
            }

            // Hemen giriş yap
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (signInError) {
                throw new Error('Giriş yapılamadı: ' + signInError.message);
            }

            // Başarılı kayıt ve giriş
            alert('Kayıt başarılı! Profilinize yönlendiriliyorsunuz.');
            navigate('/profile');
        } catch (err) {
            console.error('Signup Error:', err);
            setError(err instanceof Error ? err.message : 'Kayıt sırasında bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Kayıt Ol</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Bilsem Quiz'e hoş geldiniz! Hemen kayıt olun ve quizlere başlayın.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Ad Soyad
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="school" className="block text-sm font-medium text-gray-700">
                            Okul
                        </label>
                        <input
                            type="text"
                            name="school"
                            id="school"
                            required
                            value={formData.school}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                            Sınıf
                        </label>
                        <select
                            name="grade"
                            id="grade"
                            required
                            value={formData.grade}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((grade) => (
                                <option key={grade} value={grade}>
                                    {grade}. Sınıf
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Şifre
                        </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Şifre Tekrar
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            id="confirmPassword"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignUpPage;
