import type { AdminMessageRecord } from '@/server/repositories/adminMessageRepository';
import type { MessageRecipientRow } from '@/server/repositories/profileRepository';

export interface UserMessageItem {
    id: string;
    message: string;
    senderId: string;
    createdAt: string;
    read: boolean;
    senderName: string;
}

export interface MessageRecipientItem {
    id: string;
    name: string;
    email: string;
    talents: string[];
}

const normalizeTalentList = (raw: string | string[] | null): string[] => {
    if (Array.isArray(raw)) {
        return raw
            .filter((value): value is string => typeof value === 'string')
            .map((value) => value.trim().toLocaleLowerCase('tr-TR'))
            .filter(Boolean);
    }

    if (typeof raw === 'string') {
        return raw
            .split(/[;,]/)
            .map((value) => value.trim().toLocaleLowerCase('tr-TR'))
            .filter(Boolean);
    }

    return [];
};

export const toUserMessageItems = (messages: AdminMessageRecord[]): UserMessageItem[] => {
    return messages.map((message) => ({
        id: message.id,
        message: message.message,
        senderId: message.sender_id,
        createdAt: message.created_at,
        read: Boolean(message.read),
        senderName: message.sender?.name?.trim() || 'Admin'
    }));
};

export const toMessageRecipientItems = (
    recipients: MessageRecipientRow[]
): MessageRecipientItem[] => {
    return recipients.map((recipient) => ({
        id: recipient.id,
        name: recipient.name?.trim() || 'İsimsiz Kullanıcı',
        email: recipient.email?.trim() || '',
        talents: normalizeTalentList(recipient.yetenek_alani)
    }));
};

export const filterRecipientsByTalent = (
    recipients: MessageRecipientItem[],
    talent: string
): MessageRecipientItem[] => {
    const target = talent.trim().toLocaleLowerCase('tr-TR');
    if (!target) {
        return recipients;
    }

    return recipients.filter((recipient) => recipient.talents.includes(target));
};

export const mergeRecipientIds = (currentIds: string[], incomingIds: string[]): string[] => {
    return Array.from(new Set([...currentIds, ...incomingIds]));
};

export const selectAllRecipientIds = (recipients: MessageRecipientItem[]): string[] => {
    return recipients.map((recipient) => recipient.id);
};
