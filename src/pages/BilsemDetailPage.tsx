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

    useEffect(() => {
        if (slug) {
            fetchKurum(slug);
        }
    }, [slug]);

    const fetchKurum = async (slug: string) => {
        try {
            const { data, error } = await supabase
                .from('bilsem_kurumlari')
                .select('*')
                .eq('slug', slug)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                toast.error('BİLSEM bulunamadı');
                navigate('/bilsem-rehberi');
                return;
            }

            setKurum(data);
        } catch (error) {
            console.error('BİLSEM yüklenirken hata:', error);
            toast.error('BİLSEM bilgileri yüklenemedi');
            navigate('/bilsem-rehberi');
        } finally {
            setLoading(false);
        }
    };

    const copyAddress = async () => {
        if (!kurum) return;
        try {
            await navigator.clipboard.writeText(kurum.adres);
            setCopied(true);
            toast.success('Adres kopyalandı');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Kopyalanamadı');
        }
    };

    const openInMaps = () => {
        if (!kurum) return;
        const query = encodeURIComponent(kurum.adres);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };

    // JSON-LD Structured Data
    const structuredData = kurum ? {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": kurum.kurum_adi,
        "description": `${kurum.il_adi} ${kurum.ilce_adi} BİLSEM - Bilim ve Sanat Merkezi`,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": kurum.adres,
            "addressLocality": kurum.ilce_adi,
            "addressRegion": kurum.il_adi,
            "addressCountry": "TR"
        },
        "telephone": kurum.telefon_no || undefined,
        "faxNumber": kurum.fax_no || undefined,
        "url": kurum.web_adres ? `https://${kurum.web_adres}` : undefined,
        "sameAs": kurum.web_adres ? `https://${kurum.web_adres}` : undefined
    } : null;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            </div>
        );
    }

    if (!kurum) return null;

    return (
        <>
            <Helmet>
                <title>{kurum.kurum_adi} - Adres ve İletişim | BİLSEM Rehberi</title>
                <meta
                    name="description"
                    content={`${kurum.kurum_adi} adresi, telefon numarası ve iletişim bilgileri. ${kurum.ilce_adi}, ${kurum.il_adi} BİLSEM.`}
                />
                <meta name="keywords" content={`${kurum.kurum_adi}, ${kurum.il_adi} BİLSEM, ${kurum.ilce_adi} BİLSEM, BİLSEM adresi, BİLSEM telefon`} />
                <link rel="canonical" href={`https://bilsemc2.com/bilsem-rehberi/${kurum.slug}`} />

                {/* Open Graph */}
                <meta property="og:type" content="place" />
                <meta property="og:title" content={`${kurum.kurum_adi} - İletişim Bilgileri`} />
                <meta property="og:description" content={`${kurum.il_adi} ${kurum.ilce_adi} BİLSEM adresi ve telefon numarası.`} />
                <meta property="og:url" content={`https://bilsemc2.com/bilsem-rehberi/${kurum.slug}`} />
                <meta property="og:site_name" content="BilsemC2" />
                <meta property="og:locale" content="tr_TR" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content={`${kurum.kurum_adi}`} />
                <meta name="twitter:description" content={`${kurum.il_adi} BİLSEM iletişim bilgileri`} />

                {/* Additional SEO */}
                <meta name="robots" content="index, follow" />
                <meta name="geo.region" content="TR" />
                <meta name="geo.placename" content={`${kurum.ilce_adi}, ${kurum.il_adi}`} />

                {structuredData && (
                    <script type="application/ld+json">
                        {JSON.stringify(structuredData)}
                    </script>
                )}
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pt-24 pb-12 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Back Link */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-8"
                    >
                        <Link
                            to="/bilsem-rehberi"
                            className="inline-flex items-center gap-2 text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Tüm BİLSEM'ler
                        </Link>
                    </motion.div>

                    {/* Main Card */}
                    <motion.article
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 sm:p-8 border-b border-white/5">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
                                        {kurum.kurum_adi}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-400 text-sm font-medium">
                                            {kurum.il_adi}
                                        </span>
                                        <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-400 text-sm font-medium">
                                            {kurum.ilce_adi}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 sm:p-8 space-y-6">
                            {/* Address */}
                            <div className="space-y-3">
                                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
                                    <MapPin className="w-4 h-4" />
                                    Adres
                                </h2>
                                <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                                    <p className="text-white leading-relaxed mb-4">
                                        {kurum.adres}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={copyAddress}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                                        >
                                            {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                            {copied ? 'Kopyalandı' : 'Adresi Kopyala'}
                                        </button>
                                        <button
                                            onClick={openInMaps}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-sm text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                                        >
                                            <Navigation className="w-4 h-4" />
                                            Haritada Göster
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                {/* Phone */}
                                {kurum.telefon_no && (
                                    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-2">
                                            <Phone className="w-4 h-4" />
                                            Telefon
                                        </h3>
                                        <a
                                            href={`tel:${kurum.telefon_no.replace(/\D/g, '')}`}
                                            className="text-white font-medium hover:text-indigo-400 transition-colors"
                                        >
                                            {kurum.telefon_no}
                                        </a>
                                    </div>
                                )}

                                {/* Fax */}
                                {kurum.fax_no && (
                                    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-2">
                                            <Printer className="w-4 h-4" />
                                            Faks
                                        </h3>
                                        <p className="text-white font-medium">{kurum.fax_no}</p>
                                    </div>
                                )}
                            </div>

                            {/* Website */}
                            {kurum.web_adres && (
                                <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-2">
                                        <Globe className="w-4 h-4" />
                                        Web Sitesi
                                    </h3>
                                    <a
                                        href={`https://${kurum.web_adres}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
                                    >
                                        {kurum.web_adres}
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </motion.article>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-8 p-6 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-xl border border-white/10 rounded-2xl text-center"
                    >
                        <h3 className="text-xl font-bold text-white mb-2">
                            BİLSEM Sınavına Hazırlanın
                        </h3>
                        <p className="text-slate-300 mb-4">
                            Çocuğunuzun yeteneklerini keşfedin ve geliştirin
                        </p>
                        <Link
                            to="/atolyeler"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:scale-105 transition-transform"
                        >
                            Atölyeleri Keşfet
                        </Link>
                    </motion.div>

                    {/* Back to List */}
                    <div className="mt-8 text-center">
                        <Link
                            to="/bilsem-rehberi"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/50 border border-white/10 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Tüm BİLSEM'ler
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BilsemDetailPage;
