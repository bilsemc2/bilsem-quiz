// PDF Önizleme Bileşeni
import { X, Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { StoryPDF } from './StoryPDF';
import { decode } from 'html-entities';
import { Story } from './types';


interface PDFPreviewProps {
  story: Story;
  onClose: () => void;
}

export function PDFPreview({ story, onClose }: PDFPreviewProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-xl font-semibold text-purple-900">
            PDF Önizleme
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="bg-gray-100 rounded-lg p-8 min-h-[600px] space-y-12">
            {/* Birinci Sayfa */}
            <div className="bg-white rounded-lg shadow-lg p-8 space-y-6 max-w-[595px] mx-auto min-h-[842px] relative">
              <h1 className="text-2xl font-bold text-center text-[#6B46C1] font-['Roboto']">
                {decode(story.title)}
              </h1>

              {story.image_url && (
                <div className="h-[400px] flex items-center justify-center">
                  <img
                    src={story.image_url}
                    alt={story.title}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}

              <div className="text-justify text-sm leading-relaxed font-['Roboto']">
                {decode(story.content)}
              </div>
            </div>

            {/* İkinci Sayfa */}
            <div className="bg-white rounded-lg shadow-lg p-8 space-y-6 max-w-[595px] mx-auto min-h-[842px] relative font-['Roboto']">
              <h2 className="text-xl font-bold text-center text-[#6B46C1]">
                Değerlendirme Soruları
              </h2>

              <div className="space-y-6">
                {story.questions.map((question: { text: string; options: string[]; correctAnswer: number }, index: number) => (
                  <div key={index} className="space-y-3">
                    <p className="text-sm font-bold">
                      {index + 1}. {decode(question.text)}
                    </p>
                    <div className="pl-6 space-y-1">
                      {question.options.map((option: string, optionIndex: number) => (
                        <p key={optionIndex} className="text-[11px]">
                          {String.fromCharCode(65 + optionIndex)}. {decode(option)}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
                <h3 className="text-base font-bold text-[#6B46C1] mb-4">
                  Yanıt Anahtarı
                </h3>
                <div className="space-y-1">
                  {story.questions.map((question: { text: string; options: string[]; correctAnswer: number }, index: number) => (
                    <div key={index} className="text-[11px]">
                      {index + 1}. {String.fromCharCode(65 + question.correctAnswer)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end">
          <PDFDownloadLink
            document={<StoryPDF story={story} />}
            fileName={`${story.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Download size={20} />
              <span>PDF İndir</span>
            </div>
          </PDFDownloadLink>
        </div>
      </div>
    </div>
  );
}