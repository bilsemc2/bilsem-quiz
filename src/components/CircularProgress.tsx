interface CircularProgressProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    circleColor?: string;
    text?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
    percentage,
    size = 40,
    strokeWidth = 4,
    circleColor = 'rgb(37 99 235)',
    text
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg
                className="transform -rotate-90"
                style={{ width: size, height: size }}
            >
                {/* Background circle */}
                <circle
                    className="text-gray-200"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress circle */}
                <circle
                    className="transition-all duration-300"
                    strokeWidth={strokeWidth}
                    stroke={circleColor}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                    }}
                />
            </svg>
            {text && (
                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium" style={{ color: circleColor }}>
                    {text}
                </div>
            )}
        </div>
    );
};
