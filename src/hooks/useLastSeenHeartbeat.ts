import { useEffect } from 'react';
import { touchUserLastSeen } from '@/features/auth/model/authUseCases';

const LAST_SEEN_INTERVAL_MS = 60000;

export const useLastSeenHeartbeat = (userId?: string) => {
    useEffect(() => {
        if (!userId) {
            return;
        }

        const updateLastSeen = async () => {
            await touchUserLastSeen(userId);
        };

        void updateLastSeen();
        const intervalId = window.setInterval(() => {
            void updateLastSeen();
        }, LAST_SEEN_INTERVAL_MS);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [userId]);
};
