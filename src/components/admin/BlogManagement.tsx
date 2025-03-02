import { useState, useEffect, type FC } from 'react';
import slugify from 'slugify';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
  slug: string;
}
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

// Blog yazısı arayüzündeki veri tipi
interface BlogPost {
  id: string;
  title: string;
  content: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
  slug: string;
}

const createSlug = (title: string) => {
  return slugify(title, {
    lower: true,      // küçük harfe çevir
    strict: true,     // sadece URL-safe karakterleri bırak
    locale: 'tr',     // Türkçe karakter desteği
    trim: true        // baş ve sondaki boşlukları temizle
  });
};

const BlogManagement: FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    published: false,
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Blog yazıları yüklenirken hata:', error);
      toast.error('Blog yazıları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        content: post.content,
        published: post.published,
      });
    } else {
      setEditingPost(null);
      setFormData({
        title: '',
        content: '',
        published: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPost(null);
    setFormData({
      title: '',
      content: '',
      published: false,
    });
  };

  const handleSave = async () => {
    try {
      const slug = createSlug(formData.title);
      
      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update({
            title: formData.title,
            content: formData.content,
            published: formData.published,
            updated_at: new Date().toISOString(),
            slug,
          })
          .eq('id', editingPost.id);
        if (error) throw error;
        toast.success('Blog yazısı güncellendi');
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert({
            title: formData.title,
            content: formData.content,
            published: formData.published,
            author_id: user?.id,
            slug,
          });
        if (error) throw error;
        toast.success('Blog yazısı oluşturuldu');
      }

      handleCloseDialog();
      fetchPosts();
    } catch (error) {
      console.error('Blog yazısı kaydedilirken hata:', error);
      toast.error('Blog yazısı kaydedilemedi');
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (window.confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) {
      try {
        const { error } = await supabase
          .from('blog_posts')
          .delete()
          .eq('id', post.id);
        if (error) throw error;
        toast.success('Blog yazısı silindi');
        fetchPosts();
      } catch (error) {
        console.error('Blog yazısı silinirken hata:', error);
        toast.error('Blog yazısı silinemedi');
      }
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
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Blog Yönetimi
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Yeni Blog Yazısı
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Başlık</TableCell>
              <TableCell>Oluşturulma Tarihi</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>{post.title}</TableCell>
                <TableCell>
                  {format(new Date(post.created_at), 'd MMMM yyyy', { locale: tr })}
                </TableCell>
                <TableCell>{post.published ? 'Yayında' : 'Taslak'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(post)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(post)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPost ? 'Blog Yazısını Düzenle' : 'Yeni Blog Yazısı'}
        </DialogTitle>
        <DialogContent>
          <Box mt={2} display="flex" flexDirection="column" gap={3}>
            <TextField
              label="Başlık"
              fullWidth
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              label="İçerik (Markdown)"
              fullWidth
              multiline
              rows={10}
              value={formData.content}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, content: e.target.value })}
              helperText="Markdown formatında yazabilirsiniz"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.published}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, published: e.target.checked })
                  }
                />
              }
              label="Yayınla"
            />
            {formData.content && (
              <Box mt={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Önizleme:
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <ReactMarkdown>{formData.content}</ReactMarkdown>
                </Paper>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BlogManagement;