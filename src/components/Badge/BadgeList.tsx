import React from 'react';
import BadgeCard from './BadgeCard';

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt?: string;
    isLocked?: boolean;
}

interface BadgeListProps {
    badges: Badge[];
    className?: string;
}

const BadgeList: React.FC<BadgeListProps> = ({ badges, className = '' }) => {
    return (
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 ${className}`}>
            {badges.map((badge) => (
                <BadgeCard
                    key={badge.id}
                    name={badge.name}
                    description={badge.description}
                    icon={badge.icon}
                    earnedAt={badge.earnedAt}
                    isLocked={badge.isLocked}
                />
            ))}
        </div>
    );
};

export default BadgeList;
