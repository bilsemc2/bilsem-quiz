import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Video, Clock, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
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
    DayOfWeek.Saturday,
    DayOfWeek.Sunday
];

const SHORT_DAY_NAMES: Record<string, string> = {
    'Pazartesi': 'Pzt',
    'Salı': 'Sal',
    'Çarşamba': 'Çar',
    'Perşembe': 'Per',
    'Cuma': 'Cum',
    'Cumartesi': 'Cts',
    'Pazar': 'Paz',
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
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
        (() => {
            const today = new Date().getDay();
            // JS: 0=Sun, 1=Mon → map to DAYS_ORDER index
            const idx = today === 0 ? 6 : today - 1;
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
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    const dayIndex = DAYS_ORDER.indexOf(selectedDay);
    const prevDay = () => setSelectedDay(DAYS_ORDER[(dayIndex - 1 + 7) % 7]);
    const nextDay = () => setSelectedDay(DAYS_ORDER[(dayIndex + 1) % 7]);

    // Get hours for selected day
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

    const handleBookRequest = (hour: number) => {
        setBookingHour(hour);
    };

    const confirmBooking = () => {
        if (bookingHour !== null) {
            // Open WhatsApp with pre-filled message
            const message = encodeURIComponent(
                `Merhaba, ${selectedDay} günü saat ${bookingHour}:00 için canlı ders almak istiyorum.`
            );
            window.open(`https://wa.me/905416150721?text=${message}`, '_blank');
            toast.success('Randevu talebi gönderildi!');
            setBookingHour(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-800/50 border border-emerald-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
                    <span className="ml-3 text-white/60 text-sm">Müsait saatler yükleniyor...</span>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-8"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Video className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Canlı Ders Al</h2>
                    <p className="text-white/50 text-sm">Müsait saatleri seç, hemen randevu al</p>
                </div>
            </div>

            <div className="bg-slate-800/50 border border-emerald-500/20 rounded-2xl p-5 overflow-hidden">
                {/* Day Selector */}
                <div className="flex items-center justify-between mb-5">
                    <button onClick={prevDay} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex gap-1.5">
                        {DAYS_ORDER.map(day => (
                            <button key={day} onClick={() => setSelectedDay(day)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedDay === day
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                        : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                                    }`}>
                                {SHORT_DAY_NAMES[day]}
                            </button>
                        ))}
                    </div>
                    <button onClick={nextDay} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Available Hours Grid */}
                {availableHours.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {availableHours.map(hour => (
                            <button key={hour} onClick={() => handleBookRequest(hour)}
                                className="group relative bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:scale-105 transition-all text-center">
                                <Clock className="w-4 h-4 text-emerald-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-white font-bold text-sm">{`${hour.toString().padStart(2, '0')}:00`}</span>
                                <span className="block text-emerald-400 text-[10px] font-medium mt-0.5">Müsait</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-white/40 text-sm">Bu gün için müsait saat bulunmuyor.</p>
                        <p className="text-white/30 text-xs mt-1">Diğer günlere göz atın.</p>
                    </div>
                )}

                {/* Summary */}
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-white/30 text-xs">
                        {availableHours.length} müsait saat • {selectedDay}
                    </span>
                    <a href="https://wa.me/905416150721" target="_blank" rel="noopener noreferrer"
                        className="text-emerald-400 text-xs font-medium hover:text-emerald-300 transition-colors">
                        WhatsApp ile iletişime geç →
                    </a>
                </div>
            </div>

            {/* Booking Confirmation Modal */}
            {bookingHour !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setBookingHour(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 border border-emerald-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Randevu Al</h3>
                            <p className="text-white/60">
                                <span className="font-semibold text-emerald-400">{selectedDay}</span> günü saat{' '}
                                <span className="font-semibold text-emerald-400">{bookingHour}:00</span> için
                                canlı ders randevusu almak istiyor musunuz?
                            </p>
                        </div>
                        <p className="text-white/40 text-xs text-center mb-4">
                            WhatsApp üzerinden öğretmeninize otomatik mesaj gönderilecektir.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setBookingHour(null)}
                                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-white/70 font-medium rounded-xl hover:bg-white/10 transition-colors">İptal</button>
                            <button onClick={confirmBooking}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95">
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
