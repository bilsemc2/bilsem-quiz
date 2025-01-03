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
import { supabase } from '../lib/supabase';

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
  classes?: { class_id: string }[];
  class_students?: {
    classes: {
      id: string;
      name: string;
      grade: number;
    };
  }[];
}

interface Class {
  id: string;
  name: string;
  grade: number;
}

interface UserManagementProps {
  onUserUpdate?: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onUserUpdate }) => {
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
    referred_by: '',
  });
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    grade: '',
    showOnlyVip: false,
    showOnlyActive: false,
  });
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Önce kullanıcıları al
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*');

      if (usersError) throw usersError;

      // Her kullanıcı için sınıf bilgilerini al
      const usersWithClasses = await Promise.all(
        (users || []).map(async (user) => {
          const { data: classStudents, error: classError } = await supabase
            .from('class_students')
            .select(`
              class_id,
              classes (
                id,
                name,
                grade
              )
            `)
            .eq('student_id', user.id);

          if (classError) throw classError;

          return {
            ...user,
            class_students: classStudents
          };
        })
      );

      setUsers(usersWithClasses);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filtreleme işlemi
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
    setPage(0); // Filtreleme yapıldığında ilk sayfaya dön
  }, [users, filters]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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

      if (onUserUpdate) onUserUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kullanıcı güncellenirken bir hata oluştu');
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

      if (onUserUpdate) onUserUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kullanıcı güncellenirken bir hata oluştu');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.filter((user) => user.id !== userId));
      if (onUserUpdate) onUserUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kullanıcı silinirken bir hata oluştu');
    }
  };

  const fetchClasses = async () => {
    const { data: classes, error } = await supabase
      .from('classes')
      .select('id, name, grade')
      .order('grade', { ascending: true });

    if (!error && classes) {
      setClasses(classes);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleEdit = async (user: User) => {
    setEditingUser(user);

    // Kullanıcının mevcut sınıflarını al
    const { data: userClasses, error } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', user.id);

    if (!error && userClasses) {
      setSelectedClasses(userClasses.map((uc) => uc.class_id));
    }

    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      points: user.points || 0,
      experience: user.experience || 0,
      grade: user.grade || 0,
      referred_by: user.referred_by || '',
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      // Kullanıcı bilgilerini güncelle
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: editFormData.name,
          email: editFormData.email,
          points: editFormData.points,
          experience: editFormData.experience,
          grade: editFormData.grade,
          referred_by: editFormData.referred_by,
        })
        .eq('id', editingUser.id);

      if (updateError) throw updateError;

      // Mevcut sınıf ilişkilerini sil
      const { error: deleteError } = await supabase
        .from('class_students')
        .delete()
        .eq('student_id', editingUser.id);

      if (deleteError) throw deleteError;

      // Yeni sınıf ilişkilerini ekle
      if (selectedClasses.length > 0) {
        const { error: insertError } = await supabase
          .from('class_students')
          .insert(
            selectedClasses.map((classId) => ({
              student_id: editingUser.id,
              class_id: classId,
            }))
          );

        if (insertError) throw insertError;
      }

      setEditDialogOpen(false);
      fetchUsers();
      if (onUserUpdate) onUserUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kullanıcı güncellenirken bir hata oluştu');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: name === 'points' || name === 'experience' || name === 'grade'
        ? parseInt(value) || 0
        : value,
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Sadece VIP</Typography>
          <Switch
            checked={filters.showOnlyVip}
            onChange={(e) => setFilters((prev) => ({ ...prev, showOnlyVip: e.target.checked }))}
            size="small"
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Sadece Aktif</Typography>
          <Switch
            checked={filters.showOnlyActive}
            onChange={(e) => setFilters((prev) => ({ ...prev, showOnlyActive: e.target.checked }))}
            size="small"
          />
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ad Soyad</TableCell>
              <TableCell>E-posta</TableCell>
              <TableCell>Sınıf</TableCell>
              <TableCell>Sınıflar</TableCell>
              <TableCell align="right">Puan</TableCell>
              <TableCell align="right">XP</TableCell>
              <TableCell align="right">Sınıf Seviyesi</TableCell>
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
                  <TableCell>{user.grade || '-'}</TableCell>
                  <TableCell>
                    {user.class_students?.map((cs: any) => (
                      <Chip
                        key={cs.classes.id}
                        label={`${cs.classes.name} (${cs.classes.grade}. Sınıf)`}
                        size="small"
                        sx={{ m: 0.5 }}
                      />
                    )) || '-'}
                  </TableCell>
                  <TableCell align="right">{user.points}</TableCell>
                  <TableCell align="right">{user.experience}</TableCell>
                  <TableCell align="right">{user.grade || '-'}</TableCell>
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
                      <IconButton onClick={() => handleDeleteUser(user.id)} size="small">
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
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Sayfa başına satır:"
      />

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Kullanıcı Düzenle</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Ad Soyad"
              name="name"
              value={editFormData.name}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              label="E-posta"
              name="email"
              value={editFormData.email}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              label="Referans Kodu"
              name="referred_by"
              value={editFormData.referred_by || ''}
              onChange={handleInputChange}
              helperText="Kullanıcıyı kim davet etti?"
            />
            <TextField
              fullWidth
              type="number"
              label="Puan"
              name="points"
              value={editFormData.points}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              type="number"
              label="Deneyim"
              name="experience"
              value={editFormData.experience}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              type="number"
              label="Sınıf Seviyesi"
              name="grade"
              value={editFormData.grade}
              onChange={handleInputChange}
            />
            <FormControl fullWidth>
              <InputLabel>Sınıflar</InputLabel>
              <Select
                multiple
                value={selectedClasses}
                onChange={(e) =>
                  setSelectedClasses(
                    typeof e.target.value === 'string' ? [e.target.value] : e.target.value
                  )
                }
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((classId) => {
                      const classItem = classes.find((c) => c.id === classId);
                      return (
                        <Chip
                          key={classId}
                          label={classItem ? `${classItem.name} (${classItem.grade}. Sınıf)` : classId}
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name} ({cls.grade}. Sınıf)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
