
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BASE_URL = 'https://bilsemc2.com';

const staticPages = [
    '',
    '/blog',
    '/bilsem-rehberi',
    '/services',
    '/plans',
    '/about',
    '/faq',
    '/contact',
    '/atolyeler',
    '/atolyeler/muzik',
    '/atolyeler/resim',
    '/atolyeler/bireysel-degerlendirme',
    '/atolyeler/hizli-okuma',
    '/oyunlar',
    '/zeka-arcade',
    '/deyimler',
];

async function generateSitemap() {
    console.log('Generating dynamic sitemap...');

    try {
        // 1. Fetch Blog Posts
        const { data: blogPosts, error: blogError } = await supabase
            .from('blog_posts')
            .select('slug, updated_at')
            .eq('published', true);

        if (blogError) throw blogError;

        // 2. Fetch BİLSEM Kurumları
        const { data: kurumlar, error: kurumError } = await supabase
            .from('bilsem_kurumlari')
            .select('slug');

        if (kurumError) throw kurumError;

        const today = new Date().toISOString().split('T')[0];

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Static Pages
        staticPages.forEach((page) => {
            const priority = page === '' ? '1.0' : (page.includes('/') ? '0.8' : '0.9');
            xml += `  <url>\n`;
            xml += `    <loc>${BASE_URL}${page}</loc>\n`;
            xml += `    <lastmod>${today}</lastmod>\n`;
            xml += `    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>\n`;
            xml += `    <priority>${priority}</priority>\n`;
            xml += `  </url>\n`;
        });

        // Dynamic Blog Posts
        blogPosts.forEach((post) => {
            xml += `  <url>\n`;
            xml += `    <loc>${BASE_URL}/blog/${post.slug}</loc>\n`;
            xml += `    <lastmod>${post.updated_at ? post.updated_at.split('T')[0] : today}</lastmod>\n`;
            xml += `    <changefreq>monthly</changefreq>\n`;
            xml += `    <priority>0.7</priority>\n`;
            xml += `  </url>\n`;
        });

        // Dynamic BİLSEM Kurumları
        kurumlar.forEach((kurum) => {
            xml += `  <url>\n`;
            xml += `    <loc>${BASE_URL}/bilsem-rehberi/${kurum.slug}</loc>\n`;
            xml += `    <lastmod>${today}</lastmod>\n`;
            xml += `    <changefreq>monthly</changefreq>\n`;
            xml += `    <priority>0.6</priority>\n`;
            xml += `  </url>\n`;
        });

        xml += '</urlset>';

        const outputPath = resolve('public', 'sitemap.xml');
        writeFileSync(outputPath, xml);

        console.log(`Successfully generated sitemap with ${staticPages.length + blogPosts.length + kurumlar.length} URLs at ${outputPath}`);
    } catch (error) {
        console.error('Error generating sitemap:', error);
        process.exit(1);
    }
}

generateSitemap();
