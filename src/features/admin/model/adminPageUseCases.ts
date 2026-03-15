import {
    notificationRepository,
    type NotificationRepository
} from '@/server/repositories/notificationRepository';
import {
    authRepository,
    type AuthRepository,
    type AuthProfileRecord
} from '@/server/repositories/authRepository';

export interface AdminNotificationLike {
    type: string;
}

export interface AdminMenuItemLike {
    id: string;
    badge?: number;
}

export const applyNotificationBadges = <T extends AdminMenuItemLike>(
    menuItems: T[],
    notifications: AdminNotificationLike[]
): T[] => {
    const counts = notifications.reduce<Record<string, number>>((acc, notification) => {
        const key = notification.type;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    return menuItems.map((menuItem) => ({
        ...menuItem,
        badge: counts[menuItem.id] || 0
    }));
};

export const loadUnreadNotifications = async (
    userId: string,
    deps: Pick<NotificationRepository, 'listUnreadByUserId'> = notificationRepository
) => {
    return deps.listUnreadByUserId(userId);
};

export const loadAdminProfile = async (
    userId: string,
    deps: Pick<AuthRepository, 'getProfileByUserId'> = authRepository
): Promise<AuthProfileRecord | null> => {
    return deps.getProfileByUserId(userId);
};
