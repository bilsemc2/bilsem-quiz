import { supabase } from '@/lib/supabase';

export interface AdminMessageSender {
    name?: string;
}

export interface AdminMessageRecord {
    id: string;
    message: string;
    sender_id: string;
    receiver_id: string;
    created_at: string;
    read: boolean;
    sender?: AdminMessageSender | null;
}

export interface CreateAdminMessageInput {
    senderId: string;
    receiverId: string;
    message: string;
}

export interface AdminMessageRepository {
    listMessagesByReceiverId: (receiverId: string) => Promise<AdminMessageRecord[]>;
    listUnreadMessagesByReceiverId: (receiverId: string) => Promise<AdminMessageRecord[]>;
    markMessageAsRead: (messageId: string) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    sendAdminMessage: (input: CreateAdminMessageInput) => Promise<void>;
    sendAdminMessages: (input: { senderId: string; receiverIds: string[]; message: string }) => Promise<void>;
    subscribeMessageChanges: (onChange: () => void, receiverId?: string) => { unsubscribe: () => void };
}

const listMessagesByReceiverId = async (receiverId: string): Promise<AdminMessageRecord[]> => {
    const { data, error } = await supabase
        .from('admin_messages')
        .select(`
            *,
            sender:sender_id(name)
        `)
        .eq('receiver_id', receiverId)
        .order('created_at', { ascending: false });

    if (error || !data) {
        if (error) {
            console.error('admin messages fetch failed:', error);
        }
        return [];
    }

    return data as AdminMessageRecord[];
};

const listUnreadMessagesByReceiverId = async (receiverId: string): Promise<AdminMessageRecord[]> => {
    const { data, error } = await supabase
        .from('admin_messages')
        .select(`
            *,
            sender:sender_id(name)
        `)
        .eq('receiver_id', receiverId)
        .eq('read', false)
        .order('created_at', { ascending: false });

    if (error || !data) {
        if (error) {
            console.error('unread admin messages fetch failed:', error);
        }
        return [];
    }

    return data as AdminMessageRecord[];
};

const markMessageAsRead = async (messageId: string): Promise<void> => {
    const { error } = await supabase
        .from('admin_messages')
        .update({ read: true })
        .eq('id', messageId);

    if (error) {
        throw error;
    }
};

const deleteMessage = async (messageId: string): Promise<void> => {
    const { error } = await supabase
        .from('admin_messages')
        .delete()
        .eq('id', messageId);

    if (error) {
        throw error;
    }
};

const sendAdminMessage = async (input: CreateAdminMessageInput): Promise<void> => {
    const { error } = await supabase
        .from('admin_messages')
        .insert([
            {
                sender_id: input.senderId,
                receiver_id: input.receiverId,
                message: input.message
            }
        ]);

    if (error) {
        throw error;
    }
};

const sendAdminMessages = async (input: { senderId: string; receiverIds: string[]; message: string }): Promise<void> => {
    if (input.receiverIds.length === 0) {
        return;
    }

    const payload = input.receiverIds.map((receiverId) => ({
        sender_id: input.senderId,
        receiver_id: receiverId,
        message: input.message,
        read: false
    }));

    const { error } = await supabase
        .from('admin_messages')
        .insert(payload);

    if (error) {
        throw error;
    }
};

const subscribeMessageChanges = (onChange: () => void, receiverId?: string) => {
    const channelName = receiverId ? `admin-messages-notif-${receiverId}` : 'admin-messages-notif';
    const channel = supabase.channel(channelName);

    channel.on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'admin_messages',
            ...(receiverId ? { filter: `receiver_id=eq.${receiverId}` } : {})
        },
        () => {
            onChange();
        }
    );

    channel.subscribe();

    return {
        unsubscribe: () => {
            void channel.unsubscribe();
        }
    };
};

export const adminMessageRepository: AdminMessageRepository = {
    listMessagesByReceiverId,
    listUnreadMessagesByReceiverId,
    markMessageAsRead,
    deleteMessage,
    sendAdminMessage,
    sendAdminMessages,
    subscribeMessageChanges
};
