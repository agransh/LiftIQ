const DB_NAME = "liftiq-recordings";
const DB_VERSION = 1;
const STORE_NAME = "videos";

export interface RecordingMeta {
  id: string;
  sessionId: string;
  exercise: string;
  exerciseName: string;
  reps: number;
  score: number;
  duration: number;
  createdAt: number;
  size: number;
}

interface RecordingEntry extends RecordingMeta {
  blob: Blob;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("sessionId", "sessionId", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRecording(
  meta: RecordingMeta,
  blob: Blob
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ ...meta, blob });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getRecordingBlob(id: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => {
      const entry = request.result as RecordingEntry | undefined;
      resolve(entry?.blob ?? null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getAllRecordingsMeta(): Promise<RecordingMeta[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const entries = (request.result as RecordingEntry[]) || [];
      const metas: RecordingMeta[] = entries
        .map(({ blob: _, ...meta }) => meta)
        .sort((a, b) => b.createdAt - a.createdAt);
      resolve(metas);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteRecording(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
