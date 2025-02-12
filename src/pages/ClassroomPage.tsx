import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button, List, Modal, Card, Progress, Row, Col, Statistic, Image, Tag, Form, Input, Select, DatePicker } from 'antd';
import { EyeOutlined, CheckCircleOutlined, FieldTimeOutlined, TrophyOutlined, CheckCircleFilled, CloseCircleFilled, PlusOutlined, UserAddOutlined, SettingOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import BadgeList from '../components/Badge/BadgeList';

interface Announcement {
    id: number;
    title: string;
    content: string;
    created_at: string;
    expires_at?: string;
    priority: 'low' | 'normal' | 'high';
    created_by: string;
    class_id: string;
}

interface Assignment {
    id: string;
    title: string;
    description: string;
    assigned_at: string;
    questions: any[];
    status: 'pending' | 'completed';
    score: number | null;
    total_questions?: number;
    answers?: any[];
    duration_minutes?: number;
}

interface ClassMember {
    id: string;
    name: string;
    avatar_url: string;
    points: number;
}

interface ProfileData {
    id: string;
    name: string;
    avatar_url: string;
    points: number;
}

interface QuizData {
    id: string;
    title: string;
    description: string;
    questions: any[];
}

interface ClassStudentData {
    class_id: string;
    profiles: ProfileData;
}

interface QuizAssignmentData {
    quiz_id: string;
    assigned_at: string;
    quiz: QuizData;
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

const fetchClassMembers = async (classId: string): Promise<ClassMember[]> => {
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

    // Veriyi doğru şekilde dönüştür
    const typedData = data?.map(item => ({
        class_id: item.class_id,
        profiles: item.profiles as unknown as ProfileData
    })) as ClassStudentData[];

    // Sadece temel bilgileri döndür
    return typedData?.map(item => ({
        id: item.profiles.id,
        name: item.profiles.name,
        avatar_url: item.profiles.avatar_url,
        points: item.profiles.points
    })) || [];
};

const fetchAssignments = async (classId: string, userId: string): Promise<Assignment[]> => {
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

        // Veriyi doğru şekilde dönüştür
        const typedAssignmentsData = assignmentsData?.map(item => ({
            quiz_id: item.quiz_id,
            assigned_at: item.assigned_at,
            quiz: item.quiz as unknown as QuizData
        })) as QuizAssignmentData[];

        // 2. Bu quizler için kullanıcının sonuçlarını al
        const quizIds = typedAssignmentsData.map(a => a.quiz.id);
        const { data: resultsData, error: resultsError } = await supabase
            .from('assignment_results')
            .select('*')
            .eq('student_id', userId)
            .in('assignment_id', quizIds);

        if (resultsError) throw resultsError;

        // 3. Verileri birleştir
        return typedAssignmentsData.map(assignment => {
            const result = resultsData?.find(r => r.assignment_id === assignment.quiz.id);
            
            return {
                id: assignment.quiz.id,
                title: assignment.quiz.title,
                description: assignment.quiz.description,
                assigned_at: assignment.assigned_at,
                questions: assignment.quiz.questions,
                status: result ? 'completed' as const : 'pending' as const,
                score: result?.score || null,
                total_questions: result?.total_questions || 0,
                answers: result?.answers || [],
                duration_minutes: result?.duration_minutes || null
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

    const fetchAnnouncements = async () => {
        if (!classId) return;

        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .eq('class_id', classId)
            .gte('expires_at', new Date().toISOString())
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Duyurular alınırken hata:', error);
            toast.error('Duyurular yüklenirken bir hata oluştu');
            return;
        }

        setAnnouncements(data || []);
    };
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [classMembers, setClassMembers] = useState<ClassMember[]>([]);
    const [classData, setClassData] = useState<{ name: string; grade: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasClassAccess, setHasClassAccess] = useState(false);
    const [selectedResult, setSelectedResult] = useState<Assignment | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [showAllBadges, setShowAllBadges] = useState(false);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [userBadges, setUserBadges] = useState<any[]>([]);


    // Kullanıcının rozetlerini çek
    const fetchUserBadges = async () => {
        if (!user?.id) return;
        
        const { data, error } = await supabase
            .from('user_badges')
            .select(`
                badge_id,
                earned_at,
                badges:badges(
                    name,
                    description,
                    icon
                )
            `)
            .eq('user_id', user.id);

        if (error) {
            console.error('Rozetler çekilirken hata:', error);
            return;
        }

        setUserBadges(data || []);
    };
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    useEffect(() => {
        if (user) {
            checkClassAccess();
        }
    }, [user, classId]);

    useEffect(() => {
        if (hasClassAccess && classId) {
            fetchClassroomData();
            fetchAnnouncements();
            fetchUserBadges();
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
        if (!hasClassAccess || !classId || !user) return;

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

    const renderAssignmentTitle = (assignment: Assignment) => {
        if (assignment.status === 'completed') {
            return (
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <span>{assignment.title}</span>
                        <span className="text-green-600 text-sm">
                            ({assignment.score}/{assignment.total_questions} puan
                            {assignment.duration_minutes && ` - ${assignment.duration_minutes} dk`})
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            type="text" 
                            icon={<EyeOutlined />} 
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedResult(assignment);
                            }}
                        >
                            Sonuçları Gör
                        </Button>
                        <Button
                            type="primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/assignments/quiz/${assignment.id}`);
                            }}
                        >
                            Tekrar Çöz
                        </Button>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex items-center justify-between w-full">
                <span>{assignment.title}</span>
                <Button
                    type="primary"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/assignments/quiz/${assignment.id}`);
                    }}
                >
                    Başla
                </Button>
            </div>
        );
    };

    // Sonuç modalını kapat
    const handleModalClose = () => {
        setSelectedResult(null);
    };

    // Süreyi formatla
    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (hours === 0) {
            return `${remainingMinutes} dakika`;
        } else {
            return `${hours} saat${remainingMinutes > 0 ? ` ${remainingMinutes} dakika` : ''}`;
        }
    };

    // İstatistikleri hesapla
    const calculateStats = async () => {
        if (!assignments.length || !user?.id || !classId) return null;

        const completedAssignments = assignments.filter(a => a.status === 'completed')
            .sort((a, b) => new Date(a.assigned_at || '').getTime() - new Date(b.assigned_at || '').getTime());
            
        const totalAssignments = assignments.length;
        const completionRate = Math.round((completedAssignments.length / totalAssignments) * 100);

        let totalScore = 0;
        let totalQuestions = 0;
        let totalTime = 0;
        let progressData: any[] = [];
        let cumulativeCorrect = 0;
        let cumulativeWrong = 0;

        completedAssignments.forEach(assignment => {
            totalScore += assignment.score || 0;
            totalQuestions += assignment.total_questions || 0;
            totalTime += assignment.duration_minutes || 0;

            // Her ödev için doğru ve yanlış sayılarını hesapla
            const correctCount = assignment.score || 0;
            const wrongCount = (assignment.total_questions || 0) - correctCount;
            cumulativeCorrect += correctCount;
            cumulativeWrong += wrongCount;

            progressData.push({
                date: new Date(assignment.assigned_at || '').toLocaleDateString('tr-TR'),
                type: 'Doğru',
                value: cumulativeCorrect
            });
            progressData.push({
                date: new Date(assignment.assigned_at || '').toLocaleDateString('tr-TR'),
                type: 'Yanlış',
                value: cumulativeWrong
            });
        });

        const averageScore = totalQuestions ? Math.round((totalScore / totalQuestions) * 100) : 0;
        const averageTime = completedAssignments.length ? Math.round(totalTime / completedAssignments.length) : 0;

        // Sınıftaki tüm öğrencilerin listesini al
        const { data: classStudents } = await supabase
            .from('class_students')
            .select(`
                profiles!inner (
                    id,
                    name,
                    avatar_url
                )
            `)
            .eq('class_id', classId);

        // Her öğrenci için ödev sonuçlarını al
        const studentResults = await Promise.all(
            (classStudents || []).map(async (member: any) => {
                // Öğrencinin tamamlanmış ödevlerini al
                const { data: assignments } = await supabase
                    .from('assignment_results')
                    .select('score, total_questions, status')
                    .eq('student_id', member.profiles.id)
                    .eq('status', 'completed');  // Sadece tamamlanmış ödevler
                
                return {
                    studentId: member.profiles.id,
                    name: member.profiles.name || 'İsimsiz Öğrenci',
                    assignments: assignments || []
                };
            })
        );

        // Her öğrenci için ortalama başarı puanını hesapla
        console.log('Öğrenci sonuçları:', studentResults);

        // Öğrenci puanlarını hesapla ve profilleri güncelle
        const studentAverages = await Promise.all(studentResults.map(async (student) => {
            const studentAssignments = student.assignments || [];
            let studentTotalScore = 0;
            let studentTotalQuestions = 0;

            console.log(`${student.name} için tamamlanmış ödev sonuçları:`, {
                ödevSayısı: studentAssignments.length,
                detaylar: studentAssignments
            });

            studentAssignments.forEach((assignment: any) => {
                studentTotalScore += assignment.score || 0;
                studentTotalQuestions += assignment.total_questions || 0;

                console.log(`- Ödev (${assignment.status}): ${assignment.score || 0}/${assignment.total_questions || 0} doğru`);
            });

            const studentAverage = studentTotalQuestions 
                ? (studentTotalScore / studentTotalQuestions) * 100 
                : 0;

            // Profil puanını güncelle
            const profilePoints = Math.round(studentAverage);
            await supabase
                .from('profiles')
                .update({ points: profilePoints })
                .eq('id', student.studentId);

            const result = {
                studentId: student.studentId,
                name: student.name,
                averageScore: Math.round(studentAverage),
                points: profilePoints
            };

            console.log(`Öğrenci ${student.name} güncellendi:`, {
                ortalama: result.averageScore,
                profilPuanı: result.points
            });
            return result;
        })); // Sıfır puanlı öğrencileri de dahil ediyoruz

        console.log('Filtrelenmiş öğrenci ortalamaları:', studentAverages);

        // Sıralamayı profil puanına göre hesapla
        studentAverages.sort((a, b) => {
            // Önce profil puanına göre sırala
            const pointsDiff = b.points - a.points;
            if (pointsDiff !== 0) return pointsDiff;
            
            // Puanlar eşitse isme göre sırala
            return (a.name || '').localeCompare(b.name || '', 'tr');
        });

        console.log('Sıralanmış öğrenciler:', studentAverages.map(s => ({
            name: s.name,
            ödevPuanı: s.averageScore,
            profilPuanı: s.points,
            id: s.studentId
        })));

        const currentStudentRank = studentAverages.findIndex(student => student.studentId === user.id) + 1;
        const totalStudents = studentAverages.length;

        console.log('Mevcut öğrenci:', {
            id: user.id,
            sıra: currentStudentRank,
            toplamKişi: totalStudents
        });

        return {
            completedCount: completedAssignments.length,
            totalCount: totalAssignments,
            completionRate,
            averageScore,
            averageTime,
            totalTime,
            rank: currentStudentRank,
            totalStudents,
            progressData
        };
    };

    useEffect(() => {
        if (assignments.length && user?.id && classId) {
            calculateStats().then(stats => {
                if (stats) {
                    console.log('Sıralama bilgileri:', {
                        rank: stats.rank,
                        totalStudents: stats.totalStudents,
                        userId: user.id
                    });
                    setStats(stats);
                }
            });
        }
    }, [assignments, user, classId]);

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
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            {classData?.name || 'Sınıf Yükleniyor...'}
                        </h1>
                        <p className="text-lg text-gray-600">Hoş geldin! Burada sınıfınla ilgili her şeyi bulabilirsin.</p>
                    </div>
                    {user?.role === 'teacher' && (
                        <div className="space-x-4">
                            <Button 
                                type="primary"
                                icon={<UserAddOutlined />}
                                onClick={() => setShowInviteModal(true)}
                            >
                                Öğrenci Ekle
                            </Button>
                            <Button 
                                onClick={() => setShowSettingsModal(true)}
                                icon={<SettingOutlined />}
                            >
                                Sınıf Ayarları
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sol Kolon - Duyurular */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-semibold">Duyurular</h2>
                                {user?.role === 'teacher' && (
                                    <Button
                                        type="primary"
                                        onClick={() => setShowAnnouncementModal(true)}
                                        icon={<PlusOutlined />}
                                    >
                                        Yeni Duyuru
                                    </Button>
                                )}
                            </div>

                            {announcements.length > 0 ? (
                                <div className="space-y-4">
                                    {announcements.map((announcement) => (
                                        <Card 
                                            key={announcement.id}
                                            className={`
                                                ${announcement.priority === 'high' ? 'border-red-400 bg-red-50' :
                                                  announcement.priority === 'normal' ? 'border-blue-400 bg-blue-50' :
                                                  'border-gray-400 bg-gray-50'}
                                                border-2
                                            `}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-2">{announcement.title}</h3>
                                                    <p className="text-gray-600 whitespace-pre-wrap">{announcement.content}</p>
                                                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                                        <span>{new Date(announcement.created_at).toLocaleDateString('tr-TR')}</span>
                                                        {announcement.expires_at && (
                                                            <span>• Son tarih: {new Date(announcement.expires_at).toLocaleDateString('tr-TR')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Tag color={
                                                    announcement.priority === 'high' ? 'red' :
                                                    announcement.priority === 'normal' ? 'blue' :
                                                    'default'
                                                }>
                                                    {announcement.priority === 'high' ? 'Önemli' :
                                                     announcement.priority === 'normal' ? 'Normal' :
                                                     'Düşük'}
                                                </Tag>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">Henüz duyuru bulunmuyor.</p>
                            )}
                        </div>

                        {/* Ödevler */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-2xl font-semibold mb-4">Ödevler</h2>
                            
                            {/* Yeni Ödevler */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-4 text-blue-600">Yeni Ödevler</h3>
                                {assignments.filter(a => a.status === 'pending').length > 0 ? (
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={assignments.filter(a => a.status === 'pending')}
                                        renderItem={(assignment) => (
                                            <List.Item>
                                                <List.Item.Meta
                                                    title={renderAssignmentTitle(assignment)}
                                                    description={assignment.description}
                                                />
                                            </List.Item>
                                        )}
                                    />
                                ) : (
                                    <p className="text-gray-500 text-center py-4">Yeni ödev bulunmuyor.</p>
                                )}
                            </div>

                            {/* Tamamlanan Ödevler */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-green-600">Tamamlanan Ödevler</h3>
                                {assignments.filter(a => a.status === 'completed').length > 0 ? (
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={assignments.filter(a => a.status === 'completed')}
                                        renderItem={(assignment) => (
                                            <List.Item>
                                                <List.Item.Meta
                                                    title={renderAssignmentTitle(assignment)}
                                                    description={
                                                        <div>
                                                            <p>{assignment.description}</p>
                                                            <p className="text-green-600 mt-2">
                                                                Puan: {assignment.score}/{assignment.total_questions}
                                                            </p>
                                                        </div>
                                                    }
                                                />
                                            </List.Item>
                                        )}
                                    />
                                ) : (
                                    <p className="text-gray-500 text-center py-4">Henüz tamamlanan ödev yok.</p>
                                )}
                            </div>
                        </div>

                        {/* İstatistikler */}
                        {stats && (
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold mb-4">Ödev İstatistikleri</h3>
                                
                                {/* İstatistik Kartları */}
                                <Row gutter={16} className="mb-8">
                                    <Col span={8}>
                                        <Card>
                                            <Statistic
                                                title="Tamamlanan Ödevler"
                                                value={`${stats.completedCount}/${stats.totalCount}`}
                                                prefix={<CheckCircleOutlined />}
                                                suffix={
                                                    <Progress 
                                                        percent={stats.completionRate} 
                                                        size="small" 
                                                        status="active"
                                                        style={{ marginLeft: 8 }}
                                                    />
                                                }
                                            />
                                        </Card>
                                    </Col>
                                    <Col span={8}>
                                        <Card>
                                            <Statistic
                                                title="Ortalama Başarı"
                                                value={stats.averageScore}
                                                prefix={<TrophyOutlined />}
                                                suffix="%"
                                            />
                                            <Progress 
                                                percent={stats.averageScore} 
                                                size="small" 
                                                status="active"
                                                strokeColor={{
                                                    '0%': '#108ee9',
                                                    '100%': '#87d068',
                                                }}
                                            />
                                        </Card>
                                    </Col>
                                    <Col span={8}>
                                        <Card>
                                            <Statistic
                                                title="Ortalama Süre"
                                                value={stats.averageTime}
                                                prefix={<FieldTimeOutlined />}
                                                suffix="dakika"
                                            />
                                            <div className="text-xs text-gray-500 mt-2">
                                                Toplam: {formatDuration(stats.totalTime || 0)}
                                            </div>
                                        </Card>
                                    </Col>

                                </Row>

                                {/* İlerleme Grafiği */}
                                {stats.progressData && stats.progressData.length > 0 && (
                                    <Card title="Doğru/Yanlış İlerlemesi" className="mt-4">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart
                                                data={stats.progressData}
                                                margin={{
                                                    top: 5,
                                                    right: 30,
                                                    left: 20,
                                                    bottom: 5,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sağ Kolon - Sınıf Arkadaşları */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            {/* Öğrencinin kendi kartı */}
                            {classMembers.find(member => member.id === user?.id) && (
                                <div className="flex items-center space-x-4 p-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                                    <img 
                                        src={classMembers.find(member => member.id === user?.id)?.avatar_url || '/default-avatar.png'} 
                                        alt="Profil" 
                                        className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                                    />
                                    <div>
                                        <div className="text-sm text-blue-600 font-medium">Hoş geldin</div>
                                        <div className="text-xl font-semibold text-gray-800">
                                            {classMembers.find(member => member.id === user?.id)?.name}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Rozetler */}
                            <div className="mt-4 mb-8">
                                <h3 className="text-lg font-semibold mb-4">Rozetlerin</h3>

                                <BadgeList
                                    badges={userBadges.map(badge => ({
                                        id: badge.badge_id,
                                        name: badge.badges.name,
                                        description: badge.badges.description,
                                        icon: badge.badges.icon,
                                        earnedAt: badge.earned_at
                                    }))}
                                />



                                {/* Duyuru Ekleme Modal */}
                                <Modal
                                    title="Yeni Duyuru"
                                    open={showAnnouncementModal}
                                    onCancel={() => setShowAnnouncementModal(false)}
                                    footer={null}
                                >
                                    <Form
                                        onFinish={async (values) => {
                                            const { error } = await supabase
                                                .from('announcements')
                                                .insert([
                                                    {
                                                        class_id: classId,
                                                        title: values.title,
                                                        content: values.content,
                                                        priority: values.priority,
                                                        expires_at: values.expires_at?.toISOString(),
                                                        created_by: user?.id
                                                    }
                                                ]);

                                            if (error) {
                                                console.error('Duyuru eklenirken hata:', error);
                                                toast.error('Duyuru eklenirken bir hata oluştu');
                                                return;
                                            }

                                            toast.success('Duyuru başarıyla eklendi');
                                            setShowAnnouncementModal(false);
                                            fetchAnnouncements();
                                        }}
                                        layout="vertical"
                                    >
                                        <Form.Item
                                            name="title"
                                            label="Başlık"
                                            rules={[{ required: true, message: 'Lütfen başlık girin' }]}
                                        >
                                            <Input />
                                        </Form.Item>

                                        <Form.Item
                                            name="content"
                                            label="İçerik"
                                            rules={[{ required: true, message: 'Lütfen içerik girin' }]}
                                        >
                                            <Input.TextArea rows={4} />
                                        </Form.Item>

                                        <Form.Item
                                            name="priority"
                                            label="Öncelik"
                                            initialValue="normal"
                                        >
                                            <Select>
                                                <Select.Option value="low">Düşük</Select.Option>
                                                <Select.Option value="normal">Normal</Select.Option>
                                                <Select.Option value="high">Önemli</Select.Option>
                                            </Select>
                                        </Form.Item>

                                        <Form.Item
                                            name="expires_at"
                                            label="Son Geçerlilik Tarihi"
                                        >
                                            <DatePicker 
                                                showTime 
                                                format="DD.MM.YYYY HH:mm"
                                                placeholder="Seçmek için tıklayın"
                                            />
                                        </Form.Item>

                                        <Form.Item>
                                            <Button type="primary" htmlType="submit" block>
                                                Duyuru Ekle
                                            </Button>
                                        </Form.Item>
                                    </Form>
                                </Modal>

                                {/* Öğrenci Davet Modalı */}
                                <Modal
                                    title="Öğrenci Ekle"
                                    open={showInviteModal}
                                    onCancel={() => setShowInviteModal(false)}
                                    footer={null}
                                >
                                    <Form
                                        onFinish={async (values) => {
                                            const { error } = await supabase
                                                .from('class_students')
                                                .insert([
                                                    {
                                                        class_id: classId,
                                                        student_id: values.student_id,
                                                        role: 'student'
                                                    }
                                                ]);

                                            if (error) {
                                                console.error('Öğrenci eklenirken hata:', error);
                                                toast.error('Öğrenci eklenirken bir hata oluştu');
                                                return;
                                            }

                                            toast.success('Öğrenci başarıyla eklendi');
                                            setShowInviteModal(false);
                                            if (classId) fetchClassMembers(classId);
                                        }}
                                        layout="vertical"
                                    >
                                        <Form.Item
                                            name="student_id"
                                            label="Öğrenci ID"
                                            rules={[{ required: true, message: 'Lütfen öğrenci ID girin' }]}
                                        >
                                            <Input placeholder="Örn: 123e4567-e89b-12d3-a456-426614174000" />
                                        </Form.Item>

                                        <Form.Item>
                                            <Button type="primary" htmlType="submit" block>
                                                Öğrenci Ekle
                                            </Button>
                                        </Form.Item>
                                    </Form>
                                </Modal>
                            </div>

                            {/* Sınıf Ayarları Modalı */}
                            <Modal
                                title="Sınıf Ayarları"
                                open={showSettingsModal}
                                onCancel={() => setShowSettingsModal(false)}
                                footer={null}
                            >
                                <Form
                                    onFinish={async (values) => {
                                        const { error } = await supabase
                                            .from('classes')
                                            .update({
                                                name: values.name,
                                                grade: values.grade
                                            })
                                            .eq('id', classId);

                                        if (error) {
                                            console.error('Sınıf güncellenirken hata:', error);
                                            toast.error('Sınıf güncellenirken bir hata oluştu');
                                            return;
                                        }

                                        toast.success('Sınıf başarıyla güncellendi');
                                        setShowSettingsModal(false);
                                        if (classId) fetchClassData(classId);
                                    }}
                                    layout="vertical"
                                    initialValues={{
                                        name: classData?.name,
                                        grade: classData?.grade
                                    }}
                                >
                                    <Form.Item
                                        name="name"
                                        label="Sınıf Adı"
                                        rules={[{ required: true, message: 'Lütfen sınıf adı girin' }]}
                                    >
                                        <Input />
                                    </Form.Item>

                                    <Form.Item
                                        name="grade"
                                        label="Sınıf Seviyesi"
                                        rules={[{ required: true, message: 'Lütfen sınıf seviyesi seçin' }]}
                                    >
                                        <Select>
                                            {[5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                                                <Select.Option key={grade} value={grade}>
                                                    {grade}. Sınıf
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" block>
                                            Değişiklikleri Kaydet
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </Modal>

                            {/* Tüm Rozetler Modal */}
                            <Modal
                                title="Tüm Rozetler"
                                open={showAllBadges}
                                onCancel={() => setShowAllBadges(false)}
                                footer={null}
                                width={800}
                            >
                                <BadgeList
                                    badges={[
                                        {
                                            id: '1',
                                            name: 'İlk Ödev',
                                            description: 'İlk ödevini tamamladın!',
                                            icon: '🎥',
                                            earnedAt: '2025-02-01'
                                        },
                                        {
                                            id: '2',
                                            name: 'Hızlı Çözücü',
                                            description: 'Bu rozeti kazanmak için: Herhangi bir ödevi 5 dakikadan kısa sürede %100 doğru cevaplamalısın.',
                                            icon: '⚡',
                                            isLocked: true
                                        },
                                        {
                                            id: '3',
                                            name: 'Mükemmel',
                                            description: 'Bir ödevden tam puan aldın!',
                                            icon: '⭐',
                                            earnedAt: '2025-02-10'
                                        },
                                        {
                                            id: '4',
                                            name: 'Şampiyon',
                                            description: 'Bu rozeti kazanmak için: 10 farklı ödevden tam puan almalısın. Şu ana kadar 2/10 ödevi tamamladın.',
                                            icon: '🏆',
                                            isLocked: true
                                        },
                                        {
                                            id: '5',
                                            name: 'Çalışkan',
                                            description: 'Bu rozeti kazanmak için: 30 gün üst üste en az 1 ödev yapmalısın. Şu ana kadar en uzun serien: 3 gün.',
                                            icon: '📚',
                                            isLocked: true
                                        }
                                    ]}
                                />
                            </Modal>

                            <h2 className="text-2xl font-semibold mb-4">Sınıf Arkadaşların</h2>
                            <div className="space-y-4">
                                {classMembers.filter(member => member.id !== user?.id).map((member) => (
                                    <div 
                                        key={member.id} 
                                        className="flex items-center space-x-4 p-2 hover:bg-gray-50 rounded-lg"
                                    >
                                        <img 
                                            src={member.avatar_url || '/default-avatar.png'} 
                                            alt={member.name} 
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-medium">{member.name}</h3>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sonuç Modalı */}
            <Modal
                title="Ödev Sonuçları"
                open={selectedResult !== null}
                onCancel={handleModalClose}
                footer={null}
                width={800}
            >
                {selectedResult && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{selectedResult.title}</h3>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-lg">
                                Toplam Puan: <span className="font-bold text-green-600">{selectedResult.score}/{selectedResult.total_questions}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                                Tamamlanma Tarihi: {new Date(selectedResult.assigned_at).toLocaleDateString('tr-TR')}
                            </p>
                            {selectedResult.duration_minutes && (
                                <p className="text-sm text-gray-600">
                                    Tamamlanma Süresi: {formatDuration(selectedResult.duration_minutes)}
                                </p>
                            )}
                        </div>
                        
                        {/* Sorular ve Cevaplar */}
                        <div className="mt-6">
                            <h4 className="font-semibold mb-4">Soru Detayları</h4>
                            <div className="space-y-6">
                                {selectedResult.answers?.map((answer: any, index: number) => (
                                    <Card 
                                        key={index}
                                        className={`border-l-4 ${answer.isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}
                                        title={
                                            <div className="flex items-center gap-2">
                                                <span>Soru {answer.questionNumber}</span>
                                                {answer.isCorrect ? (
                                                    <Tag color="success" icon={<CheckCircleFilled />}>Doğru</Tag>
                                                ) : (
                                                    <Tag color="error" icon={<CloseCircleFilled />}>Yanlış</Tag>
                                                )}
                                                {answer.isTimeout && (
                                                    <Tag color="warning">Süre Doldu</Tag>
                                                )}
                                            </div>
                                        }
                                    >
                                        <div className="flex gap-6">
                                            {/* Sol Taraf - Soru Resmi */}
                                            <div className="flex-1">
                                                {answer.questionImage && (
                                                    <div className="mb-4">
                                                        <Image
                                                            src={answer.questionImage}
                                                            alt={`Soru ${answer.questionNumber}`}
                                                            style={{ maxHeight: '300px', objectFit: 'contain' }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Sağ Taraf - Seçenekler */}
                                            <div className="flex-1">
                                                <div className="grid grid-cols-1 gap-3">
                                                    {answer.options?.map((option: any, optIndex: number) => (
                                                        <div 
                                                            key={option.id}
                                                            className={`p-3 rounded-lg border flex items-center gap-3 ${
                                                                option.id === answer.selectedOption && option.id === answer.correctOption
                                                                    ? 'bg-green-50 border-green-500'
                                                                    : option.id === answer.selectedOption
                                                                    ? 'bg-red-50 border-red-500'
                                                                    : option.id === answer.correctOption
                                                                    ? 'bg-green-50 border-green-500'
                                                                    : 'border-gray-200'
                                                            }`}
                                                        >
                                                            <div className="w-6 h-6 flex items-center justify-center rounded-full border font-medium">
                                                                {String.fromCharCode(65 + optIndex)}
                                                            </div>
                                                            
                                                            {option.imageUrl && (
                                                                <div className="flex-1">
                                                                    <Image
                                                                        src={option.imageUrl}
                                                                        alt={`Seçenek ${optIndex + 1}`}
                                                                        style={{ maxHeight: '100px', objectFit: 'contain' }}
                                                                    />
                                                                </div>
                                                            )}
                                                            
                                                            <div className="text-xs text-gray-500 mt-2">
                                                                {option.id === answer.selectedOption && (
                                                                    <Tag color={option.id === answer.correctOption ? "success" : "error"}>
                                                                        Senin Cevabın
                                                                    </Tag>
                                                                )}
                                                                {option.id === answer.correctOption && (
                                                                    <Tag color="success">
                                                                        Doğru Cevap
                                                                    </Tag>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Video Çözümü - Altta */}
                                        {answer.solutionVideo && (
                                            <div className="mt-6 pt-4 border-t">
                                                <h5 className="font-semibold mb-2">Video Çözüm</h5>
                                                <video 
                                                    controls 
                                                    src={answer.solutionVideo}
                                                    style={{ maxWidth: '100%', maxHeight: '200px' }}
                                                />
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ClassroomPage;
