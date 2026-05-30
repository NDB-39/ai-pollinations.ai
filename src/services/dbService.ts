import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface GalleryDB extends DBSchema {
  gallery: {
    key: string;
    value: {
      id: string;
      url: string; // The original URL, can be a data URL now
      prompt: string;
      createdAt: number;
    };
    indexes: { 'by-date': number };
  };
}

let dbPromise: Promise<IDBPDatabase<GalleryDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<GalleryDB>('gallery-store', 1, {
      upgrade(db) {
        const store = db.createObjectStore('gallery', {
          keyPath: 'id',
        });
        store.createIndex('by-date', 'createdAt');
      },
    });
  }
  return dbPromise;
}

export async function addImageToDB(image: { id: string; url: string; prompt: string; createdAt: number }) {
  const db = await getDb();
  await db.put('gallery', image);
}

export async function getImagesFromDB() {
  const db = await getDb();
  return await db.getAllFromIndex('gallery', 'by-date');
}

export async function removeImageFromDB(id: string) {
  const db = await getDb();
  await db.delete('gallery', id);
}

export async function clearGalleryDB() {
  const db = await getDb();
  await db.clear('gallery');
}
