interface QuestionHeaderProps {
    questionNumber: string | number;
}

export default function QuestionHeader({ questionNumber }: QuestionHeaderProps) {
    return (
        <div className="mb-4">
            <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium">
                {questionNumber}
            </span>
        </div>
    );
}
