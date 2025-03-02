interface QuestionOptionsProps {
    options: Array<{
        id: string;
        imageUrl: string;
        isSelected: boolean;
        isCorrect: boolean;
    }>;
}

export default function QuestionOptions({ options }: QuestionOptionsProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
            {options.map((option, index) => (
                <div
                    key={index}
                    className={`
                        relative rounded-lg overflow-hidden border-2
                        ${option.isCorrect ? 'border-emerald-500' : 
                          option.isSelected ? 'border-red-500' : 'border-gray-200'}
                    `}
                >
                    <img
                        src={option.imageUrl}
                        alt={`Seçenek ${index + 1}`}
                        className="w-full h-auto"
                    />
                </div>
            ))}
        </div>
    );
}