// import dotenv from 'dotenv';
// dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db';
import productRoutes from './routes/Product.routes';
import authRoutes from './routes/Auth.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://ug4jqnv8t.localto.net/',
    'https://wo9hhkufr.localto.net/'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Connect DB
connectDB().catch((err) => {
  console.error('Failed to connect to DB:', err);
  process.exit(1);
});

// Image serving with better error handling
app.get('/uploads/:filename', async (req, res) => {
  try {
    const { getGFS } = await import('./config/db');
    const gfs = getGFS();
    const downloadStream = gfs.openDownloadStreamByName(req.params.filename);
    
    downloadStream.on('error', (err) => {
      console.error('GridFS download error:', err);
      res.status(404).json({ message: 'Image not found' });
    });
    
    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ message: 'Error serving image' });
  }
});

// Routes
app.use('/products', productRoutes);

app.use("/auth", authRoutes);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
