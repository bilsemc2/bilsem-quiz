import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  IconButton,
  Tooltip,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  points: number;
  experience: number;
  is_vip: boolean;
  is_active: boolean;
  grade?: number;
  referred_by?: string;
  class_students?: {
    classes: {
      id: string;
      name: string;
      grade: number;
    };
  }[];
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    points: 0,
    experience: 0,
    grade: 0,
  });
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    grade: '',
    showOnlyVip: false,
    showOnlyActive: false,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*, class_students(classes(id, name, grade))')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      setUsers(users || []);
      setFilteredUsers(users || []);
      setError(null);
    } catch (err) {
      console.error('Kullanıcılar yüklenirken hata:', err);
      setError('Kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...users];

    if (filters.name) {
      result = result.filter((user) =>
        user.name?.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.email) {
      result = result.filter((user) =>
        user.email.toLowerCase().includes(filters.email.toLowerCase())
      );
    }

    if (filters.grade) {
      result = result.filter((user) =>
        user.grade === parseInt(filters.grade)
      );
    }

    if (filters.showOnlyVip) {
      result = result.filter((user) => user.is_vip);
    }

    if (filters.showOnlyActive) {
      result = result.filter((user) => user.is_active);
    }

    setFilteredUsers(result);
    setPage(0);
  }, [users, filters]);

  const handleToggleVip = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_vip: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map((user) =>
        user.id === userId ? { ...user, is_vip: !currentStatus } : user
      ));
      toast.success('Kullanıcı VIP durumu güncellendi');
    } catch (err) {
      console.error('VIP durumu güncellenirken hata:', err);
      toast.error('Kullanıcı güncellenirken bir hata oluştu');
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map((user) =>
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));
      toast.success('Kullanıcı durumu güncellendi');
    } catch (err) {
      console.error('Aktif durumu güncellenirken hata:', err);
      toast.error('Kullanıcı güncellenirken bir hata oluştu');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      points: user.points || 0,
      experience: user.experience || 0,
      grade: user.grade || 0,
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(editFormData)
        .eq('id', editingUser.id);

      if (error) throw error;

      setUsers(users.map((user) =>
        user.id === editingUser.id ? { ...user, ...editFormData } : user
      ));
      setEditDialogOpen(false);
      toast.success('Kullanıcı başarıyla güncellendi');
    } catch (err) {
      console.error('Kullanıcı güncellenirken hata:', err);
      toast.error('Kullanıcı güncellenirken bir hata oluştu');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.filter((user) => user.id !== userId));
      toast.success('Kullanıcı başarıyla silindi');
    } catch (err) {
      console.error('Kullanıcı silinirken hata:', err);
      toast.error('Kullanıcı silinirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Kullanıcı Yönetimi
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="İsim Ara"
          variant="outlined"
          size="small"
          value={filters.name}
          onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
        />
        <TextField
          label="E-posta Ara"
          variant="outlined"
          size="small"
          value={filters.email}
          onChange={(e) => setFilters((prev) => ({ ...prev, email: e.target.value }))}
        />
        <TextField
          label="Sınıf"
          variant="outlined"
          size="small"
          type="number"
          value={filters.grade}
          onChange={(e) => setFilters((prev) => ({ ...prev, grade: e.target.value }))}
        />
        <FormControl size="small">
          <InputLabel>VIP</InputLabel>
          <Select
            value={filters.showOnlyVip ? 'true' : 'false'}
            label="VIP"
            onChange={(e) => setFilters((prev) => ({ ...prev, showOnlyVip: e.target.value === 'true' }))}
          >
            <MenuItem value="false">Tümü</MenuItem>
            <MenuItem value="true">Sadece VIP</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Durum</InputLabel>
          <Select
            value={filters.showOnlyActive ? 'true' : 'false'}
            label="Durum"
            onChange={(e) => setFilters((prev) => ({ ...prev, showOnlyActive: e.target.value === 'true' }))}
          >
            <MenuItem value="false">Tümü</MenuItem>
            <MenuItem value="true">Sadece Aktif</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ad Soyad</TableCell>
              <TableCell>E-posta</TableCell>
              <TableCell align="right">Puan</TableCell>
              <TableCell align="right">XP</TableCell>
              <TableCell align="right">Sınıf</TableCell>
              <TableCell>Sınıflar</TableCell>
              <TableCell align="center">VIP</TableCell>
              <TableCell align="center">Aktif</TableCell>
              <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name || '-'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell align="right">{user.points}</TableCell>
                  <TableCell align="right">{user.experience}</TableCell>
                  <TableCell align="right">{user.grade || '-'}</TableCell>
                  <TableCell>
                    {user.class_students?.map((cs) => (
                      <Chip
                        key={cs.classes.id}
                        label={`${cs.classes.name} (${cs.classes.grade}. Sınıf)`}
                        size="small"
                        sx={{ m: 0.5 }}
                      />
                    )) || '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={user.is_vip}
                      onChange={() => handleToggleVip(user.id, user.is_vip)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={user.is_active}
                      onChange={() => handleToggleActive(user.id, user.is_active)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Düzenle">
                      <IconButton onClick={() => handleEdit(user)} size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sil">
                      <IconButton onClick={() => handleDelete(user.id)} size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredUsers.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Sayfa başına satır:"
      />

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Kullanıcı Düzenle</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Ad Soyad"
              fullWidth
              value={editFormData.name}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              label="E-posta"
              fullWidth
              value={editFormData.email}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, email: e.target.value }))}
            />
            <TextField
              label="Puan"
              type="number"
              fullWidth
              value={editFormData.points}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
            />
            <TextField
              label="XP"
              type="number"
              fullWidth
              value={editFormData.experience}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
            />
            <TextField
              label="Sınıf"
              type="number"
              fullWidth
              value={editFormData.grade}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, grade: parseInt(e.target.value) || 0 }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>İptal</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
