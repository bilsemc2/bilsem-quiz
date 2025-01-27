import React, { useState, useEffect } from 'react';
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
import { Link } from 'react-router-dom';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
  School as SchoolIcon,
  QuestionAnswer as QuizIcon,
  Dashboard as DashboardIcon,
  AccountCircle,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTheme, useMediaQuery } from '@mui/material';
import AdminDashboard from '../components/admin/AdminDashboard';
import UserManagement from '../components/admin/UserManagement';
import ClassManagement from '../components/admin/ClassManagement';
import QuizManagement from '../components/admin/QuizManagement';
import AdminSettings from '../components/admin/AdminSettings';
import { toast } from 'react-hot-toast';

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
      id: 'classes',
      title: 'Sınıflar',
      icon: <SchoolIcon />,
      component: <ClassManagement />,
      path: '/admin/classes',
    },
    {
      id: 'quizzes',
      title: 'Quizler',
      icon: <QuizIcon />,
      component: <QuizManagement />,
      path: '/admin/quizzes',
    },
    {
      id: 'settings',
      title: 'Ayarlar',
      icon: <SettingsIcon />,
      component: <AdminSettings />,
      path: '/admin/settings',
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

      const menuItemsWithNotifications = menuItems.map(item => ({
        ...item,
        badge: notifications?.filter(n => n.type === item.id).length || 0,
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
          {menuItems.map((item) => (
            <Route
              key={item.id}
              path={item.path.replace('/admin', '')}
              element={item.component}
            />
          ))}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default AdminPage;
