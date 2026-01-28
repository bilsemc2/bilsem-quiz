import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, FileText, Share2, Sparkles, Bookmark, Loader2, ChevronLeft } from 'lucide-react';
import DOMPurify from 'dompurify';

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

  // AI SEO: Inject JSON-LD Structured Data
  useEffect(() => {
    if (selectedPost) {
      const schemaData = {
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
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'json-ld-article';
      script.text = JSON.stringify(schemaData);
      document.head.appendChild(script);

      return () => {
        const existingScript = document.getElementById('json-ld-article');
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
      };
    }
  }, [selectedPost]);

  const fetchBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogPosts(data || []);
      setFilteredPosts(data || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = blogPosts.filter(post =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPosts(filtered);
  }, [searchQuery, blogPosts]);

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
    // HTML taglerini temizle
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText;
  };

  const getFirstImage = (content: string) => {
    const match = content.match(/<img.*?src=["'](.*?)["']/);
    if (match) return match[1];

    // Markdown fallback (mevcut yazılar için)
    const mdMatch = content.match(/!\[.*?\]\((.*?)\)/);
    return mdMatch ? mdMatch[1] : null;
  };

  const getCategory = (post: BlogPost) => post.category || 'BİLSEM';

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email: email.trim() }]);

      if (error) {
        if (error.code === '23505') {
          toast.info('Zaten kayıtlısınız!');
          setSubscribed(true);
        } else {
          throw error;
        }
      } else {
        toast.success('Bültene başarıyla katıldınız!');
        setSubscribed(true);
      }
    } catch (error: unknown) {
      console.error('Newsletter error:', error);
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
        <div className="max-w-4xl mx-auto">
          {/* Reading Progress Bar */}
          <div className="fixed top-0 left-0 w-full h-1 z-[100]">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${readingProgress}%` }}
            />
          </div>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
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

            {/* Cover Image in Detail View */}
            {(selectedPost.image_url || getFirstImage(selectedPost.content)) && (
              <div className="px-6 md:px-10 py-4">
                <img
                  src={selectedPost.image_url || getFirstImage(selectedPost.content)!}
                  alt={selectedPost.title}
                  className="w-full aspect-[21/9] object-cover rounded-3xl border border-white/10"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-6 md:p-12">
              <div className="prose prose-invert prose-lg max-w-none font-inter
                prose-headings:font-outfit prose-headings:font-black prose-headings:tracking-tight
                prose-headings:text-transparent prose-headings:bg-clip-text prose-headings:bg-gradient-to-r prose-headings:from-white prose-headings:to-slate-400
                prose-p:text-slate-300 prose-p:leading-[1.8] prose-p:text-[1.1rem]
                prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline 
                prose-img:rounded-[2rem] prose-img:shadow-2xl prose-img:border prose-img:border-white/10
                prose-li:text-slate-300 prose-strong:text-white prose-strong:font-bold
                prose-blockquote:border-purple-500 prose-blockquote:bg-purple-500/5 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:rounded-r-3xl prose-blockquote:italic"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedPost.content) }}
              />
            </div>
          </motion.article>

          {/* Featured Related Content Placeholder */}
          <div className="mt-12 p-8 bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-white/10 rounded-[2rem] text-center">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
              Bunu Sevebilirsiniz
            </h3>
            <p className="text-slate-300 mb-6">BİLSEM hazırlık sürecinde çocuğunuzun zihinsel becerilerini geliştirecek eğitimlerimize göz atın.</p>
            <Link to="/atolyeler" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-slate-950 font-black rounded-full hover:scale-105 transition-transform shadow-xl">
              Atölyeleri Keşfet
            </Link>
          </div>

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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-purple-400 font-bold hover:text-purple-300 transition-colors mb-6 uppercase text-[10px] tracking-[0.2em]"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Ana Sayfa
          </Link>

          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 tracking-tight">
            Eğitim <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Vizyonu</span>
          </h1>
          <p className="text-slate-400 text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            BİLSEM sınavları, çocuk psikolojisi ve geleceğin eğitim trendlerine dair uzman görüşleri.
          </p>

          <div className="max-w-md mx-auto relative group">
            <div className="absolute inset-0 bg-purple-500/20 blur-2xl group-focus-within:bg-pink-500/30 transition-colors" />
            <input
              type="text"
              placeholder="Makale ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="relative w-full px-6 py-4 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder:text-slate-500 outline-none focus:border-purple-500/50 transition-all font-medium"
            />
          </div>
        </motion.div>

        {/* Featured Post (if not searching) */}
        {!searchQuery && blogPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-16"
          >
            <Link
              to={`/blog/${blogPosts[0].slug}`}
              className="group relative flex flex-col lg:flex-row bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[3rem] overflow-hidden hover:border-white/20 transition-all shadow-2xl"
            >
              <div className="lg:w-1/2 aspect-[16/10] overflow-hidden">
                {blogPosts[0].image_url || getFirstImage(blogPosts[0].content) ? (
                  <img
                    src={blogPosts[0].image_url || getFirstImage(blogPosts[0].content)!}
                    alt={blogPosts[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center p-12">
                    <FileText className="w-24 h-24 text-white/20" />
                  </div>
                )}
                <div className="absolute top-6 left-6 px-4 py-1.5 bg-purple-600 text-white text-xs font-black rounded-full shadow-lg">
                  ÖNE ÇIKAN
                </div>
              </div>
              <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mb-4 tracking-wider">
                  <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-purple-400 uppercase">
                    {getCategory(blogPosts[0])}
                  </span>
                  <span>{getReadingTime(blogPosts[0].content)} DK OKUMA</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-black text-white mb-6 group-hover:text-purple-400 transition-colors leading-tight">
                  {blogPosts[0].title}
                </h2>
                <p className="text-slate-400 text-lg mb-8 line-clamp-3 leading-relaxed">
                  {getPreviewContent(blogPosts[0].content)}
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                  <div>
                    <p className="text-white font-bold text-sm leading-none">Admin</p>
                    <p className="text-slate-500 text-[10px] mt-1 uppercase font-bold">{formatDate(blogPosts[0].created_at)}</p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Blog Grid Header */}
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <div className="w-2 h-8 bg-purple-500 rounded-full" />
            {searchQuery ? 'Arama Sonuçları' : 'Son Yazılar'}
          </h3>
          <div className="text-slate-500 text-sm font-bold tracking-tighter uppercase">
            {filteredPosts.length} YAZI BULUNDU
          </div>
        </div>

        {/* Blog Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts
              .filter(post => searchQuery || post.id !== blogPosts[0]?.id) // Skip featured on main list if not searching
              .map((post, idx) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group block bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] hover:border-white/20 transition-all duration-500 overflow-hidden h-full flex flex-col hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10"
                  >
                    <div className="aspect-[16/10] overflow-hidden relative">
                      {post.image_url || getFirstImage(post.content) ? (
                        <img
                          src={post.image_url || getFirstImage(post.content)!}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                          <FileText className="w-12 h-12 text-slate-700" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-slate-900/80 backdrop-blur-md border border-white/10 text-[10px] font-black text-purple-400 rounded-full uppercase tracking-tighter">
                          {getCategory(post)}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 flex flex-col flex-1">
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 mb-4 tracking-widest uppercase">
                        <span>{formatDate(post.created_at)}</span>
                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span>{getReadingTime(post.content)} DK</span>
                      </div>

                      <h2 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors mb-4 line-clamp-2 leading-tight">
                        {post.title}
                      </h2>

                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 flex-1 mb-6">
                        {getPreviewContent(post.content)}
                      </p>

                      <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors flex items-center gap-1.5">
                          KEŞFET
                          <ArrowLeft className="w-3.5 h-3.5 rotate-180 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <Bookmark className="w-4 h-4 text-slate-700 group-hover:text-amber-500/50 transition-colors" />
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
                className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-[2.5rem] p-8 flex flex-col justify-center text-center shadow-xl shadow-purple-500/20"
              >
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2 leading-none">Bültene Katılın</h3>
                <p className="text-white/80 text-sm mb-6 font-medium">En yeni BİLSEM ipuçlarını ve eğitim içeriklerini e-postanıza gönderelim.</p>

                {subscribed ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-4 bg-white/10 rounded-2xl border border-white/20 text-white font-bold"
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
                      className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 outline-none focus:bg-white/20 transition-all font-medium"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Takibe Al'
                      )}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
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
