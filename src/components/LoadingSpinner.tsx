export default function LoadingSpinner() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
}
