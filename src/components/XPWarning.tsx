interface XPWarningProps {
  requiredXP: number;
  currentXP: number;
  title: string;
}

const XPWarning = ({ requiredXP, currentXP, title }: XPWarningProps) => {
  const progress = Math.min((currentXP / requiredXP) * 100, 100);
  const hasEnoughXP = currentXP >= requiredXP;

  if (hasEnoughXP) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-green-700">Quiz'e başlamak için yeterli XP'niz var</span>
        </div>
        <span className="text-sm text-green-600 font-medium">{currentXP} XP</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600">
              Bu özelliği kullanmak için en az {requiredXP} XP'ye ihtiyacınız var.
              Şu anda {currentXP} XP'niz var.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-1">
          <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">{currentXP} / {requiredXP} XP</span>
        </div>
      </div>
    </div>
    </div>
  );
};

export default XPWarning;
