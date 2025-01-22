import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import Chip from '@mui/material/Chip';
import { Fragment } from 'react';
import { BoxIcon, Puzzle, FlipHorizontal2, Package, Shapes, RotateCw, KeyRound, FileText, Brain } from 'lucide-react';

export default function NavBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0);
    const [userXP, setUserXP] = useState(0);

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
        const checkUser = async () => {
            if (!user) {
                setIsAdmin(false);
                return;
            }

            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single();

                setIsAdmin(profile?.is_admin || false);
            } catch (error) {
                console.error('Admin kontrolü yapılırken hata:', error);
                setIsAdmin(false);
            }
        };

        checkUser();
        const fetchUserXP = async () => {
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('experience')
                    .eq('id', user.id)
                    .single();
                
                if (profile) {
                    setUserXP(profile.experience || 0);
                }
            }
        };

        fetchUserXP();
        const updateOnlineCount = async () => {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('last_seen');

            if (profiles) {
                const now = new Date().getTime();
                const onlineUsers = profiles.filter(profile => 
                    profile.last_seen && (now - new Date(profile.last_seen).getTime()) < 5 * 60 * 1000
                );
                setOnlineCount(onlineUsers.length);
            }
        };

        updateOnlineCount();
        const interval = setInterval(updateOnlineCount, 30000);

        const channel = supabase
            .channel('online-users')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles'
                },
                () => {
                    updateOnlineCount();
                }
            )
            .subscribe();

        return () => {
            clearInterval(interval);
            channel.unsubscribe();
        };
    }, [user]);

    return (
        <nav className="bg-white shadow-md fixed w-full top-0 z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <img
                                src="/bilsemc2.svg"
                                alt="Bilsem sınavı"
                                className="w-10 h-10"
                            />
                            <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-gradient bg-300% bg-clip-text text-transparent font-extrabold text-lg tracking-wide">
                                BilsemC2
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex md:items-center md:space-x-6">
                        <Link
                            to="/"
                            className={`text-lg font-semibold px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                isActive('/') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                            }`}
                        >
                            Ana Sayfa
                        </Link>
                        {!user && (
                            <>
                                <Link
                                    to="/services"
                                    className={`text-lg font-semibold px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                        isActive('/services') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                    }`}
                                >
                                    Hizmetler
                                </Link>
                                <Link
                                    to="/how-it-works"
                                    className={`text-lg font-semibold px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                        isActive('/how-it-works') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                    }`}
                                >
                                    Nasıl Çalışır?
                                </Link>
                                <Link
                                    to="/faq"
                                    className={`text-lg font-semibold px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                        isActive('/faq') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                    }`}
                                >
                                    SSS
                                </Link>
                                <Link
                                    to="/contact"
                                    className={`text-lg font-semibold px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                        isActive('/contact') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                    }`}
                                >
                                    İletişim
                                </Link>
                            </>
                        )}
                        {user && (
                            <>
                                <Link
                                    to="/quiz"
                                    className={`text-lg font-semibold px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                        isActive('/quiz') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                    }`}
                                >
                                    Quizeka
                                </Link>
                                <Link
                                    to="/duel"
                                    className={`text-lg font-semibold px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                        isActive('/duel') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                    }`}
                                >
                                    Düello
                                </Link>
                                <Menu as="div" className="relative inline-block text-left">
                                    <Menu.Button className="inline-flex items-center px-3 py-2 text-lg font-semibold rounded-lg hover:opacity-90 transition-all duration-200">
                                        <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent font-extrabold tracking-wide">
                                            BilsemC2
                                        </span>
                                        <ChevronDownIcon className="w-5 h-5 ml-1 text-indigo-500" />
                                    </Menu.Button>
                                    <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="transform opacity-0 scale-95"
                                        enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="transform opacity-100 scale-100"
                                        leaveTo="transform opacity-0 scale-95"
                                    >
                                        <Menu.Items className="absolute right-0 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 z-50">
                                            <div className="px-1 py-1">
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            to="/bilsemc2"
                                                            className={`${
                                                                active ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'text-gray-700 hover:text-indigo-500'
                                                            } group flex items-center px-4 py-2 text-lg font-semibold rounded-md w-full transition-all duration-200`}
                                                        >
                                                            <Package className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-indigo-500'}`} />
                                                            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-extrabold text-lg tracking-wide">
                                                                BilsemC2
                                                            </span>
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            to="/missing-piece"
                                                            className={`${
                                                                active ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'text-gray-700 hover:text-indigo-500'
                                                            } group flex items-center px-4 py-2 text-lg font-semibold rounded-md w-full transition-all duration-200`}
                                                        >
                                                            <Puzzle className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-indigo-500'}`} />
                                                            Eksik Parça
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            to="/unfolded-cube"
                                                            className={`${
                                                                active ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'text-gray-700 hover:text-indigo-500'
                                                            } group flex items-center px-4 py-2 text-lg font-semibold rounded-md w-full transition-all duration-200`}
                                                        >
                                                            <BoxIcon className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-indigo-500'}`} />
                                                            Açık Küp
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            to="/cube-counting"
                                                            className={`${
                                                                active ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'text-gray-700 hover:text-indigo-500'
                                                            } group flex items-center px-4 py-2 text-lg font-semibold rounded-md w-full transition-all duration-200`}
                                                        >
                                                            <Package className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-indigo-500'}`} />
                                                            Küp Sayma
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            to="/mirror-games"
                                                            className={`${
                                                                active ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'text-gray-700 hover:text-indigo-500'
                                                            } group flex items-center px-4 py-2 text-lg font-semibold rounded-md w-full transition-all duration-200`}
                                                        >
                                                            <FlipHorizontal2 className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-indigo-500'}`} />
                                                            Ayna Simetrisi
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            to="/shape-game"
                                                            className={`${
                                                                active ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'text-gray-700 hover:text-indigo-500'
                                                            } group flex items-center px-4 py-2 text-lg font-semibold rounded-md w-full transition-all duration-200`}
                                                        >
                                                            <Shapes className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-indigo-500'}`} />
                                                            Şekil Oyunu
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            to="/rotation-game"
                                                            className={`${
                                                                active ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'text-gray-700 hover:text-indigo-500'
                                                            } group flex items-center px-4 py-2 text-lg font-semibold rounded-md w-full transition-all duration-200`}
                                                        >
                                                            <RotateCw className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-indigo-500'}`} />
                                                            Döndürme Oyunu
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            to="/visual-encoder"
                                                            className={`${
                                                                active ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'text-gray-700 hover:text-indigo-500'
                                                            } group flex items-center px-4 py-2 text-lg font-semibold rounded-md w-full transition-all duration-200`}
                                                        >
                                                            <KeyRound className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-indigo-500'}`} />
                                                            Şifreleme
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            to="/puzzle-creator"
                                                            className={`${
                                                                active ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'text-gray-700 hover:text-indigo-500'
                                                            } group flex items-center px-4 py-2 text-lg font-semibold rounded-md w-full transition-all duration-200`}
                                                        >
                                                            <Puzzle className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-indigo-500'}`} />
                                                            Bulmaca Oluştur
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            to="/create-pdf"
                                                            className={`${
                                                                active ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'text-gray-700 hover:text-indigo-500'
                                                            } group flex items-center px-4 py-2 text-lg font-semibold rounded-md w-full transition-all duration-200`}
                                                        >
                                                            <FileText className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-indigo-500'}`} />
                                                            PDF Oluştur
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            to="/memory-game"
                                                            className={`${
                                                                active ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'text-gray-700 hover:text-indigo-500'
                                                            } group flex items-center px-4 py-2 text-lg font-semibold rounded-md w-full transition-all duration-200`}
                                                        >
                                                            <Brain className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-indigo-500'}`} />
                                                            Hafıza Oyunu
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                            </div>
                                        </Menu.Items>
                                    </Transition>
                                </Menu>
                                {isAdmin && (
                                    <Link
                                        to="/admin"
                                        className={`text-lg font-semibold px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                            isActive('/admin') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                        }`}
                                    >
                                        Admin
                                    </Link>
                                )}
                            </>
                        )}
                        <Link
                            to="/blog"
                            className={`text-lg font-semibold px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                isActive('/blog') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                            }`}
                        >
                            Blog
                        </Link>
                    </div>

                    {/* User Menu */}
                    <div className="hidden md:flex md:items-center">
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/profile"
                                    className={`text-lg font-semibold px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                        isActive('/profile') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                    }`}
                                >
                                    Profil
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-lg font-semibold px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200"
                                >
                                    Çıkış Yap
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/login"
                                    className="text-lg font-semibold px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200"
                                >
                                    Giriş Yap
                                </Link>
                                <Link
                                    to="/signup"
                                    className="text-lg font-semibold px-3 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
                                >
                                    Kayıt Ol
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Çevrimiçi Kullanıcı Sayısı */}
                    <div className="hidden sm:flex items-center mr-4">
                        <Chip
                            icon={<FiberManualRecordIcon sx={{ fontSize: 12, color: 'success.main' }} />}
                            label={`${onlineCount} Çevrimiçi`}
                            size="small"
                            sx={{
                                bgcolor: 'success.light',
                                color: 'success.dark',
                                '& .MuiChip-icon': {
                                    color: 'success.main'
                                }
                            }}
                        />
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
            <Transition
                show={isMenuOpen}
                enter="transition-opacity ease-linear duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity ease-linear duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                className="fixed inset-0 z-50"
            >
                <div className="relative z-50">
                    {/* Backdrop */}
                    <Transition.Child
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    {/* Panel */}
                    <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl overflow-y-auto">
                        <div className="px-6 py-3 space-y-2">
                            <Link
                                to="/"
                                className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                    isActive('/') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                }`}
                                onClick={toggleMenu}
                            >
                                Ana Sayfa
                            </Link>
                            {!user && (
                                <>
                                    <Link
                                        to="/services"
                                        className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                            isActive('/services') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                        }`}
                                        onClick={toggleMenu}
                                    >
                                        Hizmetler
                                    </Link>
                                    <Link
                                        to="/how-it-works"
                                        className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                            isActive('/how-it-works') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                        }`}
                                        onClick={toggleMenu}
                                    >
                                        Nasıl Çalışır?
                                    </Link>
                                    <Link
                                        to="/faq"
                                        className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                            isActive('/faq') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                        }`}
                                        onClick={toggleMenu}
                                    >
                                        SSS
                                    </Link>
                                    <Link
                                        to="/contact"
                                        className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                            isActive('/contact') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                        }`}
                                        onClick={toggleMenu}
                                    >
                                        İletişim
                                    </Link>
                                </>
                            )}
                            {user && (
                                <>
                                    <Link
                                        to="/quiz"
                                        className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                            isActive('/quiz') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                        }`}
                                        onClick={toggleMenu}
                                    >
                                        Quizeka
                                    </Link>
                                    <Link
                                        to="/duel"
                                        className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                            isActive('/duel') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                        }`}
                                        onClick={toggleMenu}
                                    >
                                        Düello
                                    </Link>
                                    <div className="px-6 py-3">
                                        <div className="font-medium text-gray-600 mb-2">BilsemC2</div>
                                        <div className="space-y-2">
                                            <Link
                                                to="/bilsemc2"
                                                className={`block py-3 text-lg font-bold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                                    isActive('/bilsemc2') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                                }`}
                                                onClick={toggleMenu}
                                            >
                                                <Package className="w-5 h-5 mr-3" />
                                                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-extrabold text-lg tracking-wide">
                                                    BilsemC2
                                                </span>
                                            </Link>
                                            <Link
                                                to="/missing-piece"
                                                className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                                    isActive('/missing-piece') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                                }`}
                                                onClick={toggleMenu}
                                            >
                                                <Puzzle className="w-5 h-5 mr-3" />
                                                Eksik Parça
                                            </Link>
                                            <Link
                                                to="/unfolded-cube"
                                                className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                                    isActive('/unfolded-cube') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                                }`}
                                                onClick={toggleMenu}
                                            >
                                                <BoxIcon className="w-5 h-5 mr-3" />
                                                Açık Küp
                                            </Link>
                                            <Link
                                                to="/cube-counting"
                                                className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                                    isActive('/cube-counting') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                                }`}
                                                onClick={toggleMenu}
                                            >
                                                <Package className="w-5 h-5 mr-3" />
                                                Küp Sayma
                                            </Link>
                                            <Link
                                                to="/mirror-games"
                                                className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                                    isActive('/mirror-games') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                                }`}
                                                onClick={toggleMenu}
                                            >
                                                <FlipHorizontal2 className="w-5 h-5 mr-3" />
                                                Ayna Simetrisi
                                            </Link>
                                            <Link
                                                to="/shape-game"
                                                className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                                    isActive('/shape-game') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                                }`}
                                                onClick={toggleMenu}
                                            >
                                                <Shapes className="w-5 h-5 mr-3" />
                                                Şekil Oyunu
                                            </Link>
                                            <Link
                                                to="/rotation-game"
                                                className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                                    isActive('/rotation-game') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                                }`}
                                                onClick={toggleMenu}
                                            >
                                                <RotateCw className="w-5 h-5 mr-3" />
                                                Döndürme Oyunu
                                            </Link>
                                            <Link
                                                to="/visual-encoder"
                                                className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                                    isActive('/visual-encoder') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                                }`}
                                                onClick={toggleMenu}
                                            >
                                                <KeyRound className="w-5 h-5 mr-3" />
                                                Şifreleme
                                            </Link>
                                            <Link
                                                to="/puzzle-creator"
                                                className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                                    isActive('/puzzle-creator') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                                }`}
                                                onClick={toggleMenu}
                                            >
                                                <Puzzle className="w-5 h-5 mr-3" />
                                                Bulmaca Oluştur
                                            </Link>
                                            <Link
                                                to="/create-pdf"
                                                className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                                    isActive('/create-pdf') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                                }`}
                                                onClick={toggleMenu}
                                            >
                                                <FileText className="w-5 h-5 mr-3" />
                                                PDF Oluştur
                                            </Link>
                                            <Link
                                                to="/memory-game"
                                                className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                                    isActive('/memory-game') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                                }`}
                                                onClick={toggleMenu}
                                            >
                                                <Brain className="w-5 h-5 mr-3" />
                                                Hafıza Oyunu
                                            </Link>
                                        </div>
                                    </div>
                                    <Link
                                        to="/profile"
                                        className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                            isActive('/profile') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                        }`}
                                        onClick={toggleMenu}
                                    >
                                        Profil
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            toggleMenu();
                                        }}
                                        className="w-full text-left py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200"
                                    >
                                        Çıkış Yap
                                    </button>
                                </>
                            )}
                            {!user && (
                                <>
                                    <Link
                                        to="/login"
                                        className="block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200"
                                        onClick={toggleMenu}
                                    >
                                        Giriş Yap
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="block py-3 text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
                                        onClick={toggleMenu}
                                    >
                                        Kayıt Ol
                                    </Link>
                                </>
                            )}
                            <Link
                                to="/blog"
                                className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                    isActive('/blog') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                }`}
                                onClick={toggleMenu}
                            >
                                Blog
                            </Link>
                            <Link
                                to="/contact"
                                className={`block py-3 text-lg font-semibold rounded-lg hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-200 ${
                                    isActive('/contact') ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                                }`}
                                onClick={toggleMenu}
                            >
                                İletişim
                            </Link>
                        </div>
                    </div>
                </div>
            </Transition>
        </nav>
    );
}
