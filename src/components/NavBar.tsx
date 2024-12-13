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
    }, []);

    const checkAdminStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin, email')
            .eq('id', user.id)
            .single();

        setIsAdmin(profile?.is_admin && profile.email === 'yaprakyesili@msn.com');
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

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link
                            to="/"
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/') 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Ana Sayfa
                        </Link>
                        <Link
                            to="/quiz"
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/quiz')
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Quiz
                        </Link>
                        <Link
                            to="/homework"
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/homework')
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Ödev
                        </Link>
                        <Link
                            to="/duel"
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/duel')
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Düello
                        </Link>
                        {user && (
                            <>
                                <Link
                                    to="/profile"
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                                        isActive('/profile')
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    Profil
                                </Link>
                                {isAdmin && (
                                    <Link
                                        to="/admin"
                                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                                            isActive('/admin')
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        Admin Paneli
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    Çıkış Yap
                                </button>
                            </>
                        )}
                    </div>

                    {/* Hamburger Menu Button */}
                    <button 
                        className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={toggleMenu}
                        aria-label="Ana menü"
                    >
                        <svg 
                            className="w-6 h-6" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                            />
                        </svg>
                    </button>
                </div>

                {/* Mobile Navigation Menu */}
                <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        <Link
                            to="/"
                            className={`block px-3 py-2 rounded-md text-base font-medium ${
                                isActive('/') 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Ana Sayfa
                        </Link>
                        <Link
                            to="/quiz"
                            className={`block px-3 py-2 rounded-md text-base font-medium ${
                                isActive('/quiz')
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Quiz
                        </Link>
                        <Link
                            to="/homework"
                            className={`block px-3 py-2 rounded-md text-base font-medium ${
                                isActive('/homework')
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Ödev
                        </Link>
                        <Link
                            to="/duel"
                            className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isActive('/duel') ? 'bg-gray-100' : ''}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Düello
                        </Link>
                        {user && (
                            <>
                                <Link
                                    to="/profile"
                                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                                        isActive('/profile')
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Profil
                                </Link>
                                {isAdmin && (
                                    <Link
                                        to="/admin"
                                        className={`block px-3 py-2 rounded-md text-base font-medium ${
                                            isActive('/admin')
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Admin Paneli
                                    </Link>
                                )}
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                                >
                                    Çıkış Yap
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
