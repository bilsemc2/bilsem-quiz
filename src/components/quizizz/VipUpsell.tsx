import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

export const VipUpsell: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6 text-center"
        >
            <Lock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">VIP Üyelik Gerekli</h3>
            <p className="text-slate-400 mb-4">Quizizz kodlarına erişmek için VIP üye olmanız gerekmektedir.</p>
            <Link
                to="/profil"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all"
            >
                <Crown className="w-5 h-5" />
                VIP Üye Ol
            </Link>
        </motion.div>
    );
};
