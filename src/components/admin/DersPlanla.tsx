import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
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

interface TimeSlot {
    id: string;
    day: DayOfWeek;
    hour: number;
    minute: number;
    duration: number;
    is_booked: boolean;
    title?: string;
    student_name?: string;
    parent_name?: string;
    phone?: string;
    color?: string;
}

const SLOT_COLORS = [
    { name: 'Mavi', value: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100', dot: 'bg-blue-500' },
    { name: 'Mor', value: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', badge: 'bg-purple-100', dot: 'bg-purple-500' },
    { name: 'Yeşil', value: 'green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-100', dot: 'bg-green-500' },
    { name: 'Turuncu', value: 'orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-100', dot: 'bg-orange-500' },
    { name: 'Kırmızı', value: 'red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100', dot: 'bg-red-500' },
    { name: 'Pembe', value: 'pink', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', badge: 'bg-pink-100', dot: 'bg-pink-500' },
    { name: 'Sarı', value: 'amber', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100', dot: 'bg-amber-500' },
    { name: 'Camgöbeği', value: 'cyan', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', badge: 'bg-cyan-100', dot: 'bg-cyan-500' },
];

const getSlotColor = (color?: string) => SLOT_COLORS.find(c => c.value === color) || SLOT_COLORS[0];

interface BookingRequest {
    day: DayOfWeek;
    hour: number;
}

// ─── Constants ───────────────────────────────────────────────────────

const WORKING_HOURS_START = 8;
const WORKING_HOURS_END = 20;

const HOURS_ARRAY = Array.from(
    { length: WORKING_HOURS_END - WORKING_HOURS_START + 1 },
    (_, i) => i + WORKING_HOURS_START
);

// ─── Icons (Inline SVG) ─────────────────────────────────────────────

const CalendarSvgIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
);

const UserSvgIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

const UsersSvgIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);

const CheckCircleSvgIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);

const TrashSvgIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
);

const CopySvgIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
);

const XSvgIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);

const PencilSvgIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
);

// ─── Helpers ─────────────────────────────────────────────────────────

const formatTimeRange = (hour: number, minute: number, duration: number) => {
    const start = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const endDate = new Date();
    endDate.setHours(hour, minute + duration);
    const end = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
    return `${start}-${end}`;
};

// ─── TutorBookingModal ───────────────────────────────────────────────

interface TutorBookingModalProps {
    day: DayOfWeek;
    hour: number;
    initialData?: Partial<TimeSlot> | null;
    onClose: () => void;
    onSave: (data: {
        title: string;
        student_name: string;
        parent_name: string;
        phone: string;
        hour: number;
        minute: number;
        duration: number;
        color: string;
    }) => void;
}

const TutorBookingModal: React.FC<TutorBookingModalProps> = ({ day, hour, initialData, onClose, onSave }) => {
    const [title, setTitle] = useState('Özel Ders');
    const [studentName, setStudentName] = useState('');
    const [parentName, setParentName] = useState('');
    const [phone, setPhone] = useState('');
    const initialMinute = initialData?.minute || 0;
    const [timeStr, setTimeStr] = useState(`${hour.toString().padStart(2, '0')}:${initialMinute.toString().padStart(2, '0')}`);
    const [duration, setDuration] = useState(60);
    const [color, setColor] = useState(initialData?.color || 'blue');

    useEffect(() => {
        if (initialData) {
            if (initialData.title) setTitle(initialData.title);
            if (initialData.student_name) setStudentName(initialData.student_name);
            if (initialData.parent_name) setParentName(initialData.parent_name);
            if (initialData.phone) setPhone(initialData.phone);
            if (initialData.duration) setDuration(initialData.duration);
            if (initialData.color) setColor(initialData.color);
            const min = initialData.minute || 0;
            setTimeStr(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
        }
    }, [initialData, hour]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const [h, m] = timeStr.split(':').map(Number);
        onSave({ title, student_name: studentName, parent_name: parentName, phone, hour: h, minute: m, duration, color });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                        {initialData?.id ? 'Dersi Düzenle' : initialData ? 'Dersi Kopyala' : 'Ders Detayları Ekle'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="mb-4 bg-indigo-50 p-3 rounded-lg text-sm text-indigo-800 flex justify-between items-center">
                    <span className="font-semibold">{day}</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Saati</label>
                            <input type="time" required value={timeStr} onChange={(e) => setTimeStr(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Süre (Dk)</label>
                            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                                <option value={30}>30 Dakika</option>
                                <option value={45}>45 Dakika</option>
                                <option value={60}>60 Dakika</option>
                                <option value={90}>90 Dakika</option>
                                <option value={120}>2 Saat</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ders Konusu / Başlık</label>
                        <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Örn: Matematik" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci Adı Soyadı</label>
                        <input type="text" required value={studentName} onChange={(e) => setStudentName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Örn: Ali Yılmaz" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Renk</label>
                        <div className="flex gap-2 flex-wrap">
                            {SLOT_COLORS.map(c => (
                                <button key={c.value} type="button" onClick={() => setColor(c.value)}
                                    className={`w-8 h-8 rounded-full ${c.dot} transition-all ${color === c.value ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-110 opacity-60'}`}
                                    title={c.name} />
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Veli Adı (Opsiyonel)</label>
                            <input type="text" value={parentName} onChange={(e) => setParentName(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Örn: Ayşe Yılmaz" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon (Opsiyonel)</label>
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0555..." />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">İptal</button>
                        <button type="submit"
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                            {initialData?.id ? 'Güncelle' : initialData ? 'Yapıştır ve Kaydet' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── SlotItem ────────────────────────────────────────────────────────

interface SlotItemProps {
    slot?: TimeSlot;
    mode: 'tutor' | 'student';
    onSlotClick?: (slot: TimeSlot) => void;
    onAddClick?: () => void;
    onCopyClick?: (slot: TimeSlot) => void;
    onEditClick?: (slot: TimeSlot) => void;
}

const SlotItem: React.FC<SlotItemProps> = ({ slot, mode, onSlotClick, onAddClick, onCopyClick, onEditClick }) => {
    if (slot) {
        const timeRange = formatTimeRange(slot.hour, slot.minute, slot.duration);
        const c = getSlotColor(slot.color);

        if (mode === 'tutor') {
            return (
                <div className={`${c.bg} border ${c.border} p-2 rounded-lg mb-1 relative group shadow-sm pr-1 min-h-[4.5rem] transition-all hover:shadow-md`}>
                    <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-bold ${c.text} ${c.badge} px-1.5 py-0.5 rounded border ${c.border}`}>{timeRange}</span>
                        <div className={`w-2 h-2 rounded-full ${c.dot}`}></div>
                    </div>
                    <div className="mt-1.5">
                        <p className="font-bold text-gray-900 text-xs truncate leading-tight">{slot.title}</p>
                        {slot.student_name && (
                            <p className="text-gray-600 text-[10px] truncate leading-tight mt-0.5">{slot.student_name}</p>
                        )}
                    </div>
                    <div className="hidden group-hover:flex absolute inset-0 bg-white/95 backdrop-blur-[2px] z-50 rounded-lg items-center justify-center gap-2 animate-in fade-in duration-150">
                        {onEditClick && (
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditClick(slot); }}
                                className="flex items-center justify-center w-9 h-9 bg-amber-50 text-amber-600 rounded-full hover:bg-amber-600 hover:text-white transition-all shadow-sm border border-amber-200 hover:scale-110 active:scale-95"
                                title="Düzenle">
                                <PencilSvgIcon className="w-4 h-4" />
                            </button>
                        )}
                        {onCopyClick && (
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCopyClick(slot); }}
                                className="flex items-center justify-center w-9 h-9 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-200 hover:scale-110 active:scale-95"
                                title="Dersi Kopyala">
                                <CopySvgIcon className="w-5 h-5" />
                            </button>
                        )}
                        {onSlotClick && (
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSlotClick(slot); }}
                                className="flex items-center justify-center w-9 h-9 bg-red-50 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-200 hover:scale-110 active:scale-95"
                                title="Dersi Sil">
                                <TrashSvgIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-gray-100 border border-gray-200 p-2 rounded-lg mb-1 opacity-70">
                <span className="text-[10px] font-mono text-gray-500 block mb-0.5">{timeRange}</span>
                <span className="text-gray-500 font-medium text-xs select-none block">Dolu</span>
            </div>
        );
    }

    if (mode === 'tutor') {
        return (
            <div onClick={onAddClick}
                className="h-full min-h-[3rem] p-2 rounded-lg border border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer flex flex-col justify-center items-center text-center text-xs group">
                <span className="text-gray-400 group-hover:text-indigo-600 font-medium text-[10px] scale-90 group-hover:scale-100 transition-transform">+ Ekle</span>
            </div>
        );
    }

    return (
        <div onClick={onAddClick}
            className="h-full min-h-[3rem] p-2 rounded-lg border bg-emerald-50 border-emerald-200 cursor-pointer hover:bg-emerald-100 hover:scale-[1.02] shadow-sm hover:shadow-md transition-all flex flex-col justify-center items-center text-center group">
            <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
                <CheckCircleSvgIcon className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold text-xs">Müsait</span>
            </div>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────

const DersPlanla: React.FC = () => {
    const [mode, setMode] = useState<'tutor' | 'student'>('tutor');
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [clipboardSlot, setClipboardSlot] = useState<TimeSlot | null>(null);
    const [studentBookingModal, setStudentBookingModal] = useState<BookingRequest | null>(null);
    const [tutorBookingModal, setTutorBookingModal] = useState<(BookingRequest & { initialData?: TimeSlot | null }) | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
    const [clearAllConfirm, setClearAllConfirm] = useState(false);
    const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

    // ─── Supabase CRUD ───────────────────────────────────────────────

    const fetchSlots = useCallback(async () => {
        const { data, error } = await supabase
            .from('lesson_slots')
            .select('*')
            .order('hour', { ascending: true })
            .order('minute', { ascending: true });

        if (error) {
            toast.error('Dersler yüklenirken hata oluştu');
            console.error(error);
        } else {
            setSlots(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    const addSlot = async (slot: Omit<TimeSlot, 'id'>) => {
        const id = crypto.randomUUID();
        const newSlot = { ...slot, id };

        const { error } = await supabase
            .from('lesson_slots')
            .insert(newSlot);

        if (error) {
            toast.error(`Ders eklenirken hata: ${error.message}`);
            console.error('Insert error:', error);
            return;
        }

        setSlots(prev => [...prev, newSlot as TimeSlot]);
        toast.success('Ders eklendi');
    };

    const deleteSlot = async (id: string) => {
        const { error } = await supabase
            .from('lesson_slots')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Ders silinirken hata oluştu');
            console.error(error);
            return;
        }

        setSlots(prev => prev.filter(s => s.id !== id));
        toast.success('Ders silindi');
    };

    const clearAllSlots = async () => {
        const { error } = await supabase
            .from('lesson_slots')
            .delete()
            .gt('id', '00000000-0000-0000-0000-000000000000'); // delete all

        if (error) {
            toast.error('Dersler silinirken hata oluştu');
            console.error(error);
            return;
        }

        setSlots([]);
        toast.success('Tüm program temizlendi');
    };

    // ─── Handlers ────────────────────────────────────────────────────

    const handleTutorAddClick = (day: DayOfWeek, hour: number) => {
        setTutorBookingModal({ day, hour, initialData: clipboardSlot });
    };

    const handleTutorSlotClick = (slotId: string, studentName: string | undefined) => {
        setDeleteConfirm({ id: slotId, name: studentName || 'Bu ders' });
    };

    const confirmDelete = () => {
        if (deleteConfirm) {
            deleteSlot(deleteConfirm.id);
            setDeleteConfirm(null);
        }
    };

    const handleCopySlot = (slot: TimeSlot) => setClipboardSlot(slot);
    const handleClearClipboard = () => setClipboardSlot(null);
    const handleEditSlot = (slot: TimeSlot) => setEditingSlot(slot);

    const updateSlot = async (data: { title: string; student_name: string; parent_name: string; phone: string; hour: number; minute: number; duration: number; color: string }) => {
        if (!editingSlot) return;

        const updates = {
            title: data.title,
            student_name: data.student_name,
            parent_name: data.parent_name,
            phone: data.phone,
            hour: data.hour,
            minute: data.minute,
            duration: data.duration,
            color: data.color,
        };

        const { error } = await supabase
            .from('lesson_slots')
            .update(updates)
            .eq('id', editingSlot.id);

        if (error) {
            toast.error(`Güncelleme hatası: ${error.message}`);
            console.error(error);
            return;
        }

        setSlots(prev => prev.map(s => s.id === editingSlot.id ? { ...s, ...updates } : s));
        setEditingSlot(null);
        toast.success('Ders güncellendi');
    };

    const handleTutorSave = (data: { title: string; student_name: string; parent_name: string; phone: string; hour: number; minute: number; duration: number; color: string }) => {
        if (tutorBookingModal) {
            const { day } = tutorBookingModal;
            addSlot({
                day,
                hour: data.hour,
                minute: data.minute,
                duration: data.duration,
                is_booked: true,
                title: data.title,
                student_name: data.student_name,
                parent_name: data.parent_name,
                phone: data.phone,
                color: data.color,
            });
            setTutorBookingModal(null);
        }
    };

    const handleStudentBookRequest = (day: DayOfWeek, hour: number) => setStudentBookingModal({ day, hour });

    const confirmStudentBooking = () => {
        if (studentBookingModal) {
            const { day, hour } = studentBookingModal;
            addSlot({
                day,
                hour,
                minute: 0,
                duration: 60,
                is_booked: true,
                title: 'Öğrenci Rezervasyonu',
            });
            setStudentBookingModal(null);
        }
    };

    const handleClearAll = () => {
        setClearAllConfirm(true);
    };

    const confirmClearAll = () => {
        clearAllSlots();
        setClearAllConfirm(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Dersler yükleniyor...</span>
            </div>
        );
    }

    return (
        <div className="pb-32">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <CalendarSvgIcon className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Ders Planlayıcı Pro</h1>
                    </div>
                    <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => { setMode('tutor'); setClipboardSlot(null); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'tutor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <UserSvgIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Öğretmen Modu</span>
                            <span className="sm:hidden">Öğretmen</span>
                        </button>
                        <button onClick={() => { setMode('student'); setClipboardSlot(null); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'student' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <UsersSvgIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Öğrenci Görünümü</span>
                            <span className="sm:hidden">Öğrenci</span>
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {mode === 'tutor' && (
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-500">Ders eklemek için boş kutucuklara tıklayın.</p>
                        <button onClick={handleClearAll} className="text-red-500 text-sm hover:underline">Tümünü Temizle</button>
                    </div>
                )}

                {mode === 'student' && (
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-8">
                        <h2 className="text-emerald-800 font-semibold text-lg mb-1">Ders Rezervasyonu</h2>
                        <p className="text-emerald-600 text-sm">Müsait saatleri (yeşil kutucuklar) seçerek anında rezervasyon yapabilirsiniz.</p>
                    </div>
                )}

                {/* Calendar Grid */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="lg:hidden p-2 bg-yellow-50 text-yellow-700 text-xs text-center border-b border-yellow-100">
                        Tabloyu görmek için yana kaydırın →
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                        <div className="min-w-[800px]">
                            <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
                                <div className="p-4 text-xs font-semibold text-gray-400 text-center sticky left-0 bg-gray-50 border-r border-gray-100">SAAT</div>
                                {DAYS_ORDER.map(day => (
                                    <div key={day} className="p-4 text-sm font-bold text-gray-700 text-center uppercase tracking-wider">{day}</div>
                                ))}
                            </div>
                            {HOURS_ARRAY.map(hour => (
                                <div key={hour} className="grid grid-cols-8 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                                    <div className="p-2 text-xs font-mono text-gray-500 flex items-center justify-center border-r border-gray-100 sticky left-0 bg-white z-10">
                                        {`${hour.toString().padStart(2, '0')}:00`}
                                    </div>
                                    {DAYS_ORDER.map(day => {
                                        const hourStart = hour * 60;
                                        const hourEnd = (hour + 1) * 60;
                                        // Slots that START in this hour (shown with full card)
                                        const cellSlots = slots
                                            .filter(s => s && s.day === day && s.hour === hour)
                                            .sort((a, b) => a.minute - b.minute);
                                        // Check if any slot OVERLAPS this hour (for blocking availability)
                                        const isHourOccupied = slots.some(s => {
                                            if (!s || s.day !== day) return false;
                                            const slotStart = s.hour * 60 + s.minute;
                                            const slotEnd = slotStart + s.duration;
                                            return slotStart < hourEnd && slotEnd > hourStart;
                                        });
                                        return (
                                            <div key={`${day}-${hour}`} className="p-1 min-h-[4rem] flex flex-col gap-1">
                                                {cellSlots.map(slot => (
                                                    <SlotItem key={slot.id} slot={slot} mode={mode}
                                                        onSlotClick={(s) => handleTutorSlotClick(s.id, s.student_name)}
                                                        onCopyClick={handleCopySlot}
                                                        onEditClick={handleEditSlot} />
                                                ))}
                                                {mode === 'tutor' && !isHourOccupied && (
                                                    <SlotItem slot={undefined} mode={mode}
                                                        onAddClick={() => handleTutorAddClick(day, hour)} />
                                                )}
                                                {mode === 'tutor' && isHourOccupied && cellSlots.length === 0 && (
                                                    <div className="h-full min-h-[3rem] p-2 rounded-lg bg-blue-50/50 border border-blue-100 flex items-center justify-center">
                                                        <span className="text-blue-400 text-[10px] font-medium">↑ devam</span>
                                                    </div>
                                                )}
                                                {mode === 'student' && !isHourOccupied && (
                                                    <SlotItem slot={undefined} mode={mode}
                                                        onAddClick={() => handleStudentBookRequest(day, hour)} />
                                                )}
                                                {mode === 'student' && isHourOccupied && cellSlots.length === 0 && (
                                                    <div className="h-full min-h-[3rem] p-2 rounded-lg bg-gray-100 border border-gray-200 opacity-70 flex items-center justify-center">
                                                        <span className="text-gray-500 text-xs font-medium">Dolu</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Clipboard Banner */}
            {clipboardSlot && mode === 'tutor' && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_12px_rgba(0,0,0,0.1)] p-4 z-40">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                                <CopySvgIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Ders Kopyalandı</p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-bold text-indigo-600">{clipboardSlot.student_name || clipboardSlot.title}</span> kopyalandı. Yapıştırmak için takvimde boş bir saate tıklayın.
                                </p>
                            </div>
                        </div>
                        <button onClick={handleClearClipboard} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors" title="İptal">
                            <XSvgIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* Tutor Booking Modal (Add New) */}
            {tutorBookingModal && !editingSlot && (
                <TutorBookingModal
                    day={tutorBookingModal.day}
                    hour={tutorBookingModal.hour}
                    initialData={tutorBookingModal.initialData}
                    onClose={() => setTutorBookingModal(null)}
                    onSave={handleTutorSave}
                />
            )}

            {/* Tutor Booking Modal (Edit Existing) */}
            {editingSlot && (
                <TutorBookingModal
                    day={editingSlot.day}
                    hour={editingSlot.hour}
                    initialData={editingSlot}
                    onClose={() => setEditingSlot(null)}
                    onSave={updateSlot}
                />
            )}

            {/* Student Booking Confirmation */}
            {studentBookingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Rezervasyonu Onayla</h3>
                        <p className="text-gray-600 mb-6">
                            <span className="font-semibold text-indigo-600">{studentBookingModal.day}</span> günü saat <span className="font-semibold text-indigo-600">{studentBookingModal.hour}:00</span> için ders almak istiyor musunuz?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setStudentBookingModal(null)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">İptal</button>
                            <button onClick={confirmStudentBooking}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Onayla</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Dersi Sil</h3>
                        <p className="text-gray-600 mb-6">
                            <span className="font-semibold text-red-600">{deleteConfirm.name}</span> silinecek. Emin misiniz?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">İptal</button>
                            <button onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200">Sil</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear All Confirmation Modal */}
            {clearAllConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Tüm Programı Sil</h3>
                        <p className="text-gray-600 mb-6">Tüm ders programı silinecek. Bu işlem geri alınamaz.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setClearAllConfirm(false)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">İptal</button>
                            <button onClick={confirmClearAll}
                                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200">Tümünü Sil</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DersPlanla;
