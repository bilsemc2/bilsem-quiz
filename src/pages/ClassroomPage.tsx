import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Announcement {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

interface Assignment {
    id: string;
    title: string;
    description: string;
    assigned_at: string;
    questions: any[];
    status: 'pending' | 'completed';
    score: number | null;
}

interface ClassMember {
    id: string;
    name: string;
    avatar_url: string;
    points: number;
}

// Yardımcı fonksiyonlar
const fetchClassData = async (classId: string) => {
    const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();
    
    if (error) throw error;
    if (!data) throw new Error('Sınıf bulunamadı');
    
    return data;
};

const fetchClassMembers = async (classId: string) => {
    const { data, error } = await supabase
        .from('class_students')
        .select(`
            class_id,
            profiles!inner(
                id,
                name,
                avatar_url,
                points
            )
        `)
        .eq('class_id', classId);
    
    if (error) throw error;
    return data?.map(item => item.profiles) || [];
};

const fetchAssignments = async (classId: string, userId: string) => {
    try {
        // 1. Sınıfa atanmış quizleri al
        const { data: assignmentsData, error: assignmentsError } = await supabase
            .from('quiz_class_assignments')
            .select(`
                quiz_id,
                assigned_at,
                quiz:assignments (
                    id,
                    title,
                    description,
                    questions
                )
            `)
            .eq('class_id', classId)
            .order('assigned_at', { ascending: true });

        if (assignmentsError) throw assignmentsError;

        if (!assignmentsData?.length) return [];

        // 2. Bu quizler için kullanıcının sonuçlarını al
        const quizIds = assignmentsData.map(a => a.quiz.id);
        const { data: resultsData, error: resultsError } = await supabase
            .from('quiz_results')
            .select('*')
            .eq('user_id', userId)
            .in('quiz_id', quizIds);

        if (resultsError) throw resultsError;

        // 3. Verileri birleştir
        return assignmentsData.map(assignment => {
            const result = resultsData?.find(r => r.quiz_id === assignment.quiz.id);
            
            return {
                id: assignment.quiz.id,
                title: assignment.quiz.title,
                description: assignment.quiz.description,
                assigned_at: assignment.assigned_at,
                questions: assignment.quiz.questions,
                status: result ? 'completed' : 'pending',
                score: result?.score || null
            };
        });
    } catch (error) {
        console.error('Quiz atamaları yüklenirken hata:', error);
        throw error;
    }
};

const checkStudentAccess = async (userId: string, classId: string) => {
    const { data, error } = await supabase
        .from('class_students')
        .select('*')
        .eq('class_id', classId)
        .eq('student_id', userId)
        .single();
    
    if (error) throw error;
    return !!data;
};

// Wrapper fonksiyon
const withErrorHandling = async <T,>(
    operation: () => Promise<T>,
    errorMessage: string,
    onError?: () => void
): Promise<T | null> => {
    try {
        return await operation();
    } catch (error) {
        console.error(`${errorMessage}:`, error);
        toast.error(errorMessage);
        onError?.();
        return null;
    }
};

export const ClassroomPage: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [classMembers, setClassMembers] = useState<ClassMember[]>([]);
    const [classData, setClassData] = useState<{ name: string; grade: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasClassAccess, setHasClassAccess] = useState(false);

    useEffect(() => {
        if (user) {
            checkClassAccess();
        }
    }, [user, classId]);

    useEffect(() => {
        if (hasClassAccess && classId) {
            fetchClassroomData();
        }
    }, [hasClassAccess, classId]);

    const checkClassAccess = async () => {
        setLoading(true);
        
        if (!classId || !user) {
            setHasClassAccess(false);
            toast.error('Geçersiz sınıf bilgisi.');
            navigate('/profile');
            return;
        }

        const result = await withErrorHandling(
            () => checkStudentAccess(user.id, classId),
            'Sınıf erişimi kontrol edilirken hata oluştu',
            () => navigate('/profile')
        );

        setHasClassAccess(!!result);
        setLoading(false);
    };

    const fetchClassroomData = async () => {
        if (!hasClassAccess || !classId) return;

        setLoading(true);
        console.log('Sınıf verileri yükleniyor...');

        const classData = await withErrorHandling(
            () => fetchClassData(classId),
            'Sınıf verileri yüklenirken hata oluştu'
        );

        if (classData) {
            console.log('Sınıf bulundu:', classData);
            setClassData(classData);
            
            // Sınıf üyelerini getir
            const members = await withErrorHandling(
                () => fetchClassMembers(classId),
                'Sınıf üyeleri yüklenirken hata oluştu'
            );

            if (members) {
                console.log('Sınıf üyeleri:', members);
                setClassMembers(members);
            }

            // Ödevleri getir
            const assignments = await withErrorHandling(
                () => fetchAssignments(classId, user.id),
                'Ödevler yüklenirken hata oluştu'
            );

            if (assignments) {
                console.log('Ödevler:', assignments);
                setAssignments(assignments);
            }
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!hasClassAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                    <div className="text-red-500 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Erişim Reddedildi</h2>
                    <p className="text-gray-600 mb-4">Bu sınıfta kaydınız bulunmamaktadır. Profil sayfasına yönlendiriliyorsunuz.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        {classData?.name || 'Sınıf Yükleniyor...'}
                    </h1>
                    <p className="text-lg text-gray-600">Hoş geldin! Burada sınıfınla ilgili her şeyi bulabilirsin.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sol Kolon - Duyurular */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                            <h2 className="text-2xl font-semibold mb-4">Duyurular</h2>
                            {announcements.length > 0 ? (
                                <div className="space-y-4">
                                    {announcements.map((announcement) => (
                                        <div key={announcement.id} className="border-l-4 border-blue-500 pl-4 py-3">
                                            <h3 className="font-semibold text-lg">{announcement.title}</h3>
                                            <p className="text-gray-600 mt-1">{announcement.content}</p>
                                            <span className="text-sm text-gray-500 mt-2 block">
                                                {new Date(announcement.created_at).toLocaleDateString('tr-TR')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">Henüz duyuru bulunmuyor.</p>
                            )}
                        </div>

                        {/* Ödevler */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-2xl font-semibold mb-4">Ödevler</h2>
                            {assignments.length > 0 ? (
                                <div className="space-y-4">
                                    {assignments.map((assignment) => (
                                        <div
                                            key={assignment.id}
                                            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {assignment.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {assignment.description}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Atanma: {new Date(assignment.assigned_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    {assignment.status === 'completed' ? (
                                                        <div className="flex items-center">
                                                            <span className="text-green-600 font-medium mr-2">
                                                                {assignment.score}/10
                                                            </span>
                                                            <svg
                                                                className="h-6 w-6 text-green-500"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => navigate(`/assignment-quiz/${assignment.id}`)}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                                        >
                                                            Başla
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">Aktif ödev bulunmuyor.</p>
                            )}
                        </div>
                    </div>

                    {/* Sağ Kolon - Sınıf Arkadaşları */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-2xl font-semibold mb-4">Sınıf Arkadaşların</h2>
                            <div className="space-y-4">
                                {classMembers.map((member) => (
                                    <div key={member.id} className="flex items-center space-x-4 p-2 hover:bg-gray-50 rounded-lg">
                                        <img 
                                            src={member.avatar_url || '/default-avatar.png'} 
                                            alt={member.name} 
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-medium">{member.name}</h3>
                                            <p className="text-sm text-gray-500">{member.points} puan</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassroomPage;
