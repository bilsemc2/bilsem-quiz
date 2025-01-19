import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

interface QuizizzCode {
  id: string;
  code: string;
  class_id: string;
  scheduled_time: string;
  created_at: string;
}

interface Class {
  id: string;
  name: string;
  grade: number;
}

const QuizizzManagement: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [quizizzCodes, setQuizizzCodes] = useState<QuizizzCode[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    class_id: '',
    scheduled_time: '',
  });

  useEffect(() => {
    fetchQuizizzCodes();
    fetchClasses();
  }, []);

  const resetForm = () => {
    setFormData({ code: '', class_id: '', scheduled_time: '' });
    setEditingId(null);
    setOpen(false);
  };

  const handleEdit = (code: QuizizzCode) => {
    setEditingId(code.id);
    setFormData({
      code: code.code,
      class_id: code.class_id,
      scheduled_time: new Date(code.scheduled_time).toISOString().slice(0, 16),
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.code || !formData.class_id || !formData.scheduled_time) {
        setError('Please fill in all fields');
        return;
      }

      const scheduledDate = new Date(formData.scheduled_time);
      const isoDateTime = scheduledDate.toISOString();

      let error;
      if (editingId) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('quizizz_codes')
          .update({
            code: formData.code,
            class_id: formData.class_id,
            scheduled_time: isoDateTime,
          })
          .eq('id', editingId);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('quizizz_codes')
          .insert([{
            code: formData.code,
            class_id: formData.class_id,
            scheduled_time: isoDateTime,
          }]);
        error = insertError;
      }

      if (error) throw error;

      setSuccess(editingId ? 'Quizizz code updated successfully!' : 'Quizizz code added successfully!');
      resetForm();
      fetchQuizizzCodes();
    } catch (error: any) {
      setError(`Error ${editingId ? 'updating' : 'adding'} Quizizz code: ` + error.message);
    }
  };

  const fetchQuizizzCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizizz_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizizzCodes(data || []);
    } catch (error: any) {
      setError('Error fetching Quizizz codes: ' + error.message);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, grade')
        .order('grade', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      setError('Error fetching classes: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quizizz_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Quizizz code deleted successfully!');
      fetchQuizizzCodes();
    } catch (error: any) {
      setError('Error deleting Quizizz code: ' + error.message);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Quizizz Codes</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpen(true)}
        >
          Add New Quizizz Code
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Scheduled Time</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {quizizzCodes.map((code) => (
              <TableRow key={code.id}>
                <TableCell>{code.code}</TableCell>
                <TableCell>
                  {classes.find(c => c.id === code.class_id)?.name || 'Unknown Class'}
                </TableCell>
                <TableCell>
                  {code.scheduled_time ? new Date(code.scheduled_time).toLocaleString('tr-TR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'No date'}
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleEdit(code)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(code.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={resetForm}>
        <DialogTitle>{editingId ? 'Edit Quizizz Code' : 'Add New Quizizz Code'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Quizizz Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Class</InputLabel>
            <Select
              value={formData.class_id}
              onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
            >
              {classes.map((cls) => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.name} (Grade {cls.grade})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="datetime-local"
            label="Scheduled Time"
            value={formData.scheduled_time}
            onChange={(e) => {
              const dateValue = e.target.value;
              if (dateValue) {
                setFormData({ ...formData, scheduled_time: dateValue });
              }
            }}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingId ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizizzManagement;
