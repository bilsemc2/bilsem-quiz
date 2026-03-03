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
    <div className="flex flex-col transition-colors duration-300">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-nunito font-extrabold text-black dark:text-white">Davet Et</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-nunito font-bold">
            Her başarılı davet için 50 XP
          </p>
        </div>
        <div className="bg-cyber-blue/10 rounded-lg px-2.5 py-1 border border-cyber-blue/20">
          <span className="text-cyber-blue font-nunito font-extrabold text-xs">
            {referralCount || 0} Davet
          </span>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-slate-700/30 rounded-xl p-3 flex flex-col gap-3 border border-black/5 dark:border-white/5">
        <div className="flex-1">
          <p className="text-[10px] text-slate-500 mb-1 font-nunito font-extrabold uppercase tracking-wider">Davet Kodunuz</p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={referralCode || ''}
              className="flex-1 px-3 py-2 border-2 border-black/10 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 text-black dark:text-white font-nunito font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-cyber-blue/30 transition-all"
            />
            {referralCode ? (
              <button
                onClick={copyReferralLink}
                className="px-4 py-2 bg-cyber-blue text-white font-nunito font-extrabold text-xs border-2 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all uppercase tracking-wider"
              >
                {copySuccess ? 'Kopyalandı!' : 'Kopyala'}
              </button>
            ) : (
              <button
                onClick={onGenerateCode}
                className="px-4 py-2 bg-cyber-emerald text-black font-nunito font-extrabold text-xs border-2 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all uppercase tracking-wider"
              >
                Oluştur
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-slate-400 mt-2.5 font-nunito font-bold text-[10px] uppercase tracking-wider">
        <span>Toplam: {referralCount || 0} davet</span>
        <span className="text-cyber-pink font-extrabold">+{(referralCount || 0) * 50} XP</span>
      </div>
    </div>
  );
};

export default ReferralSystem;
