import React from 'react';
import EditIcon from '@mui/icons-material/Edit';
import { Badge } from '@mui/material';
import MailIcon from '@mui/icons-material/Mail';
import { UserProfile } from '@/types/profile';

interface ProfileHeaderProps {
  userData: UserProfile;
  unreadCount: number;
  onEditClick: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userData, unreadCount, onEditClick }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
        {/* Avatar */}
        <div className="relative">
          <img
            src={userData.avatar_url}
            alt={userData.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100"
          />
          <button
            onClick={onEditClick}
            className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors"
            title="Profili Düzenle"
          >
            <EditIcon />
          </button>
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2">
              <Badge 
                badgeContent={unreadCount} 
                color="error"
                overlap="circular"
              >
                <MailIcon color="action" />
              </Badge>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-900">{userData.name}</h2>
          <p className="text-gray-600">{userData.email}</p>
          <p className="text-gray-600">{userData.school}</p>
          <p className="text-gray-600">{userData.grade}. Sınıf</p>
          <div className="mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              <span className="mr-1">⭐</span>
              {userData.points} Puan
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
