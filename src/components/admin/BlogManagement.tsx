import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, X, Loader2, FileText, Eye, EyeOff, Wand2, Bot } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import BlogRichTextEditor from './BlogRichTextEditor';
import ImageUploader from './ImageUploader';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import AIBlogWriterModal from './AIBlogWriterModal';

const createSlug = (title: string) => {
  if (!title) return '';

  const map: { [key: string]: string } = {
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u'
  };

  let result = title.toLowerCase();
  Object.keys(map).forEach(key => {
    result = result.split(key).join(map[key]);
  });

  // Harf ve rakam dışındaki karakterleri temizle, boşlukları tire yap
  result = result
    .replace(/[^a-z0-9\s-]/g, '') // Özel karakterleri sil
    .trim()
    .replace(/\s+/g, '-')        // Boşlukları tire yap
    .replace(/-+/g, '-');        // Birden fazla tireyi teke indir

  console.log('New Manual Slugified:', result);
  return result;
};

interface BlogPost {
  id: string;
  title: string;
  content: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
  slug: string;
  image_url?: string;
  category?: string;
}

interface BlogFormData {
  title: string;
  content: string;
  published: boolean;
  image_url: string;
  category: string;
}

const BlogManagement = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAIWriterOpen, setIsAIWriterOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    content: '',
    published: false,
    image_url: '',
    category: '',
  });
  const [aiWriterMode, setAIWriterMode] = useState<'generate' | 'beautify'>('generate');
  const [aiWriterInitialContent, setAIWriterInitialContent] = useState('');

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
        image_url: post.image_url || '',
        category: post.category || '',
      });
    } else {
      setEditingPost(null);
      setFormData({ title: '', content: '', published: false, image_url: '', category: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPost(null);
    setFormData({ title: '', content: '', published: false, image_url: '', category: '' });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Lütfen bir başlık girin');
      return;
    }

    try {
      setIsSaving(true);
      // Slug sadece yeni yazılarda veya başlık değiştiğinde güncellensin (SEO için opsiyonel ama burada basitlik için her seferinde yapıyoruz)
      // Ancak mevcut yazının slug'ını değiştirmek linkleri kırabilir.
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
            image_url: formData.image_url,
            category: formData.category,
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
            image_url: formData.image_url,
            category: formData.category,
          });
        if (error) throw error;
        toast.success('Blog yazısı oluşturuldu');
      }

      handleCloseDialog();
      fetchPosts();
    } catch (error: unknown) {
      console.error('Blog yazısı kaydedilirken hata:', error);
      toast.error('Blog yazısı kaydedilemedi: ' + (error instanceof Error ? error.message : 'Hata oluştu'));
    } finally {
      setIsSaving(false);
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

  const handleFixMarkdown = async (post: BlogPost) => {
    try {
      // Markdown'dan HTML'e dönüştür
      const htmlContent = marked.parse(post.content);

      const { error } = await supabase
        .from('blog_posts')
        .update({
          content: htmlContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (error) throw error;
      toast.success('Görünüm düzeltildi (HTML\'e dönüştürüldü)');
      fetchPosts();
    } catch (error: unknown) {
      console.error('Dönüştürme hatası:', error);
      toast.error('Düzeltme yapılamadı: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
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
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button
            onClick={() => {
              setAIWriterMode('generate');
              setAIWriterInitialContent('');
              setIsAIWriterOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95"
          >
            <Bot className="w-5 h-5" />
            AI ile Yazı Yaz
          </button>
          <button
            onClick={() => handleOpenDialog()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-indigo-600 border-2 border-indigo-600 px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-50 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Yeni Yazı Ekle
          </button>
        </div>
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
                      {!post.content.includes('<p') && !post.content.includes('<div') && (
                        <button
                          onClick={() => handleFixMarkdown(post)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Markdown Yazımını Düzelt"
                        >
                          <Wand2 className="w-4 h-4" />
                        </button>
                      )}
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
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white py-2 z-20 border-b border-slate-100 -mx-6 px-6">
              <div className="flex items-center gap-4">
                <Dialog.Title className="text-xl font-bold text-slate-900">
                  {editingPost ? 'Blog Yazısını Düzenle' : 'Yeni Blog Yazısı'}
                </Dialog.Title>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                  Kaydet
                </button>
              </div>
              <Dialog.Description className="sr-only">
                Blog yazısı içerik ve ayarlarını buradan yönetebilirsiniz.
              </Dialog.Description>
              <Dialog.Close asChild>
                <button className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-600" /></button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1.5">Başlık</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-slate-900 font-medium outline-none placeholder:text-slate-400"
                  placeholder="Yazı başlığı"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">Kategori</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-slate-900 font-medium outline-none placeholder:text-slate-400"
                    placeholder="Örn: BİLSEM, Eğitim"
                  />
                </div>
                <div>
                  <ImageUploader
                    label="Kapak Görseli"
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                    suggestedTitle={formData.title}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-bold text-slate-900">İçerik</label>
                  <div className="flex items-center gap-2">
                    {formData.content && (
                      <button
                        type="button"
                        onClick={() => {
                          setAIWriterMode('beautify');
                          setAIWriterInitialContent(formData.content);
                          setIsAIWriterOpen(true);
                        }}
                        className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 transition-colors uppercase tracking-tight"
                        title="AI ile Yazıyı Güzelleştir"
                      >
                        <Bot className="w-3 h-3" />
                        AI ile Güzelleştir
                      </button>
                    )}
                    {formData.content && !formData.content.includes('<p') && !formData.content.includes('<div') && (
                      <button
                        type="button"
                        onClick={async () => {
                          const html = await marked.parse(formData.content);
                          setFormData({ ...formData, content: html });
                          toast.success('Markdown HTML\'e dönüştürüldü');
                        }}
                        className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 hover:text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 transition-colors uppercase tracking-tight"
                        title="Markdown'ı HTML'e Çevir"
                      >
                        <Wand2 className="w-3 h-3" />
                        Görünümü Düzelt
                      </button>
                    )}
                  </div>
                </div>
                <BlogRichTextEditor
                  key={editingPost?.id || 'new'}
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
                <p className="text-xs text-slate-500 mt-1">Zengin metin editörü ile yazılarınızı düzenleyebilirsiniz</p>
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
                <span className="text-slate-900 font-bold">Yayınla</span>
              </label>

              {/* Preview */}
              {formData.content && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Önizleme:</h3>
                  <div
                    className="p-6 bg-slate-50 rounded-xl border border-slate-300 shadow-inner prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formData.content) }}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Dialog.Close asChild>
                <button disabled={isSaving} className="px-5 py-2.5 text-slate-700 font-medium hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50">İptal</button>
              </Dialog.Close>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {/* AI Blog Writer Modal */}
      <AIBlogWriterModal
        isOpen={isAIWriterOpen}
        onClose={() => setIsAIWriterOpen(false)}
        mode={aiWriterMode}
        initialContent={aiWriterInitialContent}
        onApplyDraft={(data) => {
          setFormData({
            ...formData,
            title: data.title,
            category: data.category,
            content: data.content,
            published: false
          });
          setOpenDialog(true);
        }}
      />
    </div>
  );
};

export default BlogManagement;