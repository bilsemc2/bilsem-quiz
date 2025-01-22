import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Typography, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Box,
  Avatar,
  Chip,
  IconButton,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import '../styles/blog.css';

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

const BlogPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

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
        .single();

      if (error) throw error;
      setSelectedPost(data);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      navigate('/blog');
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "d MMMM yyyy", { locale: tr });
  };

  const getPreviewContent = (content: string) => {
    return content.length > 150 ? content.substring(0, 150) + '...' : content;
  };

  const getRandomColor = () => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.error.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.success.main,
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (selectedPost) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: 1
          }}
        >
          <Box sx={{ p: 4, borderBottom: 1, borderColor: 'divider' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/blog')}
              sx={{ mb: 3 }}
            >
              Tüm Yazılar
            </Button>

            <Typography variant="h3" component="h1" gutterBottom>
              {selectedPost.title}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {formatDate(selectedPost.created_at)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small">
                  <ShareIcon fontSize="small" />
                </IconButton>
                <IconButton size="small">
                  <BookmarkBorderIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>

          <Box sx={{ p: 4 }}>
            {selectedPost && (
              <Box sx={{ maxWidth: '800px', mx: 'auto', p: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                  {selectedPost.title}
                </Typography>
                <Box sx={{ mt: 4, typography: 'body1' }}>
                  <ReactMarkdown>{selectedPost.content}</ReactMarkdown>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Blog Yazıları
      </Typography>

      <Grid container spacing={4}>
        {blogPosts.map((post) => (
          <Grid item xs={12} md={6} key={post.id}>
            <Card
              component={Link}
              to={`/blog/${post.slug}`}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                textDecoration: 'none',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {post.title}
                </Typography>

                <Typography 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: getPreviewContent(post.content)
                      .replace(/<[^>]*>/g, '')
                  }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(post.created_at)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {blogPosts.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Henüz blog yazısı bulunmuyor.
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default BlogPage;
