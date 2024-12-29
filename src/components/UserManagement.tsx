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
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  full_name: string;
  points: number;
  experience: number;
  is_vip: boolean;
  is_active: boolean;
}

interface UserManagementProps {
  onUserUpdate?: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onUserUpdate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
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

      setUsers(users.map(user => 
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

      setUsers(users.map(user => 
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

      setUsers(users.filter(user => user.id !== userId));
      if (onUserUpdate) onUserUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kullanıcı silinirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Kullanıcı Yönetimi
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ad Soyad</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Puanlar</TableCell>
              <TableCell align="right">Deneyim</TableCell>
              <TableCell align="center">Vip</TableCell>
              <TableCell align="center">Durum</TableCell>
              <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell align="right">{user.points}</TableCell>
                  <TableCell align="right">{user.experience}</TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={user.is_vip}
                      onChange={() => handleToggleVip(user.id, user.is_vip)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={user.is_active ? 'Aktif' : 'Pasif'}
                      color={user.is_active ? 'success' : 'default'}
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Kullanıcıyı Sil">
                      <IconButton
                        onClick={() => handleDeleteUser(user.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Sayfa başına satır:"
        />
      </TableContainer>
    </Box>
  );
};
