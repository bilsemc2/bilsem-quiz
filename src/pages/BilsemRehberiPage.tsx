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

    const iller = useMemo(() => {
        const ilSet = new Set(kurumlar.map(k => k.il_adi));
        return Array.from(ilSet).sort((a, b) => a.localeCompare(b, 'tr'));
    }, [kurumlar]);

    const ilceler = useMemo(() => {
        if (!selectedIl) return [];
        const ilceSet = new Set(kurumlar.filter(k => k.il_adi === selectedIl).map(k => k.ilce_adi));
        return Array.from(ilceSet).sort((a, b) => a.localeCompare(b, 'tr'));
    }, [kurumlar, selectedIl]);

    const turkishLower = (str: string) => str.toLocaleLowerCase('tr-TR');

    const filteredKurumlar = useMemo(() => {
        const query = turkishLower(searchQuery);
        return kurumlar.filter(k => {
            const matchesSearch = !searchQuery || turkishLower(k.kurum_adi).includes(query) || turkishLower(k.il_adi).includes(query) || turkishLower(k.ilce_adi).includes(query);
            return matchesSearch && (!selectedIl || k.il_adi === selectedIl) && (!selectedIlce || k.ilce_adi === selectedIlce);
        });
    }, [kurumlar, searchQuery, selectedIl, selectedIlce]);

    useEffect(() => { fetchKurumlar(); }, []);

    const fetchKurumlar = async () => {
        try {
            const { data, error } = await supabase.from('bilsem_kurumlari').select('*').order('il_adi', { ascending: true });
            if (error) throw error;
            setKurumlar(data || []);
        } catch (error) { console.error('BİLSEM kurumları yüklenirken hata:', error); }
        finally { setLoading(false); }
    };

    const handleIlChange = (il: string) => { setSelectedIl(il); setSelectedIlce(''); };
    const clearFilters = () => { setSearchQuery(''); setSelectedIl(''); setSelectedIlce(''); };
    const hasActiveFilters = searchQuery || selectedIl || selectedIlce;

    const structuredData = {
        "@context": "https://schema.org", "@type": "ItemList",
        "name": "Türkiye BİLSEM Kurumları Rehberi",
        "description": "Türkiye'deki tüm Bilim ve Sanat Merkezlerinin (BİLSEM) listesi, adresleri ve iletişim bilgileri",
        "numberOfItems": filteredKurumlar.length,
        "itemListElement": filteredKurumlar.slice(0, 10).map((k, idx) => ({
            "@type": "ListItem", "position": idx + 1,
            "item": {
                "@type": "EducationalOrganization", "name": k.kurum_adi,
                "address": { "@type": "PostalAddress", "addressLocality": k.ilce_adi, "addressRegion": k.il_adi, "addressCountry": "TR", "streetAddress": k.adres },
                "telephone": k.telefon_no || undefined,
                "url": k.web_adres ? `https://${k.web_adres}` : undefined
            }
        }))
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
            <div className="bg-cyber-emerald/10 border-2 border-cyber-emerald/20 rounded-2xl p-6"><Loader2 className="w-12 h-12 text-cyber-emerald animate-spin" /></div>
        </div>
    );

    return (
        <>
            <Helmet>
                <title>BİLSEM Rehberi - Türkiye'deki Tüm Bilim ve Sanat Merkezleri | BilsemC2</title>
                <meta name="description" content={`Türkiye'deki ${kurumlar.length} BİLSEM kurumunun adresi, telefonu ve iletişim bilgileri. İl ve ilçeye göre BİLSEM arayın.`} />
                <meta name="keywords" content="BİLSEM, Bilim Sanat Merkezi, BİLSEM adresleri, BİLSEM telefon, BİLSEM rehberi, üstün yetenekli, BİLSEM listesi, BİLSEM iletişim" />
                <link rel="canonical" href="https://bilsemc2.com/bilsem-rehberi" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="BİLSEM Rehberi - Türkiye'deki Tüm BİLSEM'ler" />
                <meta property="og:description" content={`Türkiye genelinde ${kurumlar.length} BİLSEM kurumunun adresi ve iletişim bilgileri. İl ve ilçeye göre arayın.`} />
                <meta property="og:url" content="https://bilsemc2.com/bilsem-rehberi" />
                <meta property="og:site_name" content="BilsemC2" />
                <meta property="og:locale" content="tr_TR" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="BİLSEM Rehberi - Türkiye'deki Tüm BİLSEM'ler" />
                <meta name="twitter:description" content={`${kurumlar.length} BİLSEM kurumunun adresi ve telefonu. İl/ilçeye göre arayın.`} />
                <meta name="robots" content="index, follow" />
                <meta name="author" content="BilsemC2" />
                <meta name="geo.region" content="TR" />
                <meta name="geo.placename" content="Türkiye" />
                <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
            </Helmet>

            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 transition-colors duration-300 pt-24 pb-12 px-4 sm:px-6">
                <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
                        <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border-2 border-black/10 text-black dark:text-white font-nunito font-extrabold uppercase rounded-xl hover:-translate-y-1 shadow-neo-xs transition-all mb-8 tracking-widest text-sm">
                            <ChevronLeft size={18} className="text-cyber-pink" /> Ana Sayfa
                        </Link>

                        <h1 className="text-4xl lg:text-6xl font-nunito font-extrabold text-black dark:text-white mb-6 uppercase tracking-tight">
                            <span className="text-cyber-blue">BİLSEM</span> Rehberi
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg font-bold max-w-2xl mx-auto leading-relaxed">
                            Türkiye'nin <span className="inline-block px-2 py-0.5 bg-cyber-pink/10 text-cyber-pink border border-cyber-pink/20 rounded-lg font-extrabold">{kurumlar.length}</span> Bilim ve Sanat Merkezi'nin adresi ve iletişim bilgileri
                        </p>
                    </motion.div>

                    {/* Search & Filters */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8 space-y-4">
                        <div className="relative max-w-2xl mx-auto mb-6">
                            <div className="relative flex items-center">
                                <Search className="absolute left-5 w-5 h-5 text-slate-400 pointer-events-none z-10" />
                                <input type="text" placeholder="BİLSEM adı, il veya ilçe ara..."
                                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-14 pr-16 py-4 bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl text-black dark:text-white placeholder:text-slate-400 outline-none focus:-translate-y-1 shadow-neo-sm focus:border-cyber-blue/30 transition-all font-nunito font-extrabold text-sm"
                                />
                                <button onClick={() => setShowFilters(!showFilters)}
                                    className={`absolute right-3 p-2.5 border-2 rounded-xl hover:-translate-y-0.5 transition-all z-10 ${showFilters ? 'bg-cyber-pink/10 text-cyber-pink border-cyber-pink/20' : 'bg-cyber-gold/10 text-cyber-gold border-cyber-gold/20'}`}
                                    title="Filtreleme Seçenekleri">
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {showFilters && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-wrap gap-3 justify-center">
                                <div className="relative">
                                    <select value={selectedIl} onChange={(e) => handleIlChange(e.target.value)}
                                        className="appearance-none px-5 py-3 pr-10 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl text-black dark:text-white font-nunito font-extrabold uppercase text-xs outline-none focus:-translate-y-0.5 shadow-neo-xs transition-all cursor-pointer min-w-[180px]">
                                        <option value="">Tüm İller ({iller.length})</option>
                                        {iller.map(il => <option key={il} value={il}>{il}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="relative">
                                    <select value={selectedIlce} onChange={(e) => setSelectedIlce(e.target.value)} disabled={!selectedIl}
                                        className="appearance-none px-5 py-3 pr-10 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl text-black dark:text-white font-nunito font-extrabold uppercase text-xs outline-none focus:-translate-y-0.5 shadow-neo-xs transition-all cursor-pointer min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed">
                                        <option value="">Tüm İlçeler {ilceler.length > 0 && `(${ilceler.length})`}</option>
                                        {ilceler.map(ilce => <option key={ilce} value={ilce}>{ilce}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="flex items-center gap-2 px-5 py-3 bg-red-500/10 border-2 border-red-500/20 rounded-xl text-red-600 font-extrabold uppercase text-xs hover:-translate-y-0.5 transition-all">
                                        <X className="w-4 h-4" /> Temizle
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Results Count */}
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-black/5 dark:border-white/5">
                        <h2 className="text-base font-nunito font-extrabold text-black dark:text-white uppercase tracking-wider flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-cyber-emerald rounded-full" />
                            {hasActiveFilters ? 'Arama Sonuçları' : 'Tüm BİLSEMler'}
                        </h2>
                        <span className="bg-black/5 dark:bg-white/5 text-black dark:text-white px-4 py-2 font-extrabold uppercase rounded-xl text-xs">
                            {filteredKurumlar.length} Kurum
                        </span>
                    </div>

                    {/* Kurumlar Grid */}
                    {filteredKurumlar.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredKurumlar.map((kurum, idx) => (
                                <motion.article key={kurum.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx * 0.03, 0.3) }}>
                                    <Link to={`/bilsem-rehberi/${kurum.slug}`}
                                        className="group block h-full bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden shadow-neo-sm hover:shadow-neo-md">
                                        {/* Header */}
                                        <div className="p-5 border-b border-black/5 bg-cyber-gold/5 group-hover:bg-cyber-emerald/5 transition-colors duration-300">
                                            <div className="flex items-start gap-3">
                                                <div className="w-11 h-11 bg-cyber-gold/10 border-2 border-cyber-gold/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-cyber-emerald/10 group-hover:border-cyber-emerald/20 transition-colors">
                                                    <Building2 className="w-5 h-5 text-cyber-gold group-hover:text-cyber-emerald transition-colors" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight text-sm leading-tight line-clamp-2">{kurum.kurum_adi}</h3>
                                                    <div className="flex items-center gap-1.5 mt-1.5 text-slate-400 font-bold uppercase text-[10px]">
                                                        <MapPin className="w-3 h-3" />
                                                        <span>{kurum.ilce_adi}, {kurum.il_adi}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div className="p-5 space-y-3">
                                            <p className="text-slate-500 font-bold text-xs line-clamp-2 leading-relaxed">{kurum.adres}</p>
                                            <div className="flex flex-wrap gap-2 pt-3 border-t border-dashed border-black/5">
                                                {kurum.telefon_no && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-slate-700 border border-black/5 rounded-lg text-[10px] font-extrabold text-slate-500 uppercase">
                                                        <Phone className="w-3 h-3 text-cyber-blue" /> {kurum.telefon_no}
                                                    </span>
                                                )}
                                                {kurum.web_adres && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-slate-700 border border-black/5 rounded-lg text-[10px] font-extrabold text-slate-500 uppercase">
                                                        <Globe className="w-3 h-3 text-cyber-pink" /> Web
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </motion.article>
                            ))}
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                            <div className="w-20 h-20 bg-cyber-pink/10 border-2 border-cyber-pink/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
                                <Map className="w-10 h-10 text-cyber-pink" />
                            </div>
                            <h3 className="text-2xl font-nunito font-extrabold text-black dark:text-white mb-3 uppercase">Sonuç Bulunamadı</h3>
                            <p className="text-slate-500 font-bold text-base mb-8">Arama kriterlerinize uygun BİLSEM bulunamadı.</p>
                            <button onClick={clearFilters} className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-emerald/10 border-2 border-cyber-emerald/20 text-cyber-emerald font-extrabold uppercase rounded-xl hover:-translate-y-1 transition-all text-sm">
                                <X className="w-5 h-5" /> Filtreleri Temizle
                            </button>
                        </motion.div>
                    )}

                    {/* SEO Footer Text */}
                    <div className="mt-20 pt-10 border-t border-dashed border-black/5 dark:border-white/5 text-center text-slate-400 font-bold text-xs max-w-4xl mx-auto leading-loose">
                        <p>Bu sayfada Türkiye'nin {iller.length} ilindeki toplam {kurumlar.length} BİLSEM (Bilim ve Sanat Merkezi) kurumunun güncel adres ve iletişim bilgilerini bulabilirsiniz. Üstün yetenekli öğrencilerin eğitimi için kurulan BİLSEM'lerin listesine il ve ilçeye göre kolayca ulaşabilirsiniz.</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BilsemRehberiPage;
