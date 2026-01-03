import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Bookmark, Loader2, FileText, Calendar, Clock, ChevronLeft, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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

const BlogPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  useEffect(() => {
    if (slug) {
      fetchSinglePost(slug);
    } else {
      setSelectedPost(null);
    }
  }, [slug]);

  const fetchBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogPosts(data || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSinglePost = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();

      if (error) {
        console.error('Blog yazısı yüklenirken hata:', error);
        toast.error('Blog yazısı yüklenemedi');
        navigate('/blog');
        return;
      }

      if (!data) {
        toast.error('Blog yazısı bulunamadı');
        navigate('/blog');
        return;
      }

      setSelectedPost(data);
    } catch (error) {
      console.error('Blog yazısı yüklenirken beklenmeyen hata:', error);
      toast.error('Blog yazısı yüklenemedi');
      navigate('/blog');
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "d MMMM yyyy", { locale: tr });
  };

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const getPreviewContent = (content: string) => {
    const plainText = content.replace(/[#*`_\[\]]/g, '').replace(/\n/g, ' ');
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  };

  const handleShare = async () => {
    if (navigator.share && selectedPost) {
      try {
        await navigator.share({
          title: selectedPost.title,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link kopyalandı!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
      </div>
    );
  }

  // Detay Sayfası
  if (selectedPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 pt-24 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-white/5">
              <button
                onClick={() => navigate('/blog')}
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors mb-6 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Tüm Yazılar</span>
              </button>

              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4">
                {selectedPost.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(selectedPost.created_at)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{getReadingTime(selectedPost.content)} dk okuma</span>
                </div>
                <div className="flex-1" />
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                    title="Paylaş"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                    title="Kaydet"
                  >
                    <Bookmark className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
              <div className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white">
                <ReactMarkdown>{selectedPost.content}</ReactMarkdown>
              </div>
            </div>
          </motion.article>

          {/* Back button at bottom */}
          <div className="text-center mt-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700/50 border border-white/10 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tüm Blog Yazıları
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Liste Sayfası
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-purple-400 font-bold hover:text-purple-300 transition-colors mb-4 uppercase text-xs tracking-widest"
          >
            <ChevronLeft size={16} />
            Ana Sayfa
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-sm font-medium mb-4">
            <FileText className="w-4 h-4" />
            Blog
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">
            📚 Eğitim & <span className="text-purple-400">BİLSEM</span> Rehberi
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            BİLSEM sınavları, çocuk gelişimi ve eğitim dünyasından güncel yazılar
          </p>
        </motion.div>

        {/* Blog Grid */}
        {blogPosts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post, idx) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to={`/blog/${post.slug}`}
                  className="group block bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-2xl hover:border-white/20 transition-all duration-300 overflow-hidden h-full hover:-translate-y-1"
                >
                  {/* Color accent bar */}
                  <div className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />

                  <div className="p-5 flex flex-col h-full">
                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(post.created_at)}</span>
                      <span className="mx-1">•</span>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{getReadingTime(post.content)} dk</span>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors mb-2 line-clamp-2">
                      {post.title}
                    </h2>

                    {/* Preview */}
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 flex-1">
                      {getPreviewContent(post.content)}
                    </p>

                    {/* Read more */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <span className="text-sm font-medium text-purple-400 group-hover:text-purple-300 flex items-center gap-1">
                        Devamını Oku
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-slate-800/50 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Henüz blog yazısı bulunmuyor
            </h3>
            <p className="text-slate-400 mb-6">
              Yakında yeni içerikler yayınlanacak, takipte kalın!
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Ana Sayfaya Dön
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
