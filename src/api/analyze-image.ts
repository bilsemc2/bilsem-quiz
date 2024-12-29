import { ImageAnnotatorClient } from '@google-cloud/vision';

const vision = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export async function analyzeImage(imageUrl: string) {
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
    return {
      objects: result.localizedObjectAnnotations?.map(obj => ({
        name: obj.name,
        score: obj.score,
        boundingBox: obj.boundingPoly?.normalizedVertices?.reduce(
          (box, vertex) => {
            if (!box.left || vertex.x < box.left) box.left = vertex.x;
            if (!box.top || vertex.y < box.top) box.top = vertex.y;
            if (!box.width || vertex.x > box.left + box.width) {
              box.width = vertex.x - box.left;
            }
            if (!box.height || vertex.y > box.top + box.height) {
              box.height = vertex.y - box.top;
            }
            return box;
          },
          { left: 0, top: 0, width: 0, height: 0 }
        ),
      })) || [],
      
      text: result.fullTextAnnotation?.text || '',
      
      labels: result.labelAnnotations?.map(label => label.description) || [],
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}
