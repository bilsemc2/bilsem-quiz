import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Search, MapPin, Phone, Globe, ChevronDown, Building2,
    Loader2, ChevronLeft, Filter, X, Map
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface BilsemKurum {
    id: string;
    il_adi: string;
    ilce_adi: string;
    kurum_adi: string;
    kurum_tur_adi: string;
    adres: string;
    telefon_no: string;
    fax_no: string;
    web_adres: string;
    slug: string;
}

const BilsemRehberiPage: React.FC = () => {
    const [kurumlar, setKurumlar] = useState<BilsemKurum[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIl, setSelectedIl] = useState('');
    const [selectedIlce, setSelectedIlce] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // İl listesi
    const iller = useMemo(() => {
        const ilSet = new Set(kurumlar.map(k => k.il_adi));
        return Array.from(ilSet).sort((a, b) => a.localeCompare(b, 'tr'));
    }, [kurumlar]);

    // Seçilen ile göre ilçeler
    const ilceler = useMemo(() => {
        if (!selectedIl) return [];
        const ilceSet = new Set(
            kurumlar
                .filter(k => k.il_adi === selectedIl)
                .map(k => k.ilce_adi)
        );
        return Array.from(ilceSet).sort((a, b) => a.localeCompare(b, 'tr'));
    }, [kurumlar, selectedIl]);

    // Filtrelenmiş kurumlar
    // Türkçe karakterler için normalize fonksiyonu
    const turkishLower = (str: string) => str.toLocaleLowerCase('tr-TR');

    const filteredKurumlar = useMemo(() => {
        const query = turkishLower(searchQuery);
        return kurumlar.filter(k => {
            const matchesSearch = !searchQuery ||
                turkishLower(k.kurum_adi).includes(query) ||
                turkishLower(k.il_adi).includes(query) ||
                turkishLower(k.ilce_adi).includes(query);

            const matchesIl = !selectedIl || k.il_adi === selectedIl;
            const matchesIlce = !selectedIlce || k.ilce_adi === selectedIlce;

            return matchesSearch && matchesIl && matchesIlce;
        });
    }, [kurumlar, searchQuery, selectedIl, selectedIlce]);

    useEffect(() => {
        fetchKurumlar();
    }, []);

    const fetchKurumlar = async () => {
        try {
            const { data, error } = await supabase
                .from('bilsem_kurumlari')
                .select('*')
                .order('il_adi', { ascending: true });

            if (error) throw error;
            setKurumlar(data || []);
        } catch (error) {
            console.error('BİLSEM kurumları yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleIlChange = (il: string) => {
        setSelectedIl(il);
        setSelectedIlce(''); // İl değişince ilçe sıfırla
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedIl('');
        setSelectedIlce('');
    };

    const hasActiveFilters = searchQuery || selectedIl || selectedIlce;

    // JSON-LD Structured Data
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Türkiye BİLSEM Kurumları Rehberi",
        "description": "Türkiye'deki tüm Bilim ve Sanat Merkezlerinin (BİLSEM) listesi, adresleri ve iletişim bilgileri",
        "numberOfItems": filteredKurumlar.length,
        "itemListElement": filteredKurumlar.slice(0, 10).map((k, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "item": {
                "@type": "EducationalOrganization",
                "name": k.kurum_adi,
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": k.ilce_adi,
                    "addressRegion": k.il_adi,
                    "addressCountry": "TR",
                    "streetAddress": k.adres
                },
                "telephone": k.telefon_no || undefined,
                "url": k.web_adres ? `https://${k.web_adres}` : undefined
            }
        }))
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>BİLSEM Rehberi - Türkiye'deki Tüm Bilim ve Sanat Merkezleri | BilsemC2</title>
                <meta
                    name="description"
                    content={`Türkiye'deki ${kurumlar.length} BİLSEM kurumunun adresi, telefonu ve iletişim bilgileri. İl ve ilçeye göre BİLSEM arayın.`}
                />
                <meta name="keywords" content="BİLSEM, Bilim Sanat Merkezi, BİLSEM adresleri, BİLSEM telefon, BİLSEM rehberi, üstün yetenekli, BİLSEM listesi, BİLSEM iletişim" />
                <link rel="canonical" href="https://bilsemc2.com/bilsem-rehberi" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:title" content="BİLSEM Rehberi - Türkiye'deki Tüm BİLSEM'ler" />
                <meta property="og:description" content={`Türkiye genelinde ${kurumlar.length} BİLSEM kurumunun adresi ve iletişim bilgileri. İl ve ilçeye göre arayın.`} />
                <meta property="og:url" content="https://bilsemc2.com/bilsem-rehberi" />
                <meta property="og:site_name" content="BilsemC2" />
                <meta property="og:locale" content="tr_TR" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="BİLSEM Rehberi - Türkiye'deki Tüm BİLSEM'ler" />
                <meta name="twitter:description" content={`${kurumlar.length} BİLSEM kurumunun adresi ve telefonu. İl/ilçeye göre arayın.`} />

                {/* Additional SEO */}
                <meta name="robots" content="index, follow" />
                <meta name="author" content="BilsemC2" />
                <meta name="geo.region" content="TR" />
                <meta name="geo.placename" content="Türkiye" />

                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pt-24 pb-12 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors mb-6 uppercase text-[10px] tracking-[0.2em]"
                        >
                            <ChevronLeft size={14} />
                            Ana Sayfa
                        </Link>

                        <h1 className="text-4xl lg:text-6xl font-black text-white mb-4 tracking-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                                BİLSEM
                            </span>{' '}
                            Rehberi
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Türkiye'deki <span className="text-indigo-400 font-bold">{kurumlar.length}</span> Bilim ve Sanat Merkezi'nin adresi ve iletişim bilgileri
                        </p>
                    </motion.div>

                    {/* Search & Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8 space-y-4"
                    >
                        {/* Search Bar */}
                        <div className="relative max-w-2xl mx-auto">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl" />
                            <div className="relative flex items-center">
                                <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="BİLSEM adı, il veya ilçe ara..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 transition-all"
                                />
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`absolute right-4 p-2 rounded-xl transition-colors ${showFilters ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <Filter className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Filter Dropdowns */}
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex flex-wrap gap-4 justify-center"
                            >
                                {/* İl Dropdown */}
                                <div className="relative">
                                    <select
                                        value={selectedIl}
                                        onChange={(e) => handleIlChange(e.target.value)}
                                        className="appearance-none px-5 py-3 pr-10 bg-slate-800/80 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500/50 cursor-pointer min-w-[180px]"
                                    >
                                        <option value="">Tüm İller ({iller.length})</option>
                                        {iller.map(il => (
                                            <option key={il} value={il}>{il}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>

                                {/* İlçe Dropdown */}
                                <div className="relative">
                                    <select
                                        value={selectedIlce}
                                        onChange={(e) => setSelectedIlce(e.target.value)}
                                        disabled={!selectedIl}
                                        className="appearance-none px-5 py-3 pr-10 bg-slate-800/80 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500/50 cursor-pointer min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Tüm İlçeler {ilceler.length > 0 && `(${ilceler.length})`}</option>
                                        {ilceler.map(ilce => (
                                            <option key={ilce} value={ilce}>{ilce}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>

                                {/* Clear Filters */}
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/30 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        Temizle
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Results Count */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                            {hasActiveFilters ? 'Arama Sonuçları' : 'Tüm BİLSEMler'}
                        </h2>
                        <span className="text-slate-500 text-sm font-medium">
                            {filteredKurumlar.length} kurum
                        </span>
                    </div>

                    {/* Kurumlar Grid */}
                    {filteredKurumlar.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredKurumlar.map((kurum, idx) => (
                                <motion.article
                                    key={kurum.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                                >
                                    <Link
                                        to={`/bilsem-rehberi/${kurum.slug}`}
                                        className="group block h-full bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all duration-300 overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
                                    >
                                        {/* Header */}
                                        <div className="p-5 border-b border-white/5">
                                            <div className="flex items-start gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                                    <Building2 className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2 text-sm leading-tight">
                                                        {kurum.kurum_adi}
                                                    </h3>
                                                    <div className="flex items-center gap-1 mt-1 text-slate-500 text-xs">
                                                        <MapPin className="w-3 h-3" />
                                                        <span>{kurum.ilce_adi}, {kurum.il_adi}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div className="p-5 space-y-3">
                                            {/* Adres */}
                                            <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                                                {kurum.adres}
                                            </p>

                                            {/* Contact Info */}
                                            <div className="flex flex-wrap gap-2">
                                                {kurum.telefon_no && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-lg text-[10px] text-slate-400">
                                                        <Phone className="w-3 h-3" />
                                                        {kurum.telefon_no}
                                                    </span>
                                                )}
                                                {kurum.web_adres && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-lg text-[10px] text-indigo-400">
                                                        <Globe className="w-3 h-3" />
                                                        Web
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </motion.article>
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16"
                        >
                            <div className="w-20 h-20 bg-slate-800/50 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Map className="w-10 h-10 text-slate-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">
                                Sonuç bulunamadı
                            </h3>
                            <p className="text-slate-400 mb-6">
                                Arama kriterlerinize uygun BİLSEM bulunamadı.
                            </p>
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors"
                            >
                                Filtreleri Temizle
                            </button>
                        </motion.div>
                    )}

                    {/* SEO Footer Text */}
                    <div className="mt-16 text-center text-slate-500 text-sm max-w-3xl mx-auto">
                        <p>
                            Bu sayfada Türkiye'nin {iller.length} ilindeki toplam {kurumlar.length} BİLSEM (Bilim ve Sanat Merkezi)
                            kurumunun güncel adres ve iletişim bilgilerini bulabilirsiniz. Üstün yetenekli öğrencilerin eğitimi
                            için kurulan BİLSEM'lerin listesine il ve ilçeye göre kolayca ulaşabilirsiniz.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BilsemRehberiPage;
