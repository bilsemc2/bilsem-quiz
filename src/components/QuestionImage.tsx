interface QuestionImageProps {
    imageUrl: string;
    alt: string;
}

export default function QuestionImage({ imageUrl, alt }: QuestionImageProps) {
    return (
        <div className="flex justify-center my-6">
            <img
                src={imageUrl}
                alt={alt}
                className="max-h-[300px] object-contain rounded-lg"
            />
        </div>
    );
}