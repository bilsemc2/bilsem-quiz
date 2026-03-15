import React, { useCallback, useEffect, useState } from 'react';
import {
  loadPublishedBlogPostBySlug,
  loadPublishedBlogPosts,
  subscribeNewsletterEmail,
  type BlogPost
} from '@/features/content/model/blogUseCases';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, FileText, Share2, Sparkles, Bookmark, Loader2, ChevronLeft } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Helmet } from 'react-helmet-async';

// ═══════════════════════════════════════════════
// 📰 BlogPage — Kid-UI Çocuk Dostu Tasarım
// ═══════════════════════════════════════════════

const BlogPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (selectedPost) {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedPost]);

  const fetchBlogPosts = useCallback(async () => {
    try {
      const posts = await loadPublishedBlogPosts();
      setBlogPosts(posts);
      setFilteredPosts(posts);
    } catch { /* load failed */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const filtered = blogPosts.filter(post =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPosts(filtered);
  }, [searchQuery, blogPosts]);

  const fetchSinglePost = useCallback(async (postSlug: string) => {
    try {
      const post = await loadPublishedBlogPostBySlug(postSlug);
      if (!post) {
        toast.error('Blog yazısı bulunamadı');
        navigate('/blog');
        return;
      }

      setSelectedPost(post);
    } catch {
      toast.error('Blog yazısı yüklenemedi');
      navigate('/blog');
    }
  }, [navigate]);

  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]);

  useEffect(() => {
    if (slug) {
      fetchSinglePost(slug);
    } else {
      setSelectedPost(null);
    }
  }, [fetchSinglePost, slug]);

  const formatDate = (date: string) => {
    return format(new Date(date), "d MMMM yyyy", { locale: tr });
  };

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const getPreviewContent = (content: string) => {
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText;
  };

  const getFirstImage = (content: string) => {
    const match = content.match(/<img.*?src=["'](.*?)["']/);
    if (match) return match[1];
    const mdMatch = content.match(/!\[.*?\]\((.*?)\)/);
    return mdMatch ? mdMatch[1] : null;
  };

  const getCategory = (post: BlogPost) => post.category || 'BİLSEM';

  const structuredData = selectedPost
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": selectedPost.title,
        "description": getPreviewContent(selectedPost.content),
        "image": selectedPost.image_url || getFirstImage(selectedPost.content),
        "datePublished": selectedPost.created_at,
        "dateModified": selectedPost.updated_at,
        "author": {
          "@type": "Organization",
          "name": "BilsemC2"
        },
        "publisher": {
          "@type": "Organization",
          "name": "BilsemC2",
          "logo": {
            "@type": "ImageObject",
            "url": "https://bilsemc2.com/images/beyninikullan.png"
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `https://bilsemc2.com/blog/${selectedPost.slug}`
        }
      }
    : null;

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const result = await subscribeNewsletterEmail(email);

      if (result === 'duplicate') {
        toast.info('Zaten kayıtlısınız!');
        setSubscribed(true);
      } else if (result === 'success') {
        toast.success('Bültene başarıyla katıldınız!');
        setSubscribed(true);
      }
    } catch {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && selectedPost) {
      try {
        await navigator.share({
          title: selectedPost.title,
          url: window.location.href,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link kopyalandı!');
    }
  };

  /* ─────── Loading ─────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyber-pink animate-spin" />
      </div>
    );
  }

  /* ─────── Blog Detail ─────── */
  if (selectedPost) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 md:px-6 transition-colors">
        {structuredData && (
          <Helmet>
            <script type="application/ld+json">
              {JSON.stringify(structuredData)}
            </script>
          </Helmet>
        )}
        {/* Dot Pattern */}
        <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Reading Progress Bar */}
          <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-transparent">
            <motion.div
              className="h-full bg-cyber-emerald"
              initial={{ width: 0 }}
              animate={{ width: `${readingProgress}%` }}
            />
          </div>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-lg"
          >
            {/* Accent Strip */}
            <div className="h-2.5 bg-cyber-pink" />

            {/* Header */}
            <div className="p-6 md:p-8">
              <button
                onClick={() => navigate('/blog')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 text-black dark:text-white border-2 border-black/10 dark:border-white/10 rounded-lg font-nunito font-extrabold text-xs uppercase tracking-widest hover:-translate-y-0.5 transition-all mb-6"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Tüm Yazılar</span>
              </button>

              <h1 className="text-2xl md:text-4xl font-nunito font-black text-black dark:text-white leading-tight mb-5">
                {selectedPost.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg border-2 border-black/10 dark:border-white/10 font-nunito font-extrabold text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(selectedPost.created_at)}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg border-2 border-black/10 dark:border-white/10 font-nunito font-extrabold text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{getReadingTime(selectedPost.content)} dk okuma</span>
                </div>
                <div className="flex-1" />
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2 bg-cyber-blue/10 text-cyber-blue border-2 border-cyber-blue/20 rounded-lg hover:-translate-y-0.5 transition-all"
                    title="Paylaş"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 bg-cyber-pink/10 text-cyber-pink border-2 border-cyber-pink/20 rounded-lg hover:-translate-y-0.5 transition-all"
                    title="Kaydet"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Cover Image */}
            {(selectedPost.image_url || getFirstImage(selectedPost.content)) && (
              <div className="px-6 md:px-8 pb-6">
                <img
                  src={selectedPost.image_url || getFirstImage(selectedPost.content)!}
                  alt={selectedPost.title}
                  className="w-full aspect-[21/9] object-cover rounded-xl border-2 border-black/10"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-6 md:p-10">
              <div className="prose prose-lg dark:prose-invert max-w-none font-nunito
                prose-headings:font-nunito prose-headings:font-black prose-headings:text-black dark:prose-headings:text-white
                prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:font-bold prose-p:text-sm
                prose-a:text-cyber-blue dark:prose-a:text-cyber-emerald prose-a:font-bold hover:prose-a:underline 
                prose-img:rounded-xl prose-img:border-2 prose-img:border-black/10
                prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-strong:text-black dark:prose-strong:text-white prose-strong:font-extrabold
                prose-blockquote:border-l-4 prose-blockquote:border-cyber-blue dark:prose-blockquote:border-cyber-emerald prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-slate-700 prose-blockquote:py-3 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:font-bold prose-blockquote:italic prose-blockquote:text-sm"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedPost.content) }}
              />
            </div>
          </motion.article>

          {/* Related Content CTA */}
          <div className="mt-10 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-md">
            <div className="h-2 bg-cyber-gold" />
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-cyber-gold/10 border-2 border-cyber-gold/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-cyber-gold" />
              </div>
              <h3 className="text-xl font-nunito font-extrabold text-black dark:text-white mb-2 uppercase tracking-tight">
                Bunu Sevebilirsiniz
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-xs mb-6 max-w-md mx-auto">BİLSEM hazırlık sürecinde çocuğunuzun zihinsel becerilerini geliştirecek eğitimlerimize göz atın.</p>
              <Link to="/atolyeler" className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-gold text-black border-3 border-black/10 font-nunito font-extrabold rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all uppercase text-xs tracking-wider">
                Atölyeleri Keşfet
              </Link>
            </div>
          </div>

          {/* Back button */}
          <div className="text-center mt-10">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border-3 border-black/10 text-black dark:text-white font-nunito font-extrabold rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all uppercase text-xs tracking-wider"
            >
              <ArrowLeft className="w-4 h-4" />
              Tüm Blog Yazıları
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ─────── Blog List ─────── */
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-6 transition-colors">
      {/* Dot Pattern */}
      <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-black dark:text-white border-2 border-black/10 dark:border-white/10 rounded-lg font-nunito font-extrabold text-xs uppercase tracking-widest hover:-translate-y-0.5 transition-all mb-6"
          >
            <ChevronLeft size={14} /> Ana Sayfa
          </Link>

          <h1 className="text-4xl lg:text-5xl font-nunito font-black text-black dark:text-white mb-4 tracking-tight">
            Eğitim <span className="text-cyber-pink">Vizyonu</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm max-w-2xl mx-auto mb-8">
            BİLSEM sınavları, çocuk psikolojisi ve geleceğin eğitim trendlerine dair uzman görüşleri.
          </p>

          <div className="max-w-xl mx-auto relative">
            <input
              type="text"
              placeholder="Makale ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3.5 bg-white dark:bg-slate-800 border-3 border-black/10 rounded-xl text-black dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyber-blue/30 shadow-neo-sm transition-all font-nunito font-bold text-sm"
            />
          </div>
        </motion.div>

        {/* Featured Post */}
        {!searchQuery && blogPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12"
          >
            <Link
              to={`/blog/${blogPosts[0].slug}`}
              className="group relative flex flex-col lg:flex-row bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden transition-all shadow-neo-lg hover:-translate-y-1 hover:shadow-neo-lg"
            >
              <div className="lg:w-1/2 aspect-[16/10] overflow-hidden border-b-4 lg:border-b-0 lg:border-r-4 border-black/10">
                {blogPosts[0].image_url || getFirstImage(blogPosts[0].content) ? (
                  <img
                    src={blogPosts[0].image_url || getFirstImage(blogPosts[0].content)!}
                    alt={blogPosts[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-cyber-blue/10 flex items-center justify-center p-12">
                    <FileText className="w-20 h-20 text-cyber-blue/40" />
                  </div>
                )}
                <div className="absolute top-4 left-4 px-3 py-1 bg-cyber-gold text-black text-[10px] font-nunito font-extrabold rounded-lg border-2 border-black/10 uppercase tracking-widest shadow-neo-sm">
                  ÖNE ÇIKAN
                </div>
              </div>
              <div className="lg:w-1/2 p-6 lg:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-[10px] font-nunito font-extrabold text-slate-500 dark:text-slate-400 mb-4 tracking-widest uppercase">
                  <span className="px-2.5 py-1 bg-cyber-blue/10 border-2 border-cyber-blue/20 rounded-lg text-cyber-blue">
                    {getCategory(blogPosts[0])}
                  </span>
                  <span>{getReadingTime(blogPosts[0].content)} DK OKUMA</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-nunito font-black text-black dark:text-white mb-4 group-hover:text-cyber-pink transition-colors leading-tight">
                  {blogPosts[0].title}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm mb-6 line-clamp-3 leading-relaxed">
                  {getPreviewContent(blogPosts[0].content)}
                </p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-9 h-9 rounded-xl bg-cyber-emerald/20 border-2 border-cyber-emerald/30" />
                  <div>
                    <p className="text-black dark:text-white font-nunito font-extrabold text-xs uppercase">Admin</p>
                    <p className="text-slate-400 text-[10px] font-nunito font-bold">{formatDate(blogPosts[0].created_at)}</p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Blog Grid Header */}
        <div className="flex items-center justify-between mb-6 overflow-hidden">
          <h3 className="shrink-0 text-xl font-nunito font-extrabold text-black dark:text-white flex items-center gap-3 uppercase tracking-tight">
            <div className="w-2.5 h-7 bg-cyber-pink rounded-full" />
            {searchQuery ? 'Arama Sonuçları' : 'Son Yazılar'}
          </h3>
          <div className="flex-1 h-px bg-black/5 dark:bg-white/5 mx-4 hidden sm:block" />
          <span className="shrink-0 bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-nunito font-extrabold px-3 py-1 text-xs tracking-wider rounded-lg uppercase">
            {filteredPosts.length} YAZI
          </span>
        </div>

        {/* Blog Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts
              .filter(post => searchQuery || post.id !== blogPosts[0]?.id)
              .map((post, idx) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group block bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl transition-all duration-300 overflow-hidden h-full flex flex-col hover:-translate-y-1 shadow-neo-sm hover:shadow-neo-md"
                  >
                    <div className="aspect-[16/10] overflow-hidden relative border-b-3 border-black/10">
                      {post.image_url || getFirstImage(post.content) ? (
                        <img
                          src={post.image_url || getFirstImage(post.content)!}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-cyber-emerald/10 flex items-center justify-center">
                          <FileText className="w-12 h-12 text-cyber-emerald/30" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm border-2 border-black/10 text-[9px] font-nunito font-extrabold text-black rounded-lg uppercase tracking-widest">
                          {getCategory(post)}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 text-[9px] font-nunito font-extrabold text-slate-400 mb-3 tracking-widest uppercase">
                        <span className="bg-gray-50 dark:bg-slate-700 border border-black/5 px-2 py-0.5 rounded-md">{formatDate(post.created_at)}</span>
                        <span>{getReadingTime(post.content)} DK</span>
                      </div>

                      <h2 className="text-lg font-nunito font-extrabold text-black dark:text-white group-hover:text-cyber-pink transition-colors mb-3 line-clamp-2 leading-tight">
                        {post.title}
                      </h2>

                      <p className="text-slate-500 dark:text-slate-400 text-xs font-nunito font-bold leading-relaxed line-clamp-3 flex-1 mb-5">
                        {getPreviewContent(post.content)}
                      </p>

                      <div className="pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                        <span className="px-3 py-1.5 bg-black text-white rounded-lg font-nunito font-extrabold text-[9px] uppercase tracking-wider group-hover:bg-cyber-blue transition-colors">
                          OKUMAYA DEVAM ET
                        </span>
                        <Bookmark className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-cyber-gold transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}

            {/* Newsletter CTA Card */}
            {!searchQuery && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden flex flex-col justify-center text-center shadow-neo-md"
              >
                <div className="h-2 bg-cyber-pink" />
                <div className="p-6">
                  <div className="w-12 h-12 bg-cyber-pink/10 border-2 border-cyber-pink/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-cyber-pink" />
                  </div>
                  <h3 className="text-lg font-nunito font-extrabold text-black dark:text-white mb-2 uppercase tracking-tight">Bültene Katılın</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-xs mb-5">En yeni BİLSEM ipuçlarını e-postanıza gönderelim.</p>

                  {subscribed ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="py-3 bg-cyber-emerald/10 border-2 border-cyber-emerald/30 rounded-xl text-cyber-emerald font-nunito font-extrabold text-sm"
                    >
                      Aramıza Hoş Geldiniz! ✨
                    </motion.div>
                  ) : (
                    <form
                      onSubmit={handleNewsletter}
                      className="space-y-3"
                    >
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="E-posta adresiniz"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border-2 border-black/10 dark:border-white/10 rounded-xl text-black dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyber-pink/30 transition-all font-nunito font-bold text-sm"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-cyber-pink text-black font-nunito font-extrabold uppercase text-xs tracking-wider border-3 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'TAKİBE AL'
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl shadow-neo-md"
          >
            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700 border-2 border-black/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-nunito font-extrabold text-black dark:text-white mb-2 uppercase tracking-tight">
              Henüz blog yazısı bulunmuyor
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-xs mb-6">
              Yakında yeni içerikler yayınlanacak, takipte kalın!
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyber-blue text-white border-3 border-black/10 font-nunito font-extrabold rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all uppercase text-xs tracking-wider"
            >
              <Sparkles className="w-4 h-4" />
              Ana Sayfaya Dön
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
