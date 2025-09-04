import CircularProgress from './CircularProgress';
import { QUIZ_DURATION } from '../config/constants';



interface QuizHeaderProps {

currentQuestionIndex: number;

totalQuestions: number;

timeLeft: number;

progress: number;

}



export default function QuizHeader({

currentQuestionIndex,

totalQuestions,

timeLeft,

progress

}: QuizHeaderProps) {

return (

<div className="flex justify-between items-center mb-6">

<div className="text-lg font-semibold">

Soru {currentQuestionIndex + 1}/{totalQuestions}

</div>

<div className="flex items-center space-x-4">

<CircularProgress
  timeLeft={timeLeft}
  totalTime={QUIZ_DURATION}
  progress={progress}
/>

</div>

</div>

);

}