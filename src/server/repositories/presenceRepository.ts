import { supabase } from '@/lib/supabase';

export interface PresenceProfileRow {
    id: string;
    name: string | null;
    last_seen: string | null;
}

export interface PresenceRepository {
    listProfilesPresence: () => Promise<PresenceProfileRow[]>;
    subscribeProfilesChanges: (onChange: () => void) => { unsubscribe: () => void };
}

const listProfilesPresence = async (): Promise<PresenceProfileRow[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, last_seen')
        .order('name');

    if (error || !data) {
        if (error) {
            console.error('profiles presence fetch failed:', error);
        }
        return [];
    }

    return data as PresenceProfileRow[];
};

const subscribeProfilesChanges = (onChange: () => void) => {
    const channel = supabase
        .channel('online-users')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'profiles'
            },
            () => {
                onChange();
            }
        )
        .subscribe();

    return {
        unsubscribe: () => {
            void channel.unsubscribe();
        }
    };
};

export const presenceRepository: PresenceRepository = {
    listProfilesPresence,
    subscribeProfilesChanges
};
