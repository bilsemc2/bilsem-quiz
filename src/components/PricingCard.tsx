import { CheckOutlined } from '@ant-design/icons';

interface PricingCardProps {
    title: string;
    price: string;
    originalPrice?: string;
    discountPercentage?: number;
    description?: string;
    features: string[];
    isPopular?: boolean;
    buttonText: string;
    onClick: () => void;
}

export default function PricingCard({
    title,
    price,
    originalPrice,
    discountPercentage,
    description,
    features,
    isPopular,
    buttonText,
    onClick
}: PricingCardProps) {
    return (
        <div className={`relative rounded-2xl shadow-xl p-8 ${isPopular ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white transform scale-105' : 'bg-white'}`}>
            {isPopular && (
                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                    <div className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        En Popüler
                    </div>
                </div>
            )}

            <h3 className={`text-2xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                {title}
            </h3>

            {description && (
                <p className={`text-sm mb-4 ${isPopular ? 'text-gray-100' : 'text-gray-600'}`}>
                    {description}
                </p>
            )}

            <div className="mb-6 space-y-2">
                <div className="flex items-center justify-center space-x-2">
                    {originalPrice && (
                        <span className={`text-2xl line-through ${isPopular ? 'text-gray-300' : 'text-gray-400'}`}>
                            {originalPrice}
                        </span>
                    )}
                    <span className={`text-4xl font-bold ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                        {price}
                    </span>
                </div>
                {discountPercentage && (
                    <div className="flex justify-center">
                        <span className="bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded-full">
                            %{discountPercentage} İndirim
                        </span>
                    </div>
                )}
            </div>

            <ul className="mb-8 space-y-4">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                        <CheckOutlined className={`text-lg mr-3 ${isPopular ? 'text-yellow-400' : 'text-green-500'}`} aria-hidden="true" />
                        <span className={isPopular ? 'text-gray-100' : 'text-gray-600'}>
                            {feature}
                        </span>
                    </li>
                ))}
            </ul>

            <button
                onClick={onClick}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${isPopular
                        ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
            >
                {buttonText}
            </button>
        </div>
    );
}
