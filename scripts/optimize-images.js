import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function optimizeImage(inputPath) {
    try {
        const image = sharp(inputPath);
        const metadata = await image.metadata();
        
        // Optimize the image
        await image
            .webp({
                quality: 80, // Slightly reduce quality for better compression
                effort: 6,  // Maximum compression effort
            })
            .toBuffer()
            .then(async (buffer) => {
                // Only save if the new file is smaller
                const originalSize = (await fs.stat(inputPath)).size;
                if (buffer.length < originalSize) {
                    await fs.writeFile(inputPath, buffer);
                    console.log(`Optimized: ${inputPath} (${originalSize} -> ${buffer.length} bytes)`);
                } else {
                    console.log(`Skipped: ${inputPath} (already optimized)`);
                }
            });
    } catch (error) {
        console.error(`Error processing ${inputPath}:`, error);
    }
}

async function processDirectory(directory) {
    try {
        const entries = await fs.readdir(directory, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);
            
            if (entry.isDirectory()) {
                await processDirectory(fullPath);
            } else if (entry.name.toLowerCase().endsWith('.webp')) {
                await optimizeImage(fullPath);
            }
        }
    } catch (error) {
        console.error(`Error processing directory ${directory}:`, error);
    }
}

// Start optimization from the Matris directory
const targetDir = path.join(__dirname, '../public/images/questions/Matris');
processDirectory(targetDir)
    .then(() => console.log('Optimization complete!'))
    .catch(console.error);
