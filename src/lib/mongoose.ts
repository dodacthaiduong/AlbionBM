import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? '';
const MONGODB_DB = process.env.MONGODB_DB ?? '';

if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in environment variables');
}
if (!MONGODB_DB) {
    throw new Error('MONGODB_DB is not set in environment variables');
}

type MongooseCache = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};

declare global {
    var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
    global._mongooseCache ?? { conn: null, promise: null };

if (!global._mongooseCache) {
    global._mongooseCache = cached;
}

export async function connect(): Promise<typeof mongoose> {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            dbName: MONGODB_DB,
            bufferCommands: false,
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}
