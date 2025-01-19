import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Switch,
  FormControlLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { supabase } from '../lib/supabase';

interface Puzzle {
  id: string;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
  created_by: string;
  approved: boolean;
}

export const PuzzleManagement: React.FC = () => {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPuzzle, setSelectedPuzzle] = useState<Puzzle | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const fetchPuzzles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('puzzles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPuzzles(data || []);
    } catch (error) {
      console.error('Error fetching puzzles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPuzzles();
  }, []);

  const handleToggleApproval = async (puzzle: Puzzle) => {
    try {
      const { error } = await supabase
        .from('puzzles')
        .update({ approved: !puzzle.approved })
        .eq('id', puzzle.id);

      if (error) throw error;
      
      await fetchPuzzles();
    } catch (error) {
      console.error('Error toggling approval:', error);
    }
  };

  const handleDelete = async (puzzle: Puzzle) => {
    if (window.confirm('Bu bulmacayı silmek istediğinizden emin misiniz?')) {
      try {
        const { error } = await supabase
          .from('puzzles')
          .delete()
          .eq('id', puzzle.id);

        if (error) throw error;
        
        await fetchPuzzles();
      } catch (error) {
        console.error('Error deleting puzzle:', error);
      }
    }
  };

  const handleViewDetails = (puzzle: Puzzle) => {
    setSelectedPuzzle(puzzle);
    setOpenDialog(true);
  };

  if (loading) {
    return <Typography>Yükleniyor...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Bulmaca Yönetimi
      </Typography>
      
      <Grid container spacing={2}>
        {puzzles.map((puzzle) => (
          <Grid item xs={12} sm={6} md={4} key={puzzle.id}>
            <Card>
              {puzzle.image_url && (
                <CardMedia
                  component="img"
                  height="200"
                  image={puzzle.image_url}
                  alt={puzzle.title}
                  sx={{ objectFit: 'contain', bgcolor: 'background.paper' }}
                />
              )}
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" component="div">
                    {puzzle.title}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={puzzle.approved}
                        onChange={() => handleToggleApproval(puzzle)}
                        color="primary"
                      />
                    }
                    label={puzzle.approved ? "Onaylı" : "Onaysız"}
                  />
                </Stack>
                <Typography color="text.secondary" noWrap>
                  {puzzle.description}
                </Typography>
                <Typography variant="caption" display="block">
                  Tarih: {new Date(puzzle.created_at).toLocaleDateString('tr-TR')}
                </Typography>
                <Stack direction="row" spacing={1} mt={1}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleViewDetails(puzzle)}
                  >
                    Detaylar
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(puzzle)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bulmaca Detayları</DialogTitle>
        <DialogContent>
          {selectedPuzzle && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">{selectedPuzzle.title}</Typography>
              <Typography paragraph>{selectedPuzzle.description}</Typography>
              {selectedPuzzle.image_url && (
                <Box sx={{ mt: 2, mb: 2, display: 'flex', justifyContent: 'center', bgcolor: 'background.paper' }}>
                  <img
                    src={selectedPuzzle.image_url}
                    alt={selectedPuzzle.title}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '400px',
                      objectFit: 'contain'
                    }}
                  />
                </Box>
              )}
              <Typography variant="body2">
                Oluşturma Tarihi: {new Date(selectedPuzzle.created_at).toLocaleDateString('tr-TR')}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedPuzzle.approved}
                    onChange={() => {
                      handleToggleApproval(selectedPuzzle);
                      setOpenDialog(false);
                    }}
                  />
                }
                label={selectedPuzzle.approved ? "Onaylı" : "Onaysız"}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
