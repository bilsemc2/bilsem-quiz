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
import { toast } from 'sonner';

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
      console.log('Kullanıcılar yükleniyor...');

      // Önce kullanıcıları al
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Kullanıcı verileri:', users);

      if (usersError) {
        console.error('Kullanıcı verisi alınırken hata:', usersError);
        throw usersError;
      }

      if (!users) {
        console.log('Kullanıcı verisi bulunamadı');
        setUsers([]);
        return;
      }

      // Her kullanıcı için sınıf bilgilerini al
      const usersWithClasses = await Promise.all(
        users.map(async (user) => {
          try {
            console.log(`${user.email} için sınıf bilgileri alınıyor...`);
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

            if (classError) {
              console.error(`${user.email} için sınıf bilgileri alınırken hata:`, classError);
              return {
                ...user,
                class_students: []
              };
            }

            return {
              ...user,
              class_students: classStudents || []
            };
          } catch (err) {
            console.error(`${user.email} için sınıf bilgileri alınırken beklenmeyen hata:`, err);
            return {
              ...user,
              class_students: []
            };
          }
        })
      );

      console.log('Tüm kullanıcı verileri:', usersWithClasses);
      setUsers(usersWithClasses);
      setFilteredUsers(usersWithClasses);
      setError(null);
    } catch (err) {
      console.error('Hata detayı:', err);
      const errorMessage = err instanceof Error ? err.message : 'Kullanıcılar yüklenirken bir hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage);
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
      // Sayısal değerleri kontrol et
      const points = Number(editFormData.points);
      const experience = Number(editFormData.experience);
      const grade = Number(editFormData.grade);

      if (isNaN(points) || isNaN(experience) || isNaN(grade)) {
        throw new Error('Puanlar ve deneyim sayısal değer olmalıdır');
      }

      if (points < 0 || experience < 0) {
        throw new Error('Puanlar ve deneyim negatif olamaz');
      }

      // Güncellenecek veriyi hazırla
      const updateData: {
        name: string;
        email: string;
        points: number;
        experience: number;
        grade: number;
        referred_by?: string;
      } = {
        name: editFormData.name,
        email: editFormData.email,
        points: points,
        experience: experience,
        grade: grade,
      };

      // Eğer referred_by değeri varsa ve geçerli bir değerse ekle
      if (editFormData.referred_by && editFormData.referred_by.trim() !== '') {
        // Referans kodunu doğrudan kullan çünkü referred_by text tipinde
        const { data: referredUser, error: referredError } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('referral_code', editFormData.referred_by)
          .single();

        if (referredError) {
          console.error('Referans kontrol hatası:', referredError);
          throw new Error('Geçersiz referans kodu');
        }

        if (referredUser) {
          // Referans kodunu doğrudan kaydet
          updateData.referred_by = editFormData.referred_by;
        }
      } else {
        // Eğer referred_by boşsa, bu alanı güncelleme objesinden çıkar
        // Bu şekilde mevcut değer korunur
        delete updateData.referred_by;
      }

      // Debug log ekle
      console.log('Güncellenecek veriler:', {
        id: editingUser.id,
        ...updateData
      });

      // Profil bilgilerini güncelle
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', editingUser.id)
        .select();

      if (updateError) {
        console.error('Güncelleme hatası:', updateError);
        throw updateError;
      }

      console.log('Güncelleme başarılı:', data);

      // UI'ı güncelle
      setUsers(users.map(user =>
        user.id === editingUser.id
          ? {
            ...user,
            ...updateData
          }
          : user
      ));

      setEditDialogOpen(false);
      toast.success('Kullanıcı başarıyla güncellendi');
    } catch (err) {
      console.error('Hata:', err);
      toast.error(err instanceof Error ? err.message : 'Kullanıcı güncellenirken hata oluştu');
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

  return (
    <Box>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && users.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Henüz hiç kullanıcı bulunmuyor.
        </Alert>
      )}

      {!loading && users.length > 0 && (
        <Box sx={{ width: '100%' }}>
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
                        {user.class_students?.map((cs) => (
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
        </Box>
      )}

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
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
