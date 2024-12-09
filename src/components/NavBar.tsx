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
        <nav className="bg-white shadow-lg">
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
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
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

                    {/* Mobile Menu Button */}
                    <div className="sm:hidden flex items-center">
                        <button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className="sm:hidden">
                <div className="pt-2 pb-3 space-y-1">
                    <Link
                        to="/"
                        className={`block pl-3 pr-4 py-2 text-base font-medium ${
                            isActive('/')
                                ? 'bg-indigo-50 border-l-4 border-indigo-500 text-indigo-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:border-l-4 hover:border-gray-300'
                        }`}
                    >
                        Ana Sayfa
                    </Link>
                    <Link
                        to="/quiz"
                        className={`block pl-3 pr-4 py-2 text-base font-medium ${
                            isActive('/quiz')
                                ? 'bg-indigo-50 border-l-4 border-indigo-500 text-indigo-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:border-l-4 hover:border-gray-300'
                        }`}
                    >
                        Quiz
                    </Link>
                    {user && (
                        <Link
                            to="/profile"
                            className={`block pl-3 pr-4 py-2 text-base font-medium ${
                                isActive('/profile')
                                    ? 'bg-indigo-50 border-l-4 border-indigo-500 text-indigo-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:border-l-4 hover:border-gray-300'
                            }`}
                        >
                            Profil
                        </Link>
                    )}
                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-l-4 hover:border-gray-300"
                        >
                            Çıkış Yap
                        </button>
                    ) : (
                        <Link
                            to="/login"
                            className="block pl-3 pr-4 py-2 text-base font-medium text-indigo-600 hover:bg-gray-50 hover:border-l-4 hover:border-indigo-300"
                        >
                            Giriş Yap
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};
