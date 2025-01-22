import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const questionsDir = path.join(process.cwd(), 'public', 'images', 'questions', 'Matris');
    const files = fs.readdirSync(questionsDir);
    
    // Sadece Soru-*.webp formatındaki dosyaları say
    const questionCount = files.filter(file => /^Soru-\d+\.webp$/.test(file)).length;

    res.status(200).json({ count: questionCount });
  } catch (error) {
    console.error('Error getting question count:', error);
    res.status(500).json({ message: 'Error getting question count', error });
  }
}
