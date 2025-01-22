import React from 'react';
import { motion } from 'framer-motion';

interface ModernProgressProps {
    value: number;
    label: string;
    color: string;
    icon: string;
    description?: string;
}

const ModernProgress: React.FC<ModernProgressProps> = ({
    value,
    label,
    color,
    icon,
    description
}) => {
    const percentage = Math.min(Math.max(value, 0), 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
        >
            <div className="flex items-center mb-4">
                <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${color}15` }}
                >
                    {icon}
                </div>
                <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
                    {description && (
                        <p className="text-sm text-gray-500">{description}</p>
                    )}
                </div>
            </div>

            <div className="relative pt-1">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-right">
                        <span className="text-xl font-semibold inline-block text-gray-800">
                            {percentage.toFixed(1)}%
                        </span>
                    </div>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="rounded-full"
                        style={{ backgroundColor: color }}
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default ModernProgress;
