import { createContext } from 'react';

export interface XPContextValue {
    secondsActive: number;
    lastXPGainAt: number;
}

export const XPContext = createContext<XPContextValue>({
    secondsActive: 0,
    lastXPGainAt: 0
});
