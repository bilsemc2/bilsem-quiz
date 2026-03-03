import type { PresenceProfileRow } from '@/server/repositories/presenceRepository';

export interface OnlineUser {
    id: string;
    name: string;
    lastSeenISO: string | null;
    online: boolean;
}

export const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

const isOnlineByLastSeen = (lastSeenISO: string | null, nowMs: number, thresholdMs: number): boolean => {
    if (!lastSeenISO) {
        return false;
    }

    const timestamp = Date.parse(lastSeenISO);
    if (!Number.isFinite(timestamp)) {
        return false;
    }

    return nowMs - timestamp < thresholdMs;
};

export const toOnlineUsers = (
    profiles: PresenceProfileRow[],
    nowMs = Date.now(),
    thresholdMs = ONLINE_THRESHOLD_MS
): OnlineUser[] => {
    return profiles.map((profile) => ({
        id: profile.id,
        name: profile.name || 'İsimsiz Kullanıcı',
        lastSeenISO: profile.last_seen,
        online: isOnlineByLastSeen(profile.last_seen, nowMs, thresholdMs)
    }));
};
