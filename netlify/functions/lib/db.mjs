import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

export async function getDb() {
    if (cachedDb) return cachedDb;

    const uri = process.env.MONGODB_URI;
    if (!uri) return null;

    const client = new MongoClient(uri);
    await client.connect();
    cachedClient = client;
    cachedDb = client.db(process.env.MONGODB_DB_NAME || 'mark1615');
    return cachedDb;
}

export function ordersCollection(db) {
    return db.collection('orders');
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function emailFilter(email) {
    return { $regex: new RegExp(`^${escapeRegex(email.trim())}$`, 'i') };
}
