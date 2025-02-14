import React from 'react';
import TeacherStats from './components/TeacherStats';
import ClassManagement from './components/ClassManagement';
import AssignmentManagement from './components/AssignmentManagement';
import ReferralManagement from './components/ReferralManagement';

type MenuItem = {
  id: string;
  title: string;
  icon: string;
  component: React.FC;
};

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Genel Bakış',
    icon: '📊',
    component: TeacherStats
  },
  {
    id: 'classes',
    title: 'Sınıf Yönetimi',
    icon: '👥',
    component: ClassManagement
  },
  {
    id: 'assignments',
    title: 'Ödev Yönetimi',
    icon: '📝',
    component: AssignmentManagement
  },
  {
    id: 'referrals',
    title: 'Referans Yönetimi',
    icon: '🔗',
    component: ReferralManagement
  }
];

const TeacherDashboard: React.FC = () => {
  const [activeMenuItem, setActiveMenuItem] = React.useState<string>('dashboard');

  const ActiveComponent = menuItems.find(item => item.id === activeMenuItem)?.component || TeacherStats;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sol Menü */}
        <div className="w-64 bg-white shadow-lg min-h-screen p-4">
          <h1 className="text-xl font-bold mb-8 px-4">Öğretmen Paneli</h1>
          
          <nav>
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveMenuItem(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center gap-3 transition-colors ${activeMenuItem === item.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Ana İçerik */}
        <div className="flex-1 p-8">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;