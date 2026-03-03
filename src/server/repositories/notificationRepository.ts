import { supabase } from '@/lib/supabase';

export interface NotificationRecord {
    id: string;
    type: string;
    message: string;
    created_at: string;
}

export interface NotificationRepository {
    listUnreadByUserId: (userId: string) => Promise<NotificationRecord[]>;
}

const listUnreadByUserId = async (userId: string): Promise<NotificationRecord[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('id, type, message, created_at')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });

    if (error || !data) {
        if (error) {
            console.error('unread notifications fetch failed:', error);
        }
        return [];
    }

    return data as NotificationRecord[];
};

export const notificationRepository: NotificationRepository = {
    listUnreadByUserId
};
