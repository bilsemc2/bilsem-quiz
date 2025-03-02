import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface ProgressGraphsProps {
    stats: {
        level: number;
        experience: number;
        quizHistory: Array<{
            date: string;
            score: number;
            totalQuestions: number;
        }>;
        completedQuizzes: number;
        correctAnswers: number;
        wrongAnswers: number;
    };
}

export const ProgressGraphs: React.FC<ProgressGraphsProps> = ({ stats }) => {
    // Quiz Performance Line Chart Data
    const quizPerformanceData = {
        labels: stats.quizHistory.map(entry => {
            const date = new Date(entry.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        }),
        datasets: [
            {
                label: 'Quiz Performansı',
                data: stats.quizHistory.map(entry => (entry.score / entry.totalQuestions) * 100),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.4,
            },
        ],
    };

    // Quiz Performance Line Chart Options
    const lineOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Quiz Performans Grafiği',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Başarı Yüzdesi',
                },
            },
        },
    };

    // Answer Distribution Doughnut Chart Data
    const answerDistributionData = {
        labels: ['Doğru Cevaplar', 'Yanlış Cevaplar'],
        datasets: [
            {
                data: [stats.correctAnswers, stats.wrongAnswers],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                ],
                borderColor: [
                    'rgb(75, 192, 192)',
                    'rgb(255, 99, 132)',
                ],
                borderWidth: 1,
            },
        ],
    };

    // Doughnut Chart Options
    const doughnutOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Cevap Dağılımı',
            },
        },
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Quiz Performance Graph */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <Line options={lineOptions} data={quizPerformanceData} />
            </div>

            {/* Answer Distribution Graph */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <Doughnut options={doughnutOptions} data={answerDistributionData} />
            </div>

            {/* Statistics Summary */}
            <div className="bg-white p-6 rounded-lg shadow-lg md:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-gray-600">Seviye</p>
                        <p className="text-2xl font-bold text-primary-600">{stats.level}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-600">Toplam XP</p>
                        <p className="text-2xl font-bold text-primary-600">{stats.experience}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-600">Tamamlanan Quiz</p>
                        <p className="text-2xl font-bold text-primary-600">{stats.completedQuizzes}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-600">Başarı Oranı</p>
                        <p className="text-2xl font-bold text-primary-600">
                            {Math.round((stats.correctAnswers / (stats.correctAnswers + stats.wrongAnswers)) * 100)}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
