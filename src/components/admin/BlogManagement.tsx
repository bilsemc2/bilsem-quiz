import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, X, Loader2, FileText, Eye, EyeOff } from 'lucide-react';
import slugify from 'slugify';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

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
    lower: true,
    strict: true,
    locale: 'tr',
    trim: true
  });
};

const BlogManagement = () => {
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
      setFormData({ title: '', content: '', published: false });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPost(null);
    setFormData({ title: '', content: '', published: false });
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
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-500" />
          Blog Yönetimi
        </h1>
        <button
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Blog Yazısı
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">Başlık</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">Oluşturulma Tarihi</th>
                <th className="text-center py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">Durum</th>
                <th className="text-center py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map((post, idx) => (
                <motion.tr
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-4 px-6 font-medium text-slate-800">{post.title}</td>
                  <td className="py-4 px-6 text-slate-500 text-sm">
                    {format(new Date(post.created_at), 'd MMMM yyyy', { locale: tr })}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${post.published
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                      }`}>
                      {post.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {post.published ? 'Yayında' : 'Taslak'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => handleOpenDialog(post)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog */}
      <Dialog.Root open={openDialog} onOpenChange={setOpenDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold text-slate-800">
                {editingPost ? 'Blog Yazısını Düzenle' : 'Yeni Blog Yazısı'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Başlık</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">İçerik (Markdown)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">Markdown formatında yazabilirsiniz</p>
              </div>

              {/* Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, published: !formData.published })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${formData.published ? 'bg-indigo-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.published ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
                <span className="text-slate-700 font-medium">Yayınla</span>
              </label>

              {/* Preview */}
              {formData.content && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Önizleme:</h3>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 prose prose-sm max-w-none">
                    <ReactMarkdown>{formData.content}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <button className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl">İptal</button>
              </Dialog.Close>
              <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600">
                Kaydet
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default BlogManagement;