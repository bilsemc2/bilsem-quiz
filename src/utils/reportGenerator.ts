import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

// jspdf-autotable tiplemeleri için
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => any;
        lastAutoTable: {
            finalY: number;
        } | undefined;
    }
}

interface Student {
    id: string;
    name: string;
    completed_assignments: number;
    avg_score: number;
    total_time: number;
}

interface Assignment {
    id: string;
    title: string;
    completed_at: string;
    score: number;
    duration_minutes: number;
    question_count: number;
}

export const generateStudentReport = (student: Student, assignments: Assignment[]) => {
    try {
        const doc = new jsPDF();

        // Türkçe karakter desteği için Roboto fontunu ekle
        // Not: Fontların public klasöründe olması gerekir
        try {
            doc.addFont('/fonts/Roboto/Roboto-VariableFont_wdth,wght.ttf', 'Roboto', 'normal');
            doc.addFont('/fonts/Roboto/Roboto-Italic-VariableFont_wdth,wght.ttf', 'Roboto', 'italic');
            doc.setFont('Roboto');
        } catch (fontError) {
            console.warn('Roboto fontu yüklenemedi, varsayılan font kullanılıyor:', fontError);
        }

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

        assignments.forEach((assignment) => {
            totalQuestions += assignment.question_count;
            totalCorrect += Math.round(assignment.score);
            totalIncorrect += assignment.question_count - Math.round(assignment.score);
        });

        doc.text(`Toplam Soru Sayısı: ${totalQuestions}`, 14, 68);
        doc.text(`Doğru Sayısı: ${totalCorrect}`, 120, 50);
        doc.text(`Yanlış Sayısı: ${totalIncorrect}`, 120, 56);

        // Tamamlanan Ödevler Tablosu
        if (assignments.length > 0) {
            doc.setFontSize(14);
            doc.text('Tamamlanan Ödevler', 14, 75);

            const tableColumn = ["Ödev Adı", "Tamamlanma Tarihi", "Puan", "Süre (dk)", "Sorular", "Doğru", "Yanlış"];
            const tableRows = assignments.map((assignment) => [
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
        const currentY = (doc as any).lastAutoTable?.finalY || 120;
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
        toast.success('Rapor başarıyla oluşturuldu!');
    } catch (error) {
        console.error('PDF oluşturma hatası:', error);
        toast.error('Rapor oluşturulurken bir hata oluştu.');
    }
};
