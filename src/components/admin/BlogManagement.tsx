import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, X, Loader2, FileText, Eye, EyeOff, Wand2, Bot } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import BlogRichTextEditor from './BlogRichTextEditor';
import ImageUploader from './ImageUploader';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import AIBlogWriterModal from './AIBlogWriterModal';
import { adminBlogRepository, type AdminBlogPost } from '@/server/repositories/adminBlogRepository';
import {
  createEmptyBlogFormData,
  shouldShowFixMarkdownAction,
  toCreateBlogPostInput,
  toUpdateBlogPostInput,
  type BlogFormData
} from '@/features/admin/model/blogManagementUseCases';

const BlogManagement = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAIWriterOpen, setIsAIWriterOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminBlogPost | null>(null);
  const [formData, setFormData] = useState<BlogFormData>(createEmptyBlogFormData());
  const [aiWriterMode, setAIWriterMode] = useState<'generate' | 'beautify'>('generate');
  const [aiWriterInitialContent, setAIWriterInitialContent] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await adminBlogRepository.listPosts();
      setPosts(data);
    } catch (error) {
      console.error('Blog yazıları yüklenirken hata:', error);
      toast.error('Blog yazıları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (post?: AdminBlogPost) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        content: post.content,
        published: post.published,
        image_url: post.image_url,
        category: post.category,
      });
    } else {
      setEditingPost(null);
      setFormData(createEmptyBlogFormData());
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPost(null);
    setFormData(createEmptyBlogFormData());
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Lütfen bir başlık girin');
      return;
    }

    try {
      setIsSaving(true);
      if (editingPost) {
        await adminBlogRepository.updatePost(editingPost.id, toUpdateBlogPostInput(formData));
        toast.success('Blog yazısı güncellendi');
      } else {
        if (!user?.id) {
          toast.error('Oturum bulunamadı');
          return;
        }

        await adminBlogRepository.createPost(toCreateBlogPostInput(formData, user.id));
        toast.success('Blog yazısı oluşturuldu');
      }

      handleCloseDialog();
      await fetchPosts();
    } catch (error: unknown) {
      console.error('Blog yazısı kaydedilirken hata:', error);
      toast.error('Blog yazısı kaydedilemedi: ' + (error instanceof Error ? error.message : 'Hata oluştu'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (post: AdminBlogPost) => {
    if (window.confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) {
      try {
        await adminBlogRepository.deletePost(post.id);
        toast.success('Blog yazısı silindi');
        await fetchPosts();
      } catch (error) {
        console.error('Blog yazısı silinirken hata:', error);
        toast.error('Blog yazısı silinemedi');
      }
    }
  };

  const handleFixMarkdown = async (post: AdminBlogPost) => {
    try {
      // Markdown'dan HTML'e dönüştür
      const htmlContent = await marked.parse(post.content);

      await adminBlogRepository.updatePostContent(post.id, htmlContent, new Date().toISOString());
      toast.success('Görünüm düzeltildi (HTML\'e dönüştürüldü)');
      await fetchPosts();
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
      <div className="flex justify-between items-center bg-white border-2 border-black/10 rounded-2xl p-6 shadow-neo-md mb-8">
        <h1 className="text-3xl font-nunito font-extrabold text-black flex items-center gap-4 uppercase">
          <FileText className="w-8 h-8 text-[#FF00EA]" />
          Blog Yönetimi
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button
            onClick={() => {
              setAIWriterMode('generate');
              setAIWriterInitialContent('');
              setIsAIWriterOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#FF00EA] border-2 border-black/10 text-white px-6 py-3 rounded-xl font-black uppercase shadow-neo-xs hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all"
          >
            <Bot className="w-5 h-5" />
            AI ile Yazı Yaz
          </button>
          <button
            onClick={() => handleOpenDialog()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#3374FF] border-2 border-black/10 text-white px-6 py-3 rounded-xl font-black uppercase shadow-neo-xs hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all"
          >
            <Plus className="w-5 h-5" />
            Yeni Yazı Ekle
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border-2 border-black/10 shadow-neo-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#14F195]/20 border-b-2 border-black/10">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-black text-black uppercase tracking-wider">Başlık</th>
                <th className="text-left py-4 px-6 text-sm font-black text-black uppercase tracking-wider">Oluşturulma Tarihi</th>
                <th className="text-center py-4 px-6 text-sm font-black text-black uppercase tracking-wider">Durum</th>
                <th className="text-center py-4 px-6 text-sm font-black text-black uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/5">
              {posts.map((post, idx) => (
                <motion.tr
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-gray-100 transition-colors"
                >
                  <td className="py-4 px-6 font-bold text-black">{post.title}</td>
                  <td className="py-4 px-6 text-black/70 font-bold text-sm">
                    {format(new Date(post.created_at), 'd MMMM yyyy', { locale: tr })}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border-2 border-black/10 text-xs font-black uppercase  ${post.published
                      ? 'bg-[#14F195] text-black'
                      : 'bg-gray-200 text-black'
                      }`}>
                      {post.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {post.published ? 'Yayında' : 'Taslak'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center gap-2">
                      {shouldShowFixMarkdownAction(post.content) && (
                        <button
                          onClick={() => handleFixMarkdown(post)}
                          className="p-2 bg-[#FFD700] border-2 border-black/10 rounded-lg hover:-translate-y-1 transition-all"
                          title="Markdown Yazımını Düzelt"
                        >
                          <Wand2 className="w-5 h-5 text-black" />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenDialog(post)}
                        className="p-2 bg-[#3374FF] text-white border-2 border-black/10 rounded-lg hover:-translate-y-1 transition-all"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="p-2 bg-[#FF2745] text-white border-2 border-black/10 rounded-lg hover:-translate-y-1 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
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
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-3 border-black/10 rounded-2xl shadow-neo-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-white py-4 z-20 border-b-2 border-black/10 -mx-8 px-8">
              <div className="flex items-center gap-4">
                <Dialog.Title className="text-3xl font-nunito font-extrabold text-black uppercase">
                  {editingPost ? 'Yazıyı Düzenle' : 'Yeni Yazı'}
                </Dialog.Title>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#14F195] border-2 border-black/10 text-black text-sm font-black uppercase rounded-xl hover:-translate-y-1 shadow-neo-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Kaydet
                </button>
              </div>
              <Dialog.Description className="sr-only">
                Blog yazısı içerik ve ayarlarını buradan yönetebilirsiniz.
              </Dialog.Description>
              <Dialog.Close asChild>
                <button className="p-2 border-2 border-black/10 rounded-xl hover:bg-gray-100 hover:-translate-y-1 transition-all"><X className="w-6 h-6 text-black" /></button>
              </Dialog.Close>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">Başlık</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-5 py-3 border-2 border-black/10 rounded-xl focus:-translate-y-1 focus:shadow-neo-xs  transition-all text-black font-bold outline-none placeholder:text-black/40"
                  placeholder="Yazı başlığı"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">Kategori</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-5 py-3 border-2 border-black/10 rounded-xl focus:-translate-y-1 focus:shadow-neo-xs  transition-all text-black font-bold outline-none placeholder:text-black/40"
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-black text-black uppercase tracking-wide">İçerik</label>
                  <div className="flex items-center gap-3">
                    {formData.content && (
                      <button
                        type="button"
                        onClick={() => {
                          setAIWriterMode('beautify');
                          setAIWriterInitialContent(formData.content);
                          setIsAIWriterOpen(true);
                        }}
                        className="flex items-center gap-2 text-xs font-black text-black bg-[#FFD700] border-2 border-black/10 hover:-translate-y-1 px-3 py-1.5 rounded-lg transition-all uppercase"
                        title="AI ile Yazıyı Güzelleştir"
                      >
                        <Bot className="w-4 h-4" />
                        AI ile Güzelleştir
                      </button>
                    )}
                    {formData.content && shouldShowFixMarkdownAction(formData.content) && (
                      <button
                        type="button"
                        onClick={async () => {
                          const html = await marked.parse(formData.content);
                          setFormData({ ...formData, content: html });
                          toast.success('Markdown HTML\'e dönüştürüldü');
                        }}
                        className="flex items-center gap-2 text-xs font-black text-white bg-[#FF2745] border-2 border-black/10 hover:-translate-y-1 px-3 py-1.5 rounded-lg transition-all uppercase"
                        title="Markdown'ı HTML'e Çevir"
                      >
                        <Wand2 className="w-4 h-4" />
                        Görünümü Düzelt
                      </button>
                    )}
                  </div>
                </div>
                <div className="border-2 border-black/10 rounded-xl overflow-hidden shadow-neo-xs">
                  <BlogRichTextEditor
                    key={editingPost?.id || 'new'}
                    content={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                  />
                </div>
                <p className="text-xs text-black/60 font-bold mt-2">Zengin metin editörü ile yazılarınızı düzenleyebilirsiniz</p>
              </div>

              {/* Toggle */}
              <label className="flex items-center gap-4 cursor-pointer p-4 border-2 border-black/10 rounded-xl bg-gray-100 shadow-neo-xs">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, published: !formData.published })}
                  className={`relative w-14 h-8 rounded-full border-2 border-black/10 transition-colors ${formData.published ? 'bg-[#14F195]' : 'bg-white'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-black rounded-full transition-transform ${formData.published ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
                <span className="text-black font-black uppercase tracking-wider text-sm">{formData.published ? 'YAYINDA' : 'TASLAK DURUMUNDA'}</span>
              </label>

              {/* Preview */}
              {formData.content && (
                <div className="mt-8">
                  <h3 className="text-sm font-black text-black mb-4 uppercase tracking-wide">Önizleme:</h3>
                  <div
                    className="p-8 bg-white rounded-2xl border-2 border-black/10 shadow-neo-md prose prose-lg max-w-none text-black font-medium prose-headings:font-nunito prose-headings:font-black"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formData.content) }}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 mt-10">
              <Dialog.Close asChild>
                <button disabled={isSaving} className="px-6 py-3 bg-white border-2 border-black/10 text-black font-black uppercase rounded-xl hover:-translate-y-1 shadow-neo-xs active:translate-y-1 active:shadow-none transition-all disabled:opacity-50">İptal</button>
              </Dialog.Close>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 bg-[#14F195] border-2 border-black/10 text-black font-black uppercase rounded-xl hover:-translate-y-1 shadow-neo-xs active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
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
