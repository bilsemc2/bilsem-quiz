import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error: error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/atolyeler/muzik';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-slate-900 text-white text-center">
                    <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center text-4xl mb-8 animate-pulse">
                        ⚠️
                    </div>
                    <h1 className="text-4xl font-black mb-4 text-rose-500">
                        Bir Hata Oluştu
                    </h1>
                    <p className="text-xl opacity-60 max-w-lg mb-10 leading-relaxed">
                        Üzgünüz, bir şeyler yanlış gitti. Müzik atölyesi sırasında bir problemle karşılaştık.
                    </p>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details className="mb-10 p-6 bg-white/5 rounded-2xl border border-white/10 max-w-3xl w-full text-left overflow-hidden">
                            <summary className="cursor-pointer font-bold opacity-50 mb-4 hover:opacity-100 transition-opacity">
                                Hata Detayları (Geliştirici Modu)
                            </summary>
                            <pre className="text-xs font-mono text-rose-400 whitespace-pre-wrap break-words opacity-80">
                                {this.state.error.toString()}
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}

                    <button
                        onClick={this.handleReset}
                        className="py-4 px-10 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl hover:-translate-y-1"
                    >
                        Atölyeyi Yeniden Başlat
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
