import React, { useState, useRef, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { QUESTIONS_CONFIG } from '../config/questions';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const CreatePdfPage: React.FC = () => {
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [startQuestion, setStartQuestion] = useState<number>(1);
  const [selectionType, setSelectionType] = useState<'sequential' | 'random'>('sequential');
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isVip, setIsVip] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const checkVipStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_vip')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking VIP status:', error);
          setIsVip(false);
        } else {
          setIsVip(data?.is_vip || false);
        }
      } catch (error) {
        console.error('Error:', error);
        setIsVip(false);
      } finally {
        setLoading(false);
      }
    };

    checkVipStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Giriş Yapmanız Gerekiyor
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              PDF oluşturmak için lütfen giriş yapın
            </p>
          </div>
          <div className="mt-5">
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isVip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              VIP Üyelik Gerekli
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              PDF oluşturma özelliği sadece VIP üyeler için kullanılabilir. VIP üyelik için lütfen yönetici ile iletişime geçin.
            </p>
          </div>
          <div className="mt-5">
            <Link
              to="/profile"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Profile Git
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const generateQuestions = () => {
    const totalQuestions = QUESTIONS_CONFIG.totalQuestions;
    let questions: number[] = [];

    if (selectionType === 'sequential') {
      for (let i = 0; i < numQuestions; i++) {
        const questionNum = startQuestion + i;
        if (questionNum <= totalQuestions) {
          questions.push(questionNum);
        }
      }
    } else {
      while (questions.length < numQuestions) {
        const num = Math.floor(Math.random() * totalQuestions) + 1;
        if (!questions.includes(num)) {
          questions.push(num);
        }
      }
      questions.sort((a, b) => a - b);
    }
    
    setSelectedQuestions(questions);
    setShowPreview(true);
  };

  const addWatermark = () => {
    const pages = document.querySelectorAll('.pdf-page');
    pages.forEach(page => {
      const watermark = document.createElement('div');
      const pageElement = page as HTMLElement;
      const watermarkElement = watermark as HTMLElement;

      watermarkElement.style.position = 'absolute';
      watermarkElement.style.top = '50%';
      watermarkElement.style.left = '50%';
      watermarkElement.style.transform = 'translate(-50%, -50%) rotate(-45deg)';
      watermarkElement.style.fontSize = '60px';
      watermarkElement.style.color = 'gray';
      watermarkElement.style.opacity = '0.05';
      watermarkElement.style.pointerEvents = 'none';
      watermarkElement.style.userSelect = 'none';
      watermarkElement.style.width = '100%';
      watermarkElement.style.textAlign = 'center';
      watermarkElement.style.fontWeight = 'bold';
      watermarkElement.textContent = 'BilsemC2';
      pageElement.style.position = 'relative';
      pageElement.appendChild(watermarkElement);
    });
  };

  const generatePDF = async () => {
    if (!contentRef.current) return;

    // Watermark ekle
    addWatermark();

    const element = contentRef.current;
    const opt = {
      margin: 0,
      filename: 'sorular.pdf',
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: true,
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
      },
      pagebreak: { mode: 'avoid-all' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
    } finally {
      // PDF oluştuktan sonra watermark'ları temizle
      const existingWatermarks = element.getElementsByClassName('watermark');
      while (existingWatermarks.length > 0) {
        existingWatermarks[0].remove();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      {!showPreview ? (
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-4">PDF Oluştur</h1>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Soru Seçim Tipi:
              </label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="sequential"
                    checked={selectionType === 'sequential'}
                    onChange={(e) => setSelectionType(e.target.value as 'sequential' | 'random')}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Sıralı</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="random"
                    checked={selectionType === 'random'}
                    onChange={(e) => setSelectionType(e.target.value as 'sequential' | 'random')}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Rastgele</span>
                </label>
              </div>
            </div>

            {selectionType === 'sequential' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Başlangıç Sorusu (1-{QUESTIONS_CONFIG.totalQuestions}):
                </label>
                <input
                  type="number"
                  min="1"
                  max={QUESTIONS_CONFIG.totalQuestions}
                  value={startQuestion}
                  onChange={(e) => setStartQuestion(Math.min(QUESTIONS_CONFIG.totalQuestions, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Soru Sayısı (10-40 arası):
              </label>
              <input
                type="number"
                min="10"
                max="40"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.min(40, Math.max(10, parseInt(e.target.value) || 10)))}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <button
              onClick={generateQuestions}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Önizleme
            </button>
          </div>
        </div>
      ) : (
        <div className="container mx-auto p-4">
          <div className="flex justify-end mb-4 gap-2">
            <button
              onClick={() => setShowPreview(false)}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Geri Dön
            </button>
            <button
              onClick={generatePDF}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              PDF İndir
            </button>
          </div>
          
          <div className="pdf-preview" style={{ maxWidth: '210mm', margin: '0 auto' }}>
            <div ref={contentRef} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Soru sayfaları */}
              {Array.from({ length: Math.ceil(selectedQuestions.length / 6) }, (_, pageIndex) => {
                const pageQuestions = selectedQuestions.slice(pageIndex * 6, (pageIndex + 1) * 6);
                return pageQuestions.length > 0 ? (
                  <div 
                    key={pageIndex} 
                    className="pdf-page bg-white"
                    style={{ 
                      width: '210mm',
                      minHeight: '297mm',
                      padding: '10mm',
                      boxSizing: 'border-box',
                      pageBreakAfter: 'always',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <div className="grid grid-cols-2 gap-4" style={{ width: '190mm' }}>
                      {pageQuestions.map((questionNum, index) => (
                        <div key={questionNum} className="question-box border rounded p-3 flex flex-col items-center question-container">
                          {/* Soru başlığı */}
                          <div className="question-header mb-2 text-center w-full">
                            <h2 className="text-sm font-bold">Soru {index + 1}</h2>
                          </div>
                          
                          {/* Soru görseli */}
                          <div className="question-image mb-3 flex justify-center" style={{ height: '110px', width: '85%' }}>
                            <img
                              src={`/images/questions/Matris/Soru-${questionNum}.webp`}
                              alt={`Soru ${questionNum}`}
                              className="h-full object-contain"
                            />
                          </div>
                          
                          {/* Seçenekler */}
                          <div className="options-grid flex flex-row flex-wrap justify-center gap-2" style={{ width: '95%' }}>
                            {['A', 'B', 'C', 'D', 'E'].map((option) => (
                              <div key={option} className="option-box flex flex-col items-center" style={{ width: '18%' }}>
                                <span className="text-xs font-bold mb-1">{option}</span>
                                <div className="option-image-container flex justify-center" style={{ height: '50px', width: '100%' }}>
                                  <img
                                    src={`/images/options/Matris/${questionNum}/Soru-${questionNum}${option}.webp`}
                                    alt={`Seçenek ${option}`}
                                    className="h-full object-contain"
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement;
                                      if (img.src !== `/images/options/Matris/${questionNum}/Soru-cevap-${questionNum}${option}.webp`) {
                                        img.src = `/images/options/Matris/${questionNum}/Soru-cevap-${questionNum}${option}.webp`;
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })}

              {/* Cevap sayfası */}
              <div 
                className="pdf-page bg-white"
                style={{ 
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '15mm',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <h1 className="text-xl font-bold mb-6">Soru Cevapları:</h1>
                <div className="grid grid-cols-2 gap-6" style={{ width: '180mm' }}>
                  {selectedQuestions.map((questionNum, index) => (
                    <div key={questionNum} className="answer-box flex items-center gap-4">
                      <span className="text-sm font-bold">Soru {index + 1}:</span>
                      <div className="flex gap-2">
                        {['A', 'B', 'C', 'D', 'E'].map((option) => (
                          <img
                            key={option}
                            src={`/images/options/Matris/${questionNum}/Soru-cevap-${questionNum}${option}.webp`}
                            alt={`Soru ${questionNum} cevap`}
                            className="h-[40px] object-contain"
                            onLoad={(e) => {
                              // Görsel yüklendiğinde yanına cevap harfini ekle
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                const text = document.createElement('span');
                                text.className = 'text-sm font-bold ml-1';
                                text.textContent = option;
                                parent.appendChild(text);
                              }
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePdfPage;
