import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Clock, ChevronLeft, ChevronRight, CheckCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────

enum DayOfWeek {
    Monday = 'Pazartesi',
    Tuesday = 'Salı',
    Wednesday = 'Çarşamba',
    Thursday = 'Perşembe',
    Friday = 'Cuma',
    Saturday = 'Cumartesi',
    Sunday = 'Pazar'
}

const DAYS_ORDER = [
    DayOfWeek.Monday,
    DayOfWeek.Tuesday,
    DayOfWeek.Wednesday,
    DayOfWeek.Thursday,
    DayOfWeek.Friday,
];

const SHORT_DAY_NAMES: Record<string, string> = {
    'Pazartesi': 'Pzt',
    'Salı': 'Sal',
    'Çarşamba': 'Çar',
    'Perşembe': 'Per',
    'Cuma': 'Cum',
};

interface LessonSlot {
    id: string;
    day: DayOfWeek;
    hour: number;
    minute: number;
    duration: number;
    is_booked: boolean;
}

const WORKING_HOURS_START = 8;
const WORKING_HOURS_END = 20;
const HOURS_ARRAY = Array.from(
    { length: WORKING_HOURS_END - WORKING_HOURS_START + 1 },
    (_, i) => i + WORKING_HOURS_START
);

// ─── Component ───────────────────────────────────────────────────────

const LiveLessonBooking: React.FC = () => {
    const [slots, setSlots] = useState<LessonSlot[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
        (() => {
            const today = new Date().getDay();
            const idx = today >= 1 && today <= 5 ? today - 1 : 0;
            return DAYS_ORDER[idx];
        })()
    );
    const [bookingHour, setBookingHour] = useState<number | null>(null);

    const fetchSlots = useCallback(async () => {
        const { data, error } = await supabase
            .from('lesson_slots')
            .select('id, day, hour, minute, duration, is_booked')
            .order('hour', { ascending: true })
            .order('minute', { ascending: true });

        if (error) {
            console.error(error);
        } else {
            setSlots(data || []);
        }
    }, []);

    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    const dayIndex = DAYS_ORDER.indexOf(selectedDay);
    const prevDay = () => setSelectedDay(DAYS_ORDER[(dayIndex - 1 + 5) % 5]);
    const nextDay = () => setSelectedDay(DAYS_ORDER[(dayIndex + 1) % 5]);

    const daySlots = slots.filter(s => s && s.day === selectedDay);

    const isHourOccupied = (hour: number) => {
        const hourStart = hour * 60;
        const hourEnd = (hour + 1) * 60;
        return daySlots.some(s => {
            const slotStart = s.hour * 60 + s.minute;
            const slotEnd = slotStart + s.duration;
            return slotStart < hourEnd && slotEnd > hourStart;
        });
    };

    const availableHours = HOURS_ARRAY.filter(h => !isHourOccupied(h));

    const confirmBooking = () => {
        if (bookingHour !== null) {
            const message = encodeURIComponent(
                `Merhaba, ${selectedDay} günü saat ${bookingHour}:00 için canlı ders almak istiyorum.`
            );
            window.open(`https://wa.me/905416150721?text=${message}`, '_blank');
            toast.success('Randevu talebi gönderildi!');
            setBookingHour(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-6"
        >
            {/* Clickable Banner Strip */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 bg-cyber-emerald border-2 border-black/10 rounded-2xl p-4 shadow-neo-sm hover:-translate-y-0.5 hover:shadow-neo-md transition-all active:translate-y-0.5 active:shadow-none focus:outline-none"
            >
                <div className="w-10 h-10 bg-white border-2 border-black/10 rounded-xl flex items-center justify-center">
                    <Video className="w-5 h-5 text-black" />
                </div>
                <div className="flex-1 text-left">
                    <h2 className="text-base font-nunito font-extrabold text-black">🎓 Canlı Ders Al</h2>
                    <p className="text-black/60 font-nunito font-bold text-xs">Müsait saatleri seç, hemen randevu al</p>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-5 h-5 text-black" />
                </motion.div>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 space-y-4">
                            {/* Lesson Info Card */}
                            <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-sm">
                                <div className="h-1.5 bg-cyber-emerald" />
                                <div className="p-5">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                        <div className="bg-gray-50 dark:bg-slate-700/50 border border-black/5 dark:border-white/5 rounded-xl p-2.5">
                                            <p className="text-xl font-nunito font-extrabold text-black dark:text-white">2</p>
                                            <p className="text-slate-400 text-[9px] font-nunito font-extrabold uppercase tracking-wider">Haftalık</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-slate-700/50 border border-black/5 dark:border-white/5 rounded-xl p-2.5">
                                            <p className="text-xl font-nunito font-extrabold text-black dark:text-white">30<span className="text-xs">dk</span></p>
                                            <p className="text-slate-400 text-[9px] font-nunito font-extrabold uppercase tracking-wider">Süre</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-slate-700/50 border border-black/5 dark:border-white/5 rounded-xl p-2.5">
                                            <p className="text-xl font-nunito font-extrabold text-black dark:text-white">8</p>
                                            <p className="text-slate-400 text-[9px] font-nunito font-extrabold uppercase tracking-wider">Aylık Toplam</p>
                                        </div>
                                        <div className="bg-cyber-emerald/10 border border-cyber-emerald/20 rounded-xl p-2.5">
                                            <p className="text-lg font-nunito font-extrabold text-black dark:text-white">₺10.000</p>
                                            <p className="text-slate-500 text-[9px] font-nunito font-extrabold uppercase tracking-wider">Aylık Ücret</p>
                                        </div>
                                    </div>
                                    <p className="text-center text-slate-500 dark:text-slate-400 text-xs mt-4 font-nunito font-bold">
                                        🎁 Ders aldığınız sürece <span className="font-extrabold text-cyber-pink bg-cyber-pink/10 px-1.5 py-0.5 rounded border border-cyber-pink/20">PRO paket</span> ayrıcalıklarına ücretsiz sahip olursunuz!
                                    </p>
                                </div>
                            </div>

                            {/* Day Selector & Schedule */}
                            <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-sm">
                                <div className="h-1.5 bg-cyber-blue" />
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <button onClick={prevDay} className="p-2 border-2 border-black/10 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-black dark:text-white">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <div className="flex gap-1.5 flex-wrap justify-center">
                                            {DAYS_ORDER.map(day => (
                                                <button key={day} onClick={() => setSelectedDay(day)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-nunito font-extrabold transition-all border-2 ${selectedDay === day
                                                        ? 'bg-cyber-blue text-white border-cyber-blue shadow-neo-sm -translate-y-0.5'
                                                        : 'bg-gray-50 dark:bg-slate-700 text-black dark:text-white border-black/10 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-slate-600'
                                                        }`}>
                                                    {SHORT_DAY_NAMES[day]}
                                                </button>
                                            ))}
                                        </div>
                                        <button onClick={nextDay} className="p-2 border-2 border-black/10 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-black dark:text-white">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Available Hours Grid */}
                                    {availableHours.length > 0 ? (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                                            {availableHours.map(hour => (
                                                <button key={hour} onClick={() => setBookingHour(hour)}
                                                    className="group relative bg-cyber-emerald/10 border-2 border-cyber-emerald/20 rounded-xl p-3 hover:bg-cyber-emerald hover:border-black hover:shadow-neo-sm hover:-translate-y-0.5 transition-all text-center focus:outline-none">
                                                    <Clock className="w-4 h-4 text-cyber-emerald mx-auto mb-1 group-hover:text-black group-hover:scale-110 transition-all" />
                                                    <span className="text-black dark:text-white font-nunito font-extrabold text-xs group-hover:text-black">{`${hour.toString().padStart(2, '0')}:00`}</span>
                                                    <span className="block text-slate-400 text-[8px] font-nunito font-extrabold mt-0.5 uppercase tracking-wider group-hover:text-black/60">Müsait</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-gray-50 dark:bg-slate-700/30 border-2 border-black/5 dark:border-white/5 border-dashed rounded-xl">
                                            <p className="text-slate-500 dark:text-slate-400 text-xs font-nunito font-bold">Bu gün için müsait saat bulunmuyor.</p>
                                            <p className="text-slate-400 text-[10px] mt-1 font-nunito font-bold">Diğer günlere göz atın.</p>
                                        </div>
                                    )}

                                    {/* Summary */}
                                    <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                                        <span className="text-slate-400 text-[10px] font-nunito font-extrabold uppercase tracking-wider">
                                            {availableHours.length} müsait saat • {selectedDay}
                                        </span>
                                        <a href="https://wa.me/905416150721" target="_blank" rel="noopener noreferrer"
                                            className="text-cyber-pink text-[10px] font-nunito font-extrabold hover:underline transition-all uppercase tracking-wider">
                                            WhatsApp ile iletişime geç →
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Booking Confirmation Modal */}
            {bookingHour !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4" onClick={() => setBookingHour(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden p-6 w-full max-w-sm shadow-neo-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="h-1.5 bg-cyber-emerald -mx-6 -mt-6 mb-5" />
                        <div className="text-center mb-5">
                            <div className="w-14 h-14 bg-cyber-emerald/10 border-2 border-cyber-emerald/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <CheckCircle className="w-7 h-7 text-cyber-emerald" />
                            </div>
                            <h3 className="text-lg font-nunito font-extrabold text-black dark:text-white mb-1.5">Randevu Al</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm">
                                <span className="font-extrabold text-cyber-pink">{selectedDay}</span> günü saat{' '}
                                <span className="font-extrabold text-cyber-pink">{bookingHour}:00</span> için
                                canlı ders randevusu almak istiyor musunuz?
                            </p>
                        </div>
                        <p className="text-slate-400 text-[9px] text-center mb-4 font-nunito font-extrabold uppercase tracking-wider">
                            WhatsApp üzerinden öğretmeninize otomatik mesaj gönderilecektir.
                        </p>
                        <div className="flex gap-2.5">
                            <button onClick={() => setBookingHour(null)}
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 border-3 border-black/10 text-black dark:text-white font-nunito font-extrabold rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all text-xs uppercase tracking-wider">İptal</button>
                            <button onClick={confirmBooking}
                                className="flex-1 px-4 py-2.5 bg-cyber-emerald text-black border-3 border-black/10 font-nunito font-extrabold rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all text-xs uppercase tracking-wider">
                                Randevu Al
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default LiveLessonBooking;
