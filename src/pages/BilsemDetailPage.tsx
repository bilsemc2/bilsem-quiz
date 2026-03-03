import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, Phone, Globe, Building2, Loader2, ChevronLeft,
    Copy, CheckCircle, ExternalLink, Printer, Navigation
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';

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

const BilsemDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [kurum, setKurum] = useState<BilsemKurum | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => { if (slug) fetchKurum(slug); }, [slug]);

    const fetchKurum = async (slug: string) => {
        try {
            const { data, error } = await supabase.from('bilsem_kurumlari').select('*').eq('slug', slug).maybeSingle();
            if (error) throw error;
            if (!data) { toast.error('BİLSEM bulunamadı'); navigate('/bilsem-rehberi'); return; }
            setKurum(data);
        } catch (error) {
            console.error('BİLSEM yüklenirken hata:', error);
            toast.error('BİLSEM bilgileri yüklenemedi');
            navigate('/bilsem-rehberi');
        } finally { setLoading(false); }
    };

    const copyAddress = async () => {
        if (!kurum) return;
        try {
            await navigator.clipboard.writeText(kurum.adres);
            setCopied(true); toast.success('Adres kopyalandı');
            setTimeout(() => setCopied(false), 2000);
        } catch { toast.error('Kopyalanamadı'); }
    };

    const openInMaps = () => {
        if (!kurum) return;
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(kurum.adres)}`, '_blank');
    };

    const structuredData = kurum ? {
        "@context": "https://schema.org", "@type": "EducationalOrganization",
        "name": kurum.kurum_adi,
        "description": `${kurum.il_adi} ${kurum.ilce_adi} BİLSEM - Bilim ve Sanat Merkezi`,
        "address": { "@type": "PostalAddress", "streetAddress": kurum.adres, "addressLocality": kurum.ilce_adi, "addressRegion": kurum.il_adi, "addressCountry": "TR" },
        "telephone": kurum.telefon_no || undefined,
        "faxNumber": kurum.fax_no || undefined,
        "url": kurum.web_adres ? `https://${kurum.web_adres}` : undefined,
        "sameAs": kurum.web_adres ? `https://${kurum.web_adres}` : undefined
    } : null;

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
            <div className="bg-cyber-emerald/10 border-2 border-cyber-emerald/20 rounded-2xl p-6"><Loader2 className="w-12 h-12 text-cyber-emerald animate-spin" /></div>
        </div>
    );

    if (!kurum) return null;

    return (
        <>
            <Helmet>
                <title>{kurum.kurum_adi} - Adres ve İletişim | BİLSEM Rehberi</title>
                <meta name="description" content={`${kurum.kurum_adi} adresi, telefon numarası ve iletişim bilgileri. ${kurum.ilce_adi}, ${kurum.il_adi} BİLSEM.`} />
                <meta name="keywords" content={`${kurum.kurum_adi}, ${kurum.il_adi} BİLSEM, ${kurum.ilce_adi} BİLSEM, BİLSEM adresi, BİLSEM telefon`} />
                <link rel="canonical" href={`https://bilsemc2.com/bilsem-rehberi/${kurum.slug}`} />
                <meta property="og:type" content="place" />
                <meta property="og:title" content={`${kurum.kurum_adi} - İletişim Bilgileri`} />
                <meta property="og:description" content={`${kurum.il_adi} ${kurum.ilce_adi} BİLSEM adresi ve telefon numarası.`} />
                <meta property="og:url" content={`https://bilsemc2.com/bilsem-rehberi/${kurum.slug}`} />
                <meta property="og:site_name" content="BilsemC2" />
                <meta property="og:locale" content="tr_TR" />
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content={`${kurum.kurum_adi}`} />
                <meta name="twitter:description" content={`${kurum.il_adi} BİLSEM iletişim bilgileri`} />
                <meta name="robots" content="index, follow" />
                <meta name="geo.region" content="TR" />
                <meta name="geo.placename" content={`${kurum.ilce_adi}, ${kurum.il_adi}`} />
                {structuredData && (<script type="application/ld+json">{JSON.stringify(structuredData)}</script>)}
            </Helmet>

            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 transition-colors duration-300 pt-24 pb-12 px-4 sm:px-6">
                <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                <div className="max-w-4xl mx-auto relative z-10">
                    {/* Back Link */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
                        <Link to="/bilsem-rehberi" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border-2 border-black/10 text-black dark:text-white font-nunito font-extrabold uppercase rounded-xl hover:-translate-y-1 shadow-neo-xs transition-all tracking-widest text-sm">
                            <ChevronLeft size={18} className="text-cyber-pink" /> Tüm BİLSEM'ler
                        </Link>
                    </motion.div>

                    {/* Main Card */}
                    <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl shadow-neo-lg overflow-hidden">
                        {/* Header */}
                        <div className="p-6 sm:p-8 border-b-2 border-black/10 bg-cyber-gold/10">
                            <div className="flex flex-col sm:flex-row items-start gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-cyber-gold/20 border-2 border-cyber-gold/30 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-8 h-8 text-cyber-gold" />
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-2xl sm:text-3xl font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight mb-4">{kurum.kurum_adi}</h1>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="px-3 py-1.5 bg-cyber-emerald/10 border border-cyber-emerald/20 rounded-xl text-cyber-emerald font-extrabold uppercase text-xs">{kurum.il_adi}</span>
                                        <span className="px-3 py-1.5 bg-cyber-pink/10 border border-cyber-pink/20 rounded-xl text-cyber-pink font-extrabold uppercase text-xs">{kurum.ilce_adi}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 sm:p-8 space-y-8">
                            {/* Address */}
                            <div className="space-y-4">
                                <h2 className="flex items-center gap-3 text-base font-nunito font-extrabold text-black dark:text-white uppercase tracking-widest">
                                    <div className="w-1.5 h-6 bg-cyber-blue rounded-full" /> <MapPin className="w-4 h-4 text-cyber-blue" /> Adres
                                </h2>
                                <div className="bg-gray-50 dark:bg-slate-700/50 border-2 border-black/5 rounded-2xl p-6">
                                    <p className="text-black dark:text-white font-bold leading-relaxed mb-6 text-lg">{kurum.adres}</p>
                                    <div className="flex flex-wrap gap-3">
                                        <button onClick={copyAddress} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl font-extrabold uppercase text-black dark:text-white hover:-translate-y-1 shadow-neo-xs transition-all text-xs">
                                            {copied ? <CheckCircle className="w-4 h-4 text-cyber-emerald" /> : <Copy className="w-4 h-4" />}
                                            {copied ? 'Kopyalandı' : 'Adresi Kopyala'}
                                        </button>
                                        <button onClick={openInMaps} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border-2 border-red-500/20 rounded-xl font-extrabold uppercase text-red-600 hover:-translate-y-1 transition-all text-xs">
                                            <Navigation className="w-4 h-4" /> Haritada Göster
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                {kurum.telefon_no && (
                                    <div className="bg-cyber-emerald/10 border-2 border-cyber-emerald/20 rounded-2xl p-6 hover:-translate-y-1 transition-transform">
                                        <h3 className="flex items-center gap-2 text-xs font-extrabold text-cyber-emerald uppercase mb-3"><Phone className="w-4 h-4" /> Telefon</h3>
                                        <a href={`tel:${kurum.telefon_no.replace(/\D/g, '')}`} className="text-black dark:text-white font-extrabold text-lg hover:text-cyber-emerald transition-colors">{kurum.telefon_no}</a>
                                    </div>
                                )}
                                {kurum.fax_no && (
                                    <div className="bg-gray-50 dark:bg-slate-700/50 border-2 border-black/5 rounded-2xl p-6">
                                        <h3 className="flex items-center gap-2 text-xs font-extrabold text-slate-400 uppercase mb-3"><Printer className="w-4 h-4" /> Faks</h3>
                                        <p className="text-black dark:text-white font-extrabold text-lg">{kurum.fax_no}</p>
                                    </div>
                                )}
                            </div>

                            {/* Website */}
                            {kurum.web_adres && (
                                <div className="bg-cyber-blue/10 border-2 border-cyber-blue/20 rounded-2xl p-6 hover:-translate-y-1 transition-transform">
                                    <h3 className="flex items-center gap-2 text-xs font-extrabold text-cyber-blue uppercase mb-3"><Globe className="w-4 h-4" /> Web Sitesi</h3>
                                    <a href={`https://${kurum.web_adres}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-cyber-blue font-extrabold text-lg hover:text-black dark:hover:text-white transition-colors break-all">
                                        {kurum.web_adres} <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </motion.article>

                    {/* CTA */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="mt-12 p-8 bg-cyber-pink/10 border-3 border-cyber-pink/20 rounded-2xl text-center">
                        <h3 className="text-2xl font-nunito font-extrabold text-black dark:text-white mb-3 uppercase tracking-tight">BİLSEM Sınavına Hazırlanın</h3>
                        <p className="text-slate-500 font-bold text-base mb-6">Çocuğunuzun yeteneklerini keşfedin ve geliştirin</p>
                        <Link to="/atolyeler" className="inline-flex items-center gap-3 px-8 py-4 bg-cyber-gold border-3 border-black/10 text-black font-nunito font-extrabold uppercase tracking-widest rounded-xl hover:-translate-y-1 shadow-neo-sm transition-all text-base">
                            Atölyeleri Keşfet
                        </Link>
                    </motion.div>

                    {/* Back to List */}
                    <div className="mt-12 text-center pb-12">
                        <Link to="/bilsem-rehberi" className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-black/10 text-black dark:text-white font-nunito font-extrabold uppercase rounded-xl hover:-translate-y-1 shadow-neo-xs transition-all tracking-widest text-sm">
                            <ChevronLeft size={18} className="text-cyber-blue" /> Tüm BİLSEM'ler
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BilsemDetailPage;
