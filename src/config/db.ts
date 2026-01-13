import clientPromise from './mongo_client';
import { GridFSBucket } from 'mongodb';

let db: any;
let gfs: GridFSBucket;

export const connectDB = async () => {
  try {
    const client = await clientPromise;
    db = client.db();
    gfs = new GridFSBucket(db, { bucketName: 'uploads' });
    console.log('Connected to MongoDB');
    return { db, gfs };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export const getDB = () => db;
export const getGFS = () => gfs;