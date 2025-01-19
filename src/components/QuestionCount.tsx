import React from 'react';
import InfoIcon from '@mui/icons-material/Info';
import { Tooltip } from '@mui/material';
import { QUESTIONS_CONFIG } from '../config/questions';

export default function QuestionCount() {
    const questionCount = QUESTIONS_CONFIG.categories.Matris.totalQuestions;

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-center gap-2">
                <div className="text-3xl font-bold text-indigo-600">
                    {questionCount}
                </div>
                <Tooltip title="Her gün yeni sorular eklenmektedir. Hedef 30.000 soru" arrow>
                    <InfoIcon className="text-gray-400 hover:text-indigo-600 cursor-help transition-colors duration-200" />
                </Tooltip>
            </div>
            <div className="mt-2 text-gray-600">Toplam Soru</div>
        </div>
    );
}
