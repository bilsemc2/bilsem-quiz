import React, { useState, useEffect } from 'react';
import { Table, Button, Select, Card, Tabs, Modal, Spin, message } from 'antd';
import { DownloadOutlined, FileTextOutlined, UserOutlined, BarChartOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
// @ts-ignore - jspdf-autotable tiplemeleri için
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
    lastAutoTable: {
      finalY: number;
    } | undefined;
  }
}
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Chart.js kayıt
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const { Option } = Select;

interface Student {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  completed_assignments: number;
  avg_score: number;
  total_time: number;
}

interface Class {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  title: string;
  completed_at: string;
  score: number;
  duration_minutes: number;
  question_count: number;
  correct_count: number;
  incorrect_count: number;
}

const StudentManagement: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentDetails, setStudentDetails] = useState<any>({
    assignments: [],
    performanceData: {
      scores: [],
      dates: [],
      completionRates: []
    }
  });
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);

  // Öğretmenin sınıflarını yükle
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) {
          throw new Error('Kullanıcı bulunamadı');
        }
        
        const { data, error } = await supabase
          .from('classes')
          .select('id, name')
          .eq('teacher_id', user.user.id);
          
        if (error) throw error;
        
        setClasses(data || []);
        if (data && data.length > 0) {
          setSelectedClass(data[0].id);
        }
      } catch (error) {
        console.error('Sınıflar yüklenirken hata:', error);
        message.error('Sınıflar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClasses();
  }, []);

  // Seçili sınıftaki öğrencileri yükle
  useEffect(() => {
    if (!selectedClass) return;
    
    const fetchStudents = async () => {
      setLoading(true);
      try {
        // Sınıftaki öğrencileri ve özet istatistiklerini al
        const { data, error } = await supabase.rpc('get_class_students_overview', {
          class_id: selectedClass
        });
        
        if (error) throw error;
        
        setStudents(data || []);
      } catch (error) {
        console.error('Öğrenciler yüklenirken hata:', error);
        message.error('Öğrenciler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, [selectedClass]);

  // Öğrenci detaylarını getir
  const fetchStudentDetails = async (studentId: string) => {
    setDetailsLoading(true);
    try {
      // Öğrencinin tamamladığı ödevleri al
      const { data: assignments, error: assignmentsError } = await supabase.rpc(
        'get_student_assignments', 
        { student_id: studentId, class_id: selectedClass }
      );
      
      if (assignmentsError) throw assignmentsError;
      
      // Öğrencinin performans verilerini al (grafik için)
      const { data: performanceData, error: performanceError } = await supabase.rpc(
        'get_student_performance_over_time',
        { student_id: studentId, class_id: selectedClass }
      );
      
      if (performanceError) throw performanceError;
      
      const chartData = {
        scores: performanceData?.map((item: any) => item.score) || [],
        dates: performanceData?.map((item: any) => item.completed_at.split('T')[0]) || [],
        completionRates: performanceData?.map((item: any) => item.completion_rate) || []
      };
      
      setStudentDetails({
        assignments: assignments || [],
        performanceData: chartData
      });
    } catch (error) {
      console.error('Öğrenci detayları yüklenirken hata:', error);
      message.error('Öğrenci detayları yüklenirken bir hata oluştu.');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Öğrenci detaylarını göster
  const showStudentDetails = (student: Student) => {
    setSelectedStudent(student);
    setDetailModalVisible(true);
    fetchStudentDetails(student.id);
  };

  // PDF Raporu oluştur
  const generateReport = (student: Student) => {
    const doc = new jsPDF();
    
    // Türkçe karakter desteği için Roboto fontunu ekle
    doc.addFont('/fonts/Roboto/Roboto-VariableFont_wdth,wght.ttf', 'Roboto', 'normal');
    doc.addFont('/fonts/Roboto/Roboto-Italic-VariableFont_wdth,wght.ttf', 'Roboto', 'italic');
    doc.setFont('Roboto');
    
    // Başlık
    doc.setFontSize(18);
    doc.text(`${student.name} - Öğrenci Raporu`, 14, 22);
    
    // Tarih
    doc.setFontSize(11);
    doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 30);
    
    // Özet Bilgiler
    doc.setFontSize(14);
    doc.text('Öğrenci Özeti', 14, 40);
    
    doc.setFontSize(10);
    doc.text(`Tamamlanan Ödev Sayısı: ${student.completed_assignments}`, 14, 50);
    doc.text(`Ortalama Puan: ${student.avg_score.toFixed(1)}`, 14, 56);
    doc.text(`Toplam Çalışma Süresi: ${(student.total_time / 60).toFixed(1)} saat`, 14, 62);
    
    // Toplam soru istatistikleri
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    
    studentDetails.assignments.forEach((assignment: Assignment) => {
      totalQuestions += assignment.question_count;
      // Score doğru sayısını temsil ediyor
      totalCorrect += Math.round(assignment.score);
      totalIncorrect += assignment.question_count - Math.round(assignment.score);
    });
    
    doc.text(`Toplam Soru Sayısı: ${totalQuestions}`, 14, 68);
    doc.text(`Doğru Sayısı: ${totalCorrect}`, 120, 50);
    doc.text(`Yanlış Sayısı: ${totalIncorrect}`, 120, 56);
    
    // Tamamlanan Ödevler Tablosu
    if (studentDetails.assignments.length > 0) {
      doc.setFontSize(14);
      doc.text('Tamamlanan Ödevler', 14, 75);
      
      const tableColumn = ["Ödev Adı", "Tamamlanma Tarihi", "Puan", "Süre (dk)", "Sorular", "Doğru", "Yanlış"];
      const tableRows = studentDetails.assignments.map((assignment: any) => [
        assignment.title,
        new Date(assignment.completed_at).toLocaleDateString('tr-TR'),
        `${Math.round(assignment.score)}`,
        assignment.duration_minutes,
        assignment.question_count,
        Math.round(assignment.score),
        assignment.question_count - Math.round(assignment.score)
      ]);
      
      autoTable(doc, {
        startY: 80,
        head: [tableColumn],
        body: tableRows,
        styles: { font: 'Roboto', fontStyle: 'normal' },
        headStyles: { font: 'Roboto', fontStyle: 'normal' },
        bodyStyles: { font: 'Roboto', fontStyle: 'normal' }
      });
    }
    
    // Veliye Not
    const currentY = doc.lastAutoTable?.finalY || 120;
    doc.setFontSize(14);
    doc.text('Veliye Not', 14, currentY + 10);
    
    doc.setFontSize(10);
    doc.text(
      'Bu rapor, öğrencinin dijital öğrenme platformundaki performansını göstermektedir. ' + 
      'Detaylı bilgi için öğretmen ile iletişime geçebilirsiniz.', 
      14, currentY + 20, { maxWidth: 180 }
    );
    
    // Dosyayı indir
    doc.save(`${student.name.replace(/\s+/g, '_')}_Rapor.pdf`);
    message.success('Rapor başarıyla oluşturuldu!');
  };

  // Tablo sütunları
  const columns = [
    {
      title: 'Öğrenci',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Student) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {record.avatar_url ? (
              <img src={record.avatar_url} alt={text} className="w-full h-full object-cover" />
            ) : (
              <UserOutlined />
            )}
          </div>
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: 'Tamamlanan Ödevler',
      dataIndex: 'completed_assignments',
      key: 'completed_assignments',
      sorter: (a: Student, b: Student) => a.completed_assignments - b.completed_assignments,
    },
    {
      title: 'Ortalama Doğru Sayısı',
      dataIndex: 'avg_score',
      key: 'avg_score',
      render: (score: number) => `${score.toFixed(1)}`,
      sorter: (a: Student, b: Student) => a.avg_score - b.avg_score,
    },
    {
      title: 'Toplam Süre',
      dataIndex: 'total_time',
      key: 'total_time',
      render: (time: number) => `${(time / 60).toFixed(1)} saat`,
      sorter: (a: Student, b: Student) => a.total_time - b.total_time,
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: Student) => (
        <div className="space-x-2">
          <Button 
            icon={<FileTextOutlined />} 
            onClick={() => showStudentDetails(record)}
            title="Detayları Görüntüle"
          >
            Detaylar
          </Button>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={() => generateReport(record)}
            title="Veli Raporu Oluştur"
          >
            Rapor
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="student-management">
      <Card title="Öğrenci Yönetimi" className="mb-6">
        <div className="mb-4">
          <Select
            placeholder="Sınıf Seçin"
            style={{ width: 300 }}
            value={selectedClass}
            onChange={setSelectedClass}
            loading={loading && classes.length === 0}
          >
            {classes.map(c => (
              <Option key={c.id} value={c.id}>{c.name}</Option>
            ))}
          </Select>
        </div>
        
        <Table
          columns={columns}
          dataSource={students}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loading}
          locale={{ emptyText: 'Veri bulunamadı' }}
        />
      </Card>
      
      {/* Öğrenci Detay Modalı */}
      <Modal
        title={selectedStudent ? `${selectedStudent.name} - Öğrenci Detayları` : 'Öğrenci Detayları'}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Kapat
          </Button>,
          <Button 
            key="report" 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={() => selectedStudent && generateReport(selectedStudent)}
          >
            Veli Raporu Oluştur
          </Button>
        ]}
        width={800}
      >
        {detailsLoading ? (
          <div className="py-10 text-center">
            <Spin size="large" />
            <div className="mt-3">Öğrenci bilgileri yükleniyor...</div>
          </div>
        ) : (
          <Tabs 
            defaultActiveKey="assignments"
            items={[
              {
                key: 'assignments',
                label: 'Tamamlanan Ödevler',
                children: (
                  <Table
                    dataSource={studentDetails.assignments.map((item: Assignment, index: number) => ({
                      ...item,
                      uniqueKey: `assignment-${item.id}-${index}` // Benzersiz anahtar ekliyoruz
                    }))}
                    rowKey="uniqueKey"
                    pagination={{ pageSize: 5 }}
                    columns={[
                      {
                        title: 'Ödev Adı',
                        dataIndex: 'title',
                        key: 'title',
                      },
                      {
                        title: 'Tamamlanma Tarihi',
                        dataIndex: 'completed_at',
                        key: 'completed_at',
                        render: (date: string) => new Date(date).toLocaleDateString('tr-TR'),
                      },
                      {
                        title: 'Doğru Sayısı',
                        dataIndex: 'score',
                        key: 'score',
                        render: (score: number) => `${Math.round(score)}`,
                      },
                      {
                        title: 'Süre',
                        dataIndex: 'duration_minutes',
                        key: 'duration_minutes',
                        render: (mins: number) => `${mins} dakika`,
                      },
                    ]}
                  />
                )
              },
              {
                key: 'performance',
                label: 'Performans Grafiği',
                children: (
                  <div className="performance-chart">
                    {studentDetails.performanceData.dates.length > 0 ? (
                      <Bar
                        data={{
                          labels: studentDetails.performanceData.dates,
                          datasets: [
                            {
                              label: 'Puan (%)',
                              data: studentDetails.performanceData.scores,
                              backgroundColor: 'rgba(54, 162, 235, 0.5)',
                              borderColor: 'rgba(54, 162, 235, 1)',
                              borderWidth: 1,
                            },
                            {
                              label: 'Tamamlama Oranı (%)',
                              data: studentDetails.performanceData.completionRates,
                              backgroundColor: 'rgba(75, 192, 192, 0.5)',
                              borderColor: 'rgba(75, 192, 192, 1)',
                              borderWidth: 1,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            title: {
                              display: true,
                              text: 'Zaman İçinde Öğrenci Performansı',
                            },
                          },
                        }}
                      />
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        <BarChartOutlined style={{ fontSize: 48 }} className="mb-2" />
                        <p>Performans verisi bulunamadı.</p>
                      </div>
                    )}
                  </div>
                )
              }
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default StudentManagement;
