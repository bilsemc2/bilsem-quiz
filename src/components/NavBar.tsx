import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const NavBar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <nav className="bg-white shadow-lg hidden md:block">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        {/* Logo */}
                        <Link to="/" className="flex items-center">
                            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                                BilsemC2
                            </span>
                        </Link>

                        {/* Navigation Links */}
                        <div className="ml-6 flex space-x-4">
                            <Link
                                to="/"
                                className={`inline-flex items-center px-4 h-16 text-sm font-medium border-b-2 
                                    ${isActive('/') 
                                        ? 'border-indigo-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                            >
                                Ana Sayfa
                            </Link>
                            <Link
                                to="/quiz"
                                className={`inline-flex items-center px-4 h-16 text-sm font-medium border-b-2 
                                    ${isActive('/quiz')
                                        ? 'border-indigo-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                            >
                                Quiz
                            </Link>
                            {user && (
                                <Link
                                    to="/profile"
                                    className={`inline-flex items-center px-4 h-16 text-sm font-medium border-b-2 
                                        ${isActive('/profile')
                                            ? 'border-indigo-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                >
                                    Profil
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center">
                        {user ? (
                            <button
                                onClick={handleLogout}
                                className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                                Çıkış Yap
                            </button>
                        ) : (
                            <Link
                                to="/login"
                                className="ml-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-900"
                            >
                                Giriş Yap
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
