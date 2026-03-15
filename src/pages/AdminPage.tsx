import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Drawer,
  Toolbar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { Link, useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import {
  Menu as MenuIcon,
  School as SchoolIcon,
  QuestionAnswer as QuizIcon,
  Dashboard as DashboardIcon,
  AccountCircle,
  People as PeopleIcon,
  Book as BookIcon,
  ConfirmationNumber as TicketIcon,
  Psychology as BrainIcon,
  Inventory as PackageIcon,
  NotificationsActive as NotifIcon,
  CalendarMonth as CalendarIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/auth/useAuth';
import { useTheme, useMediaQuery } from '@mui/material';
import { applyNotificationBadges, loadUnreadNotifications, loadAdminProfile } from '@/features/admin/model/adminPageUseCases';
import { toast } from 'sonner';

const AdminDashboard = lazy(() => import('../components/admin/AdminDashboard'));
const UserManagement = lazy(() => import('../components/admin/UserManagement'));
const XPRequirementsManagement = lazy(() => import('../components/admin/XPRequirementsManagement'));
const BlogManagement = lazy(() => import('../components/admin/BlogManagement'));
const PromoCodeManagement = lazy(() => import('../components/admin/PromoCodeManagement'));
const SendMessage = lazy(() => import('../components/admin/SendMessage'));
const TalentAnalytics = lazy(() => import('../components/admin/TalentAnalytics'));
const AdaptiveDifficultyAnalytics = lazy(() => import('../components/admin/AdaptiveDifficultyAnalytics'));
const AIOperationsAnalytics = lazy(() => import('../components/admin/AIOperationsAnalytics'));
const StudentStatistics = lazy(() => import('../components/admin/StudentStatistics'));
const StoryGeneratorPage = lazy(() => import('./Story/StoryGeneratorPage'));
const PackageManagement = lazy(() => import('../components/admin/PackageManagement'));
const PushNotificationAdmin = lazy(() => import('../components/admin/PushNotificationAdmin'));
const DersPlanla = lazy(() => import('../components/admin/DersPlanla'));
const AIQuestionPoolSettingsManagement = lazy(() => import('../components/admin/AIQuestionPoolSettingsManagement'));

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.LazyExoticComponent<React.ComponentType>;
  path: string;
  badge?: number;
}

const BASE_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
    component: AdminDashboard,
    path: '/admin',
  },
  {
    id: 'users',
    title: 'Kullanıcılar',
    icon: <PeopleIcon />,
    component: UserManagement,
    path: '/admin/users',
  },
  {
    id: 'stories',
    title: 'Hikayeler',
    icon: <BookIcon />,
    component: StoryGeneratorPage,
    path: '/admin/stories/create',
  },
  {
    id: 'blog',
    title: 'Blog',
    icon: <QuizIcon />,
    component: BlogManagement,
    path: '/admin/blog',
  },
  {
    id: 'xp-requirements',
    title: 'XP Gereksinimleri',
    icon: <SchoolIcon />,
    component: XPRequirementsManagement,
    path: '/admin/xp-requirements',
  },
  {
    id: 'promo-codes',
    title: 'Promo Kodlar',
    icon: <TicketIcon />,
    component: PromoCodeManagement,
    path: '/admin/promo-codes',
  },
  {
    id: 'messages',
    title: 'Mesaj Gönder',
    icon: <MenuIcon />,
    component: SendMessage,
    path: '/admin/messages',
  },
  {
    id: 'talent-analytics',
    title: 'Yetenek Analizi',
    icon: <BrainIcon />,
    component: TalentAnalytics,
    path: '/admin/talent-analytics',
  },
  {
    id: 'adaptive-difficulty-analytics',
    title: 'Adaptif Zorluk',
    icon: <TuneIcon />,
    component: AdaptiveDifficultyAnalytics,
    path: '/admin/adaptive-difficulty',
  },
  {
    id: 'ai-operations',
    title: 'AI Operasyon',
    icon: <TuneIcon />,
    component: AIOperationsAnalytics,
    path: '/admin/ai-operations',
  },
  {
    id: 'ai-question-pool-settings',
    title: 'AI Soru Havuzu',
    icon: <TuneIcon />,
    component: AIQuestionPoolSettingsManagement,
    path: '/admin/ai-question-pool-settings',
  },
  {
    id: 'student-statistics',
    title: 'Öğrenci İstatistikleri',
    icon: <PeopleIcon />,
    component: StudentStatistics,
    path: '/admin/student-statistics',
  },
  {
    id: 'packages',
    title: 'Paketler',
    icon: <PackageIcon />,
    component: PackageManagement,
    path: '/admin/packages',
  },
  {
    id: 'push-notifications',
    title: 'Push Bildirim',
    icon: <NotifIcon />,
    component: PushNotificationAdmin,
    path: '/admin/push-notifications',
  },
  {
    id: 'ders-planla',
    title: 'Ders Planlayıcı',
    icon: <CalendarIcon />,
    component: DersPlanla,
    path: '/admin/ders-planla',
  },
];

const AdminPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(BASE_MENU_ITEMS);
  const verifiedUserIdRef = useRef<string | null>(null);

  const checkNotifications = useCallback(async () => {
    if (!auth.user?.id) return;

    try {
      const notifications = await loadUnreadNotifications(auth.user.id);
      setMenuItems((prev) => applyNotificationBadges(prev, notifications));
    } catch (err) {
      console.error('Bildirimler kontrol edilirken hata:', err);
      toast.error('Bildirimler yüklenirken bir hata oluştu');
    }
  }, [auth.user?.id]);

  const checkAdminStatus = useCallback(async () => {
    if (!auth.user?.id) {
      setError('Bu sayfaya erişim yetkiniz yok');
      setLoading(false);
      verifiedUserIdRef.current = null;
      return;
    }

    // Aynı kullanıcı zaten doğrulanmışsa tekrar loading gösterme
    if (verifiedUserIdRef.current === auth.user.id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const profile = await loadAdminProfile(auth.user.id);

      if (!profile?.is_admin) {
        setError('Bu sayfaya erişim yetkiniz yok');
        return;
      }

      verifiedUserIdRef.current = auth.user.id;
      await checkNotifications();
    } catch (err) {
      console.error('Admin kontrolü yapılırken hata:', err);
      setError('Yetkilendirme kontrolü yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [auth.user?.id, checkNotifications]);

  useEffect(() => {
    void checkAdminStatus();
  }, [checkAdminStatus]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch {
      toast.error('Çıkış yapılırken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sol Menü */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Admin Panel
          </Typography>
        </Toolbar>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.id}
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={() => isMobile && setDrawerOpen(false)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} />
              {item.badge && item.badge > 0 && (
                <Badge badgeContent={item.badge} color="error" />
              )}
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Ana İçerik */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton color="inherit" onClick={handleProfileMenuOpen}>
            <AccountCircle />
          </IconButton>
        </Toolbar>

        {/* Profil Menüsü */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
        >
          <MenuItem onClick={handleLogout}>Çıkış Yap</MenuItem>
        </Menu>

        {/* Sayfa İçeriği */}
        <Suspense
          fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          }
        >
          <Routes>
            {menuItems.map((item) => {
              const Component = item.component;

              return (
                <Route
                  key={item.id}
                  path={item.path.replace('/admin', '')}
                  element={<Component />}
                />
              );
            })}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </Suspense>
      </Box>
    </Box>
  );
};

export default AdminPage;
