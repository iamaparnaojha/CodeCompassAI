import type { Env, Roadmap } from '../types/index.js';

// In-memory cache for MongoDB connection
let cachedClient: any = null;
let cachedDb: any = null;

// In-memory fallback storage when MongoDB is unavailable
let inMemoryStorage = new Map<string, any>();
let mongoAvailable = true;

async function connectToDatabase(env: Env) {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const { MongoClient } = await import('mongodb');

    if (!env.MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI not configured - using in-memory storage');
      mongoAvailable = false;
      return null;
    }

    // Configure MongoDB client with proper SSL/TLS and timeout settings
    cachedClient = new MongoClient(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
    });

    console.log('🔄 Connecting to MongoDB Atlas...');
    await cachedClient.connect();

    // Extract database name from URI or use default
    const dbName = env.MONGODB_URI.match(/\.net\/([^?]+)/)?.[1] || 'openroad';
    cachedDb = cachedClient.db(dbName);

    console.log('✅ Connected to MongoDB Atlas successfully');
    mongoAvailable = true;
    return cachedDb;
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message);

    // Provide helpful error messages based on error type
    if (error.message?.includes('ENOTFOUND') || error.message?.includes('getaddrinfo')) {
      console.error('💡 DNS resolution failed. Check your internet connection.');
    } else if (error.message?.includes('ETIMEDOUT') || error.message?.includes('timed out')) {
      console.error('💡 Connection timed out. This may be due to:');
      console.error('   - IP address not whitelisted in MongoDB Atlas');
      console.error('   - Firewall blocking port 27017');
      console.error('   - Network connectivity issues');
    } else if (error.message?.includes('SSL') || error.message?.includes('TLS')) {
      console.error('💡 SSL/TLS error. This may be due to:');
      console.error('   - IP address not whitelisted in MongoDB Atlas (most common)');
      console.error('   - Incorrect MongoDB credentials');
      console.error('   - Corporate firewall/proxy interfering with TLS');
    } else if (error.message?.includes('Authentication failed')) {
      console.error('💡 Authentication failed. Check your MongoDB username and password.');
    }

    console.warn('⚠️  MongoDB unavailable - falling back to in-memory storage (data will not persist)');
    mongoAvailable = false;
    return null;
  }
}

async function getCollection(env: Env) {
  const db = await connectToDatabase(env);
  if (!db) return null;
  return db.collection('roadmaps');
}

export async function saveRoadmap(
  roadmap: Omit<Roadmap, '_id'>,
  env: Env
): Promise<Roadmap> {
  try {
    const collection = await getCollection(env);

    if (!collection || !mongoAvailable) {
      // Use in-memory storage
      const id = Date.now().toString();
      const roadmapWithId = { ...roadmap, _id: id };
      inMemoryStorage.set(roadmap.githubUrl, roadmapWithId);
      console.log('💾 Saved to in-memory storage (temporary)');
      return roadmapWithId;
    }

    const result = await collection.insertOne(roadmap);
    return {
      ...roadmap,
      _id: result.insertedId.toString(),
    };
  } catch (error) {
    console.error('Save roadmap error:', error);
    // Fallback to in-memory
    const id = Date.now().toString();
    const roadmapWithId = { ...roadmap, _id: id };
    inMemoryStorage.set(roadmap.githubUrl, roadmapWithId);
    console.log('💾 Saved to in-memory storage (fallback)');
    return roadmapWithId;
  }
}

export async function getRoadmapByUrl(
  githubUrl: string,
  env: Env
): Promise<Roadmap | null> {
  try {
    const collection = await getCollection(env);

    if (!collection || !mongoAvailable) {
      // Use in-memory storage
      return inMemoryStorage.get(githubUrl) || null;
    }

    const roadmap = await collection.findOne(
      { githubUrl },
      { sort: { createdAt: -1 } }
    );

    return roadmap as Roadmap | null;
  } catch (error) {
    console.error('Get roadmap error:', error);
    // Fallback to in-memory
    return inMemoryStorage.get(githubUrl) || null;
  }
}

export async function getRecentRoadmaps(
  limit: number = 10,
  env: Env
): Promise<Roadmap[]> {
  try {
    const collection = await getCollection(env);
    const roadmaps = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return roadmaps as Roadmap[];
  } catch (error) {
    console.error('Get recent roadmaps error:', error);
    return [];
  }
}

export async function updateRoadmap(
  id: string,
  updates: Partial<Roadmap>,
  env: Env
): Promise<boolean> {
  try {
    const { ObjectId } = await import('mongodb');
    const collection = await getCollection(env);

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Update roadmap error:', error);
    return false;
  }
}

export async function deleteRoadmap(id: string, env: Env): Promise<boolean> {
  try {
    const { ObjectId } = await import('mongodb');
    const collection = await getCollection(env);

    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Delete roadmap error:', error);
    return false;
  }
}

export async function getCachedRoadmap(
  githubUrl: string,
  env: Env,
  maxAgeMs: number = 3600000
): Promise<Roadmap | null> {
  const roadmap = await getRoadmapByUrl(githubUrl, env);

  if (!roadmap) {
    return null;
  }

  const createdAt = new Date(roadmap.createdAt).getTime();
  const now = Date.now();

  if (now - createdAt > maxAgeMs) {
    return null;
  }

  return roadmap;
}
