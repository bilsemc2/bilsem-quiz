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
