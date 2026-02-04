import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Download } from 'lucide-react';

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
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // TODO: Send error to monitoring service in production
        // e.g., Sentry, LogRocket, etc.
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
                    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
                            {/* Update Icon */}
                            <div className="w-20 h-20 mx-auto mb-6 bg-indigo-500/20 rounded-full flex items-center justify-center">
                                <Download className="w-10 h-10 text-indigo-400" />
                            </div>

                            {/* Update Message */}
                            <h1 className="text-2xl font-bold text-white mb-2">
                                Yeni Güncelleme Mevcut! 🚀
                            </h1>
                            <p className="text-slate-400 mb-6">
                                Uygulama güncellendi. Yeni özellikleri görmek için sayfayı yenileyin.
                            </p>

                            {/* Single Refresh Button */}
                            <button
                                onClick={this.handleHardRefresh}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Sayfayı Yenile
                            </button>
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
