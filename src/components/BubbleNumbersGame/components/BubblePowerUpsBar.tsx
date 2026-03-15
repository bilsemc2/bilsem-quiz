import React from 'react';
import { POWER_UPS, type PowerUpType } from '../powerups/types';
import type { BubblePowerUpState } from '../hooks/useBubbleNumbersGame';

interface BubblePowerUpsBarProps {
  powerUpStates: BubblePowerUpState[];
  disabled: boolean;
  onUsePowerUp: (type: PowerUpType) => void;
}

export const BubblePowerUpsBar: React.FC<BubblePowerUpsBarProps> = ({
  powerUpStates,
  disabled,
  onUsePowerUp
}) => {
  const powerUpLabels: Record<PowerUpType, string> = {
    timeFreeze: 'Zamanı Dondur',
    doublePop: 'Çift Puan',
    slowMotion: 'Yavaşlat',
    extraTime: 'Ek Süre',
    hint: 'İpucu'
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {powerUpStates.map((powerUpState) => {
        const powerUp = POWER_UPS[powerUpState.type];
        const isUnavailable = disabled || !powerUpState.canUse;

        return (
          <button
            key={powerUpState.type}
            type="button"
            onClick={() => onUsePowerUp(powerUpState.type)}
            className={[
              'group rounded-[1.5rem] border-2 border-black/10 px-4 py-4 text-left shadow-neo-sm transition-all',
              'dark:border-white/10',
              powerUpState.isActive
                ? 'bg-cyber-blue text-white'
                : isUnavailable
                  ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  : 'bg-white text-black hover:-translate-y-1 hover:shadow-neo-md dark:bg-slate-900 dark:text-white',
            ].join(' ')}
            disabled={isUnavailable}
            title={`${powerUp.description}${powerUpState.cooldown > 0 ? `\nBekleme: ${powerUpState.cooldown}s` : ''}`}
            aria-label={`${powerUpLabels[powerUpState.type]}: ${powerUp.description}`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-3xl leading-none">{powerUp.icon}</span>
              <span
                className={[
                  'rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em]',
                  powerUpState.isActive
                    ? 'border-white/20 bg-white/15 text-white'
                    : powerUpState.cooldown > 0
                      ? 'border-black/10 bg-black/5 text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-300'
                      : 'border-black/10 bg-cyber-emerald/25 text-black dark:border-white/10 dark:text-white',
                ].join(' ')}
              >
                {powerUpState.isActive ? 'Aktif' : powerUpState.cooldown > 0 ? `${powerUpState.cooldown}s` : 'Hazır'}
              </span>
            </div>

            <div className="mt-3 space-y-1">
              <div className="text-sm font-black uppercase tracking-wide">
                {powerUpLabels[powerUpState.type]}
              </div>
              <div className="text-xs font-bold leading-relaxed opacity-80">
                {powerUp.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
