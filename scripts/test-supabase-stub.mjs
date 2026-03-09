const unexpectedCall = (label) => {
    throw new Error(`Unexpected supabase stub call: ${label}`);
};

export const supabase = {
    auth: {
        getSession: async () => ({
            data: {
                session: null
            }
        }),
        signOut: async () => ({
            error: null
        }),
        onAuthStateChange: () => ({
            data: {
                subscription: {
                    unsubscribe() {}
                }
            }
        })
    },
    from: () => ({
        select: () => unexpectedCall('from.select')
    })
};
