import express from 'express';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import cors from 'cors';

interface BoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ProcessedObject {
  name: string;
  score: number;
  boundingBox: BoundingBox;
}

interface ProcessedResult {
  objects: ProcessedObject[];
  text: string;
  labels: string[];
}

const router = express.Router();
router.use(cors());

const vision = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

router.post('/analyze-image', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Google Cloud Vision API'yi çağır
    const [result] = await vision.annotateImage({
      image: { source: { imageUri: imageUrl } },
      features: [
        { type: 'OBJECT_LOCALIZATION' },
        { type: 'TEXT_DETECTION' },
        { type: 'LABEL_DETECTION' },
        { type: 'DOCUMENT_TEXT_DETECTION' },
      ],
    });

    // Sonuçları işle
    const processedResult: ProcessedResult = {
      objects: result.localizedObjectAnnotations?.map(obj => {
        // Varsayılan bounding box
        const defaultBox: BoundingBox = { left: 0, top: 0, width: 0, height: 0 };
        
        // Vertex'leri işle
        const boundingBox = obj.boundingPoly?.normalizedVertices?.reduce<BoundingBox>(
          (box, vertex) => {
            const x = vertex.x ?? 0;
            const y = vertex.y ?? 0;
            
            return {
              left: !box.left || x < box.left ? x : box.left,
              top: !box.top || y < box.top ? y : box.top,
              width: Math.max(box.width, x - box.left),
              height: Math.max(box.height, y - box.top)
            };
          },
          defaultBox
        ) ?? defaultBox;

        return {
          name: obj.name ?? '',
          score: obj.score ?? 0,
          boundingBox
        };
      }) ?? [],
      
      text: result.fullTextAnnotation?.text ?? '',
      labels: result.labelAnnotations?.map(label => label.description ?? '') ?? [],
    };

    res.status(200).json(processedResult);
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'Error analyzing image' });
  }
});

export default router;
