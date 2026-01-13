import { MongoClient } from 'mongodb';
import 'dotenv/config';

const uri = process.env.MONGODB_URI!;
if (!uri) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export default clientPromise;