import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function NavBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    useEffect(() => {
        checkAdminStatus();
    }, [user]);

    const checkAdminStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setIsAdmin(user.email === 'yaprakyesili@msn.com');
    };

    return (
        <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0">
                        <span className="text-xl font-bold text-blue-600">
                            BilsemC2
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex md:items-center md:space-x-4">
                        <Link
                            to="/"
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                            }`}
                        >
                            Ana Sayfa
                        </Link>
                        <Link
                            to="/quiz"
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/quiz') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                            }`}
                        >
                            Quiz
                        </Link>
                        {user && (
                            <>
                                <Link
                                    to="/create"
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                                        isActive('/create') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                                    }`}
                                >
                                    Bulmaca Oluştur
                                </Link>
                                {user.email === 'yaprakyesili@msn.com' && (
                                    <Link
                                        to="/admin"
                                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                                            isActive('/admin') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                                        }`}
                                    >
                                        Admin Paneli
                                    </Link>
                                )}
                                <Link
                                    to="/profile"
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                                        isActive('/profile') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                                    }`}
                                >
                                    Profil
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600"
                                >
                                    Çıkış Yap
                                </button>
                            </>
                        )}
                        {!user && (
                            <>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                    Giriş Yap
                                </Link>
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-indigo-600 bg-white border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition-all duration-200"
                                >
                                    Kayıt Ol
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={toggleMenu}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? (
                                <svg
                                    className="block h-6 w-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg
                                    className="block h-6 w-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link
                            to="/"
                            className={`block px-3 py-2 rounded-md text-base font-medium ${
                                isActive('/') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                            }`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Ana Sayfa
                        </Link>
                        {user && (
                            <>
                                <Link
                                    to="/quiz"
                                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                                        isActive('/quiz') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                                    }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Quiz
                                </Link>
                                <Link
                                    to="/create"
                                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                                        isActive('/create') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                                    }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Bulmaca Oluştur
                                </Link>
                                {user.email === 'yaprakyesili@msn.com' && (
                                    <Link
                                        to="/admin"
                                        className={`block px-3 py-2 rounded-md text-base font-medium ${
                                            isActive('/admin') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                                        }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Admin Paneli
                                    </Link>
                                )}
                                <Link
                                    to="/profile"
                                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                                        isActive('/profile') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                                    }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Profil
                                </Link>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
                                >
                                    Çıkış
                                </button>
                            </>
                        )}
                        {!user && (
                            <>
                                <Link
                                    to="/login"
                                    className="block w-full text-center px-4 py-2 text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Giriş Yap
                                </Link>
                                <Link
                                    to="/register"
                                    className="block w-full text-center mt-2 px-4 py-2 text-base font-medium text-indigo-600 bg-white border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition-all duration-200"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Kayıt Ol
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
