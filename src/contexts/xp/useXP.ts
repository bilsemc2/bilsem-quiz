import { useContext } from 'react';
import { XPContext } from './xpContext';

export const useXP = () => useContext(XPContext);
