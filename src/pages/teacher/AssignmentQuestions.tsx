import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Question {
  id: string;
  order_number: number;
  question_id: string;
  question?: {
    image_url: string;
    correct_option_id: string;
  };
}

const AssignmentQuestions: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [assignment, setAssignment] = React.useState<any>(null);
  const [questions, setQuestions] = React.useState<Question[]>([]);


  const fetchAssignmentDetails = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          quiz_class_assignments (
            class_id,
            classes (
              id,
              name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setAssignment(data);
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast.error('Ödev detayları yüklenirken bir hata oluştu');
      navigate('/teacher/dashboard');
    }
  };

  const fetchQuestions = async () => {
    if (!user) return;

    try {
      // Önce ödev sorularını al
      const { data: assignmentQuestions, error: assignmentError } = await supabase
        .from('assignment_questions')
        .select('id, order_number, question_id')
        .eq('assignment_id', id)
        .order('order_number');

      if (assignmentError) throw assignmentError;

      // Sonra soru detaylarını al
      const questionIds = assignmentQuestions?.map(q => q.question_id) || [];
      if (questionIds.length > 0) {
        const { data: questionDetails, error: questionsError } = await supabase
          .from('questions')
          .select('id, image_url, correct_option_id')
          .in('id', questionIds);

        if (questionsError) throw questionsError;

        // İki veri setini birleştir
        const combinedData = assignmentQuestions.map(aq => ({
          ...aq,
          question: questionDetails?.find(q => q.id === aq.question_id)
        }));

        setQuestions(combinedData);
      } else {
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Sorular yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAssignmentDetails();
    fetchQuestions();
  }, [user, id]);



  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{assignment?.title}</h1>
          <p className="text-gray-600">
            {assignment?.quiz_class_assignments[0]?.classes?.name}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Geri Dön
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-medium">Ödev Soruları</h2>
        </div>

        <div className="space-y-2">
          {questions.map((question) => (
            <div
              key={question.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded"
            >
              <div className="w-full">
                <h3 className="font-medium text-sm">Soru {question.order_number}</h3>
                {question.question?.image_url && (
                  <div className="mt-1 space-y-1">
                    <div className="flex flex-col md:flex-row md:space-x-4">
                      <div className="md:w-1/3 mb-2 md:mb-0">
                        <img 
                          src={question.question.image_url} 
                          alt={`Soru ${question.order_number}`}
                          className="max-w-full h-auto rounded-lg shadow-sm"
                        />
                      </div>
                      <div className="md:w-2/3">
                        <div className="grid grid-cols-5 gap-1">
                          {['A', 'B', 'C', 'D', 'E'].map((option) => {
                            const questionNumber = question.question?.image_url?.match(/Soru-(\d+)\.webp/)?.[1];
                            const optionImageUrl = questionNumber
                              ? `/images/options/Matris/${questionNumber}/Soru-${option === question.question?.correct_option_id ? 'cevap-' : ''}${questionNumber}${option}.webp`
                              : '';
                            
                            return (
                              <div 
                                key={option} 
                                className={`relative ${option === question.question?.correct_option_id ? 'ring-1 ring-green-500' : ''}`}
                              >
                                <img
                                  src={optionImageUrl}
                                  alt={`Seçenek ${option}`}
                                  className="w-full h-auto rounded"
                                />
                                <span className={`
                                  absolute top-1 left-1 
                                  px-1.5 py-0.5 rounded-full text-xs font-medium
                                  ${option === question.question?.correct_option_id 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'}
                                `}>
                                  {option}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              

            </div>
          ))}

          {questions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Bu ödevde henüz soru bulunmuyor.

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentQuestions;
