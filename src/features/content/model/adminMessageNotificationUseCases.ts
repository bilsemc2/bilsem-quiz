import type { AdminMessageRecord } from '@/server/repositories/adminMessageRepository';

export interface AdminMessageNotificationItem {
    id: string;
    message: string;
    senderId: string;
    createdAt: string;
    senderName?: string;
}

export const toAdminMessageNotificationItems = (
    messages: AdminMessageRecord[]
): AdminMessageNotificationItem[] => {
    return messages.map((message) => ({
        id: message.id,
        message: message.message,
        senderId: message.sender_id,
        createdAt: message.created_at,
        senderName: message.sender?.name
    }));
};

export const shouldShowAdminMessageNotification = (
    messages: AdminMessageNotificationItem[],
    isProfilePage: boolean
): boolean => {
    return messages.length > 0 && !isProfilePage;
};
