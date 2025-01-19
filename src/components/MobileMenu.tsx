import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const MobileMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
        try {
            await signOut();
            setIsOpen(false);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="relative md:hidden">
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                aria-label="Menu"
            >
                <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Menu */}
                    <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg z-50 transition-transform duration-300">
                        {/* Menu Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <span className="text-lg font-semibold text-gray-900">Menü</span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg hover:bg-gray-100"
                            >
                                <svg
                                    className="w-5 h-5 text-gray-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* User Info */}
                        {user && (
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                <div className="text-sm font-medium text-gray-900">
                                    {user.email}
                                </div>
                            </div>
                        )}
                        
                        {/* Menu Items */}
                        <div className="py-2">
                            <Link
                                to="/"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50"
                            >
                                <span className="text-lg mr-3">🏠</span>
                                Ana Sayfa
                            </Link>
                            <Link
                                to="/quiz"
                                onClick={() => setIsOpen(false)}
                                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                            >
                                Quiz
                            </Link>
                            <Link
                                to="/puzzle-creator"
                                onClick={() => setIsOpen(false)}
                                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                            >
                                Bulmaca Oluştur
                            </Link>
                            <Link
                                to="/drawing"
                                onClick={() => setIsOpen(false)}
                                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                            >
                                Resim
                            </Link>
                            <Link
                                to="/profile"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50"
                            >
                                <span className="text-lg mr-3">👤</span>
                                Profil
                            </Link>
                            
                            {!user ? (
                                <>
                                    <Link
                                        to="/login"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50"
                                    >
                                        <span className="text-lg mr-3">🔑</span>
                                        Giriş Yap
                                    </Link>
                                    <Link
                                        to="/signup"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50"
                                    >
                                        <span className="text-lg mr-3">✍️</span>
                                        Kayıt Ol
                                    </Link>
                                </>
                            ) : (
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50"
                                >
                                    <span className="text-lg mr-3">🚪</span>
                                    Çıkış Yap
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default MobileMenu;
