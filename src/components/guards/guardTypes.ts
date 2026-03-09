import type { ReactNode } from 'react';

export interface GuardOptions {
    requireAdmin?: boolean;
    requireTeacher?: boolean;
    skipXPCheck?: boolean;
    requiredTalent?: string;
}

export interface GuardChildrenProps {
    children: ReactNode;
}
