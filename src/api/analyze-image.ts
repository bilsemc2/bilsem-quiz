import { ImageAnnotatorClient } from '@google-cloud/vision';

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

const vision = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export async function analyzeImage(imageUrl: string): Promise<ProcessedResult> {
  try {
    if (!imageUrl) {
      throw new Error('Image URL is required');
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

    return processedResult;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}
