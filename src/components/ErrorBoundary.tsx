import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    isChunkError: boolean;
}

/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app
 * 
 * Special handling for chunk loading failures (deployment cache mismatch)
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null, isChunkError: false };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Check if this is a chunk loading error (common after deployment)
        const isChunkError = error.message?.includes('Failed to fetch dynamically imported module') ||
            error.message?.includes('Loading chunk') ||
            error.message?.includes('Loading CSS chunk') ||
            error.name === 'ChunkLoadError';

        return { hasError: true, error, isChunkError };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });

        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // Production: log error to Supabase
        if (!import.meta.env.DEV) {
            Promise.resolve(supabase.from('error_logs').insert({
                error_message: error.message,
                error_stack: error.stack?.substring(0, 2000),
                component_stack: errorInfo.componentStack?.substring(0, 2000),
                url: window.location.href,
                user_agent: navigator.userAgent,
                created_at: new Date().toISOString()
            })).catch(() => { }); // Fire-and-forget
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null, isChunkError: false });
    };

    handleHardRefresh = () => {
        // Clear cache and reload
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Special UI for chunk loading errors (deployment cache mismatch)
            if (this.state.isChunkError) {
                return (
                    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
                        {/* Animated Background Blobs */}
                        <div className="fixed inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
                            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                        </div>

                        <style>{`
                            @keyframes gummyFloat {
                                0%, 100% { transform: translateY(0); }
                                50% { transform: translateY(-12px); }
                            }
                            @keyframes spinSlow {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                            @keyframes fadeInUp {
                                from { opacity: 0; transform: translateY(20px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                        `}</style>

                        <div
                            className="relative z-10 max-w-md w-full rounded-3xl p-8 text-center"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                                boxShadow: 'inset 0 -4px 12px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.4)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                animation: 'fadeInUp 0.6s ease-out'
                            }}
                        >
                            {/* 3D Gummy Icon */}
                            <div
                                className="w-24 h-24 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.25), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(99,102,241,0.4)',
                                    animation: 'gummyFloat 2.5s ease-in-out infinite'
                                }}
                            >
                                <Download className="w-11 h-11 text-white drop-shadow-lg" />
                            </div>

                            {/* Update Message */}
                            <h1
                                className="text-2xl font-black mb-2"
                                style={{
                                    background: 'linear-gradient(135deg, #A5B4FC, #C4B5FD)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                            >
                                Yeni Güncelleme Mevcut! 🚀
                            </h1>
                            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                                Uygulama güncellendi. Yeni özellikleri görmek için<br />sayfayı yenileyin.
                            </p>

                            {/* 3D Gummy Refresh Button */}
                            <button
                                onClick={this.handleHardRefresh}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 text-white rounded-2xl font-bold text-lg transition-all active:scale-95"
                                style={{
                                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2), 0 8px 24px rgba(99,102,241,0.4)'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03) translateY(-2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
                            >
                                <RefreshCw className="w-5 h-5" />
                                Sayfayı Yenile
                            </button>

                            {/* Subtle Version Note */}
                            <p className="mt-6 text-slate-600 text-xs">
                                Bu mesaj, site güncellemesi sonrası otomatik gösterilir.
                            </p>
                        </div>
                    </div>
                );
            }

            // Default fallback UI for other errors
            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
                        {/* Error Icon */}
                        <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-red-400" />
                        </div>

                        {/* Error Message */}
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Bir Şeyler Ters Gitti
                        </h1>
                        <p className="text-slate-400 mb-6">
                            Beklenmedik bir hata oluştu. Endişelenme, bu bizim hatamız!
                        </p>

                        {/* Error Details (Development Only) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-red-500/10 rounded-xl border border-red-500/20 text-left">
                                <p className="text-red-400 text-xs font-mono break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Tekrar Dene
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                Ana Sayfa
                            </button>
                        </div>

                        {/* Support Link */}
                        <p className="mt-6 text-slate-500 text-sm">
                            Sorun devam ederse{' '}
                            <a href="https://wa.me/905416150721" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                                WhatsApp'tan bize ulaşın
                            </a>
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
