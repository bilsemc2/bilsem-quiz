import { useState, useEffect } from 'react';
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
  Settings as SettingsIcon,
  School as SchoolIcon,
  QuestionAnswer as QuizIcon,
  Dashboard as DashboardIcon,
  AccountCircle,
  People as PeopleIcon,
  Book as BookIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTheme, useMediaQuery } from '@mui/material';
import AdminDashboard from '../components/admin/AdminDashboard';
import UserManagement from '../components/admin/UserManagement';
import AdminSettings from '../components/admin/AdminSettings';

import XPRequirementsManagement from '../components/admin/XPRequirementsManagement';
import BlogManagement from '../components/admin/BlogManagement';
import SendMessage from '../components/admin/SendMessage';
import { toast } from 'react-hot-toast';

interface Notification {
  id: string;
  type: string;
  message: string;
  created_at: string;
}

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  path: string;
  badge?: number;
}

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
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: <DashboardIcon />,
      component: <AdminDashboard />,
      path: '/admin',
    },
    {
      id: 'users',
      title: 'Kullanıcılar',
      icon: <PeopleIcon />,
      component: <UserManagement />,
      path: '/admin/users',
    },
    {
      id: 'stories',
      title: 'Hikayeler',
      icon: <BookIcon />,
      component: null,
      path: '/admin/stories/create',
    },
    {
      id: 'blog',
      title: 'Blog',
      icon: <QuizIcon />,
      component: <BlogManagement />,
      path: '/admin/blog',
    },
    {
      id: 'settings',
      title: 'Ayarlar',
      icon: <SettingsIcon />,
      component: <AdminSettings />,
      path: '/admin/settings',
    },
    {
      id: 'xp-requirements',
      title: 'XP Gereksinimleri',
      icon: <SchoolIcon />,
      component: <XPRequirementsManagement />,
      path: '/admin/xp-requirements',
    },
    {
      id: 'messages',
      title: 'Mesaj Gönder',
      icon: <MenuIcon />,
      component: <SendMessage />,
      path: '/admin/messages',
    },
  ]);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', auth.user?.id)
        .single();

      if (!profile?.is_admin) {
        setError('Bu sayfaya erişim yetkiniz yok');
        return;
      }

      await checkNotifications();
      setLoading(false);
    } catch (err) {
      console.error('Admin kontrolü yapılırken hata:', err);
      setError('Yetkilendirme kontrolü yapılırken bir hata oluştu');
    }
  };

  const checkNotifications = async () => {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', auth.user?.id)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const menuItemsWithNotifications = menuItems.map((item: MenuItem) => ({
        ...item,
        badge: notifications?.filter((n: Notification) => n.type === item.id).length || 0,
      }));

      setMenuItems(menuItemsWithNotifications);
    } catch (err) {
      console.error('Bildirimler kontrol edilirken hata:', err);
      toast.error('Bildirimler yüklenirken bir hata oluştu');
    }
  };

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
    } catch (err) {
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
        <Routes>
          {menuItems
            .filter(item => item.component !== null)
            .map((item) => (
              <Route
                key={item.id}
                path={item.path.replace('/admin', '')}
                Component={() => item.component as JSX.Element}
              />
            ))}
          <Route path="*" Component={() => <Navigate to="/admin" replace />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default AdminPage;
