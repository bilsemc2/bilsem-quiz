import { Lock } from 'lucide-react';
import { getRoleDeniedCopy, getTalentDeniedCopy } from './routeGuardModel';
import type { GuardOptions } from './guardTypes';

interface GuardAccessDeniedStateProps extends Pick<GuardOptions, 'requireAdmin' | 'requireTeacher' | 'requiredTalent'> {
    reason: 'role' | 'talent';
    userTalent: string | string[] | null;
}

export default function GuardAccessDeniedState({
    reason,
    requireAdmin,
    requireTeacher,
    requiredTalent,
    userTalent
}: GuardAccessDeniedStateProps) {
    const roleCopy = getRoleDeniedCopy({ requireAdmin, requireTeacher });
    const talentCopy = getTalentDeniedCopy(requiredTalent, userTalent);
    const copy = reason === 'talent' ? talentCopy : roleCopy;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-rose-900 to-slate-900 p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-10 h-10 text-rose-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">{copy.title}</h1>
                <p className="text-white/70 mb-4 leading-relaxed">{copy.description}</p>
                {reason === 'talent' && (
                    <p className="text-white/70 mb-8 leading-relaxed">
                        Sizin yetenek alanınız: <strong>{talentCopy.userTalent}</strong>.
                    </p>
                )}
                <button
                    onClick={() => window.history.back()}
                    className="w-full py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/10"
                >
                    Geri Dön
                </button>
            </div>
        </div>
    );
}
