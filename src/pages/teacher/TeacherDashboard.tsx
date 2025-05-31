import React, { useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import TeacherStats from './components/TeacherStats';
import ClassManagement from './components/ClassManagement';
import AssignmentManagement from './components/AssignmentManagement';
import ReferralManagement from './components/ReferralManagement';
import AnnouncementManagement from './components/AnnouncementManagement';
import StudentManagement from './components/StudentManagement';
import CreatePdfPage from '../CreatePdfPage';

type MenuItem = {
  id: string;
  title: string;
  icon: string;
  component: React.FC;
  description?: string;
  badge?: number;
};

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Genel Bakış',
    icon: '📊',
    component: TeacherStats,
    description: 'Sınıf ve öğrenci istatistikleri'
  },
  {
    id: 'classes',
    title: 'Sınıf Yönetimi',
    icon: '👥',
    component: ClassManagement,
    description: 'Sınıfları yönet ve düzenle'
  },
  {
    id: 'students',
    title: 'Öğrenci Yönetimi',
    icon: '👨‍🎓',
    component: StudentManagement,
    description: 'Öğrenci bilgilerini yönet'
  },
  {
    id: 'assignments',
    title: 'Ödev Yönetimi',
    icon: '📝',
    component: AssignmentManagement,
    description: 'Ödevleri oluştur ve takip et'
  },
  {
    id: 'announcements',
    title: 'Duyuru Yönetimi',
    icon: '📢',
    component: AnnouncementManagement,
    description: 'Duyuruları yayınla ve yönet'
  },
  {
    id: 'referrals',
    title: 'Referans Yönetimi',
    icon: '🔗',
    component: ReferralManagement,
    description: 'Referansları takip et'
  },
  {
    id: 'create-pdf',
    title: 'PDF Oluştur',
    icon: '📄',
    component: CreatePdfPage,
    description: 'Raporları PDF olarak oluştur'
  }
];

interface SidebarProps {
  isCollapsed: boolean;
  activeMenuItem: string;
  onMenuClick: (itemId: string) => void;
  onToggleCollapse: () => void;
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = React.memo(({ 
  isCollapsed, 
  activeMenuItem, 
  onMenuClick, 
  onToggleCollapse, 
  isMobile, 
  isOpen, 
  onClose 
}) => {
  const handleMenuItemClick = useCallback((itemId: string) => {
    onMenuClick(itemId);
    if (isMobile) {
      onClose();
    }
  }, [onMenuClick, isMobile, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleMenuItemClick(itemId);
    }
  }, [handleMenuItemClick]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'} 
        ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
        ${isCollapsed && !isMobile ? 'w-16' : 'w-64'}
        bg-white shadow-lg min-h-screen transition-all duration-300 ease-in-out z-50
        flex flex-col
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <h1 className="text-xl font-bold text-gray-800 truncate">
                Öğretmen Paneli
              </h1>
            )}
            
            {/* Toggle Button */}
            <button
              onClick={isMobile ? onClose : onToggleCollapse}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={isMobile ? 'Menüyü kapat' : isCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
            >
              {isMobile ? (
                <X className="w-5 h-5" />
              ) : isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2" role="navigation" aria-label="Ana menü">
          {menuItems.map(item => {
            const isActive = activeMenuItem === item.id;
            
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => handleMenuItemClick(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                className={`
                  group relative w-full text-left px-3 py-3 rounded-lg transition-all duration-200
                  flex items-center gap-3 cursor-pointer
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-200' 
                    : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                `}
                aria-current={isActive ? 'page' : undefined}
                title={isCollapsed ? item.title : undefined}
              >
                <span className="text-xl flex-shrink-0 transition-transform group-hover:scale-110">
                  {item.icon}
                </span>
                
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.title}</div>
                    {item.description && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Badge */}
                {item.badge && !isCollapsed && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    {item.title}
                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-gray-900"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        
        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              © 2024 BilSem Quiz
            </div>
          </div>
        )}
      </div>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

const TeacherDashboard: React.FC = () => {
  const [activeMenuItem, setActiveMenuItem] = useState<string>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Mobile detection
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMenuClick = useCallback((itemId: string) => {
    setActiveMenuItem(itemId);
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const ActiveComponent = useMemo(() => {
    return menuItems.find(item => item.id === activeMenuItem)?.component || TeacherStats;
  }, [activeMenuItem]);

  const currentMenuItem = useMemo(() => {
    return menuItems.find(item => item.id === activeMenuItem);
  }, [activeMenuItem]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (menuItems[index]) {
          setActiveMenuItem(menuItems[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={isCollapsed}
          activeMenuItem={activeMenuItem}
          onMenuClick={handleMenuClick}
          onToggleCollapse={handleToggleCollapse}
          isMobile={isMobile}
          isOpen={isMobileMenuOpen}
          onClose={handleMobileMenuClose}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          {isMobile && (
            <header className="bg-white shadow-sm border-b border-gray-200 p-4 lg:hidden">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleMobileMenuToggle}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Menüyü aç"
                >
                  <Menu className="w-6 h-6" />
                </button>
                
                <div className="flex-1 text-center">
                  <h1 className="text-lg font-semibold text-gray-800">
                    {currentMenuItem?.title || 'Öğretmen Paneli'}
                  </h1>
                </div>
                
                <div className="w-10"></div> {/* Spacer for centering */}
              </div>
            </header>
          )}

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-8" role="main">
            {/* Breadcrumb */}
            <div className="mb-6">
              <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Öğretmen Paneli</span>
                <span>/</span>
                <span className="text-gray-900 font-medium">
                  {currentMenuItem?.title}
                </span>
              </nav>
            </div>

            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{currentMenuItem?.icon}</span>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentMenuItem?.title}
                </h2>
              </div>
              {currentMenuItem?.description && (
                <p className="text-gray-600">{currentMenuItem.description}</p>
              )}
            </div>

            {/* Component Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
              <React.Suspense 
                fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Yükleniyor...</span>
                  </div>
                }
              >
                <ActiveComponent />
              </React.Suspense>
            </div>
          </main>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 right-4 z-30">
        <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-75 hover:opacity-100 transition-opacity">
          <div className="font-medium mb-1">Klavye Kısayolları:</div>
          <div>Alt + 1-7: Menü öğelerine git</div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TeacherDashboard);