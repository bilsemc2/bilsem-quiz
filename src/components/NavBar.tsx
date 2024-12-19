import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

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
                            className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                        >
                            Ana Sayfa
                        </Link>
                        {user && (
                            <>
                                <Link
                                    to="/quiz"
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/quiz') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                                >
                                    Quiz
                                </Link>
                                <Link
                                    to="/duel"
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/duel') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                                >
                                    Düello
                                </Link>
                                {user.email === 'yaprakyesili@msn.com' && (
                                    <Link
                                        to="/admin"
                                        className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                                    >
                                        Admin
                                    </Link>
                                )}
                            </>
                        )}
                        {/* Matris Dropdown Menu */}
                        <Menu as="div" className="relative inline-block text-left">
                            <Menu.Button className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/create') || isActive('/puzzle-ranking') || isActive('/create-pdf')
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}>
                                Matris
                                <ChevronDownIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
                            </Menu.Button>
                            <Transition
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <Link
                                                to="/create"
                                                className={`block px-4 py-2 text-sm text-gray-700 ${active ? 'bg-gray-100' : ''}`}
                                            >
                                                Bulmaca Oluştur
                                            </Link>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }) => (
                                            <Link
                                                to="/puzzle-ranking"
                                                className={`block px-4 py-2 text-sm text-gray-700 ${active ? 'bg-gray-100' : ''}`}
                                            >
                                                En İyi Bulmacalar
                                            </Link>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }) => (
                                            <Link
                                                to="/create-pdf"
                                                className={`block px-4 py-2 text-sm text-gray-700 ${active ? 'bg-gray-100' : ''}`}
                                            >
                                                PDF Oluştur
                                            </Link>
                                        )}
                                    </Menu.Item>
                                </Menu.Items>
                            </Transition>
                        </Menu>

                    </div>

                    {/* User Menu */}
                    <div className="hidden md:flex md:items-center">
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/profile"
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/profile') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                                >
                                    Profil
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
                                >
                                    Çıkış Yap
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/login"
                                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
                                >
                                    Giriş Yap
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    Kayıt Ol
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={toggleMenu}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            <svg
                                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                            <svg
                                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
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
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div
                    className={`${
                        isMenuOpen ? 'block' : 'hidden'
                    } md:hidden absolute top-16 left-0 right-0 bg-white shadow-lg z-50`}
                >
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        <Link
                            to="/"
                            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                            onClick={toggleMenu}
                        >
                            Ana Sayfa
                        </Link>
                        {user && (
                            <>
                                <Link
                                    to="/quiz"
                                    className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/quiz') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                                    onClick={toggleMenu}
                                >
                                    Quiz
                                </Link>
                                <Link
                                    to="/duel"
                                    className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/duel') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                                    onClick={toggleMenu}
                                >
                                    Düello
                                </Link>
                                {user.email === 'yaprakyesili@msn.com' && (
                                    <Link
                                        to="/admin"
                                        className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/admin') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                                        onClick={toggleMenu}
                                    >
                                        Admin
                                    </Link>
                                )}
                                <Link
                                    to="/profile"
                                    className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/profile') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                                    onClick={toggleMenu}
                                >
                                    Profil
                                </Link>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        toggleMenu();
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-100"
                                >
                                    Çıkış Yap
                                </button>
                            </>
                        )}
                        {!user && (
                            <>
                                <Link
                                    to="/login"
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-100"
                                    onClick={toggleMenu}
                                >
                                    Giriş Yap
                                </Link>
                                <Link
                                    to="/signup"
                                    className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                                    onClick={toggleMenu}
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
