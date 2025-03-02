import express from 'express';
import cors from 'cors';
import analyzeImageRouter from './api/analyze-image';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api', analyzeImageRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
