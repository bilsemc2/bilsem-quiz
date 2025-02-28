import React, { useState } from 'react';
import { toast } from 'sonner';

interface ReferralSystemProps {
  referralCode: string | undefined;
  referralCount: number | undefined;
  onGenerateCode: () => Promise<void>;
}

const ReferralSystem: React.FC<ReferralSystemProps> = ({ 
  referralCode, 
  referralCount = 0, 
  onGenerateCode 
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const copyReferralLink = async () => {
    if (!referralCode) {
      toast.error('Önce referans kodu oluşturmanız gerekiyor.');
      return;
    }

    const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      toast.success('Davet linki kopyalandı!');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Kopyalama başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Arkadaşlarını Davet Et</h2>
          <p className="text-gray-600 mt-1">
            Her başarılı davet için 50 XP kazanın!
          </p>
        </div>
        <div className="bg-purple-100 rounded-full px-4 py-2">
          <span className="text-purple-600 font-medium">
            {referralCount || 0} Davet
          </span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex-1 mr-4">
          <p className="text-sm text-gray-600 mb-1">Davet Kodunuz</p>
          <div className="flex">
            <input
              type="text"
              readOnly
              value={referralCode || ''}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg bg-gray-50"
            />
            {referralCode ? (
              <button
                onClick={copyReferralLink}
                className="px-4 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition duration-200"
              >
                {copySuccess ? 'Kopyalandı!' : 'Kopyala'}
              </button>
            ) : (
              <button
                onClick={onGenerateCode}
                className="px-4 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition duration-200"
              >
                Oluştur
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-gray-600 mt-3">
        <span>Toplam Davet: {referralCount || 0}</span>
        <span>Kazanılan XP: {(referralCount || 0) * 50}</span>
      </div>
    </div>
  );
};

export default ReferralSystem;
