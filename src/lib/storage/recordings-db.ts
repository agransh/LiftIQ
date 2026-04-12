import {
  dbUploadRecording,
  dbGetRecordings,
  dbGetRecordingBlob as dbDownloadBlob,
  dbDeleteRecording,
  type DbRecordingMeta,
} from "@/lib/supabase-db";

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
  storagePath?: string | null;
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

async function saveToIndexedDB(meta: RecordingMeta, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ ...meta, blob });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getFromIndexedDB(id: string): Promise<Blob | null> {
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

async function getLocalMetas(): Promise<RecordingMeta[]> {
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

async function deleteFromIndexedDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveRecording(
  meta: RecordingMeta,
  blob: Blob
): Promise<void> {
  await saveToIndexedDB(meta, blob);

  // Upload to Supabase in the background
  dbUploadRecording(
    {
      id: meta.id,
      sessionId: meta.sessionId,
      exercise: meta.exercise,
      exerciseName: meta.exerciseName,
      reps: meta.reps,
      score: meta.score,
      duration: meta.duration,
      size: meta.size,
      createdAt: meta.createdAt,
    },
    blob
  ).catch((err) => console.warn("Background recording upload failed:", err));
}

export async function getRecordingBlob(id: string, storagePath?: string | null): Promise<Blob | null> {
  const local = await getFromIndexedDB(id);
  if (local) return local;

  if (storagePath) {
    const remote = await dbDownloadBlob(storagePath);
    if (remote) {
      // Cache locally for faster access next time
      saveToIndexedDB(
        { id, sessionId: "", exercise: "", exerciseName: "", reps: 0, score: 0, duration: 0, size: remote.size, createdAt: Date.now() },
        remote
      ).catch(() => {});
      return remote;
    }
  }

  return null;
}

export async function getAllRecordingsMeta(): Promise<RecordingMeta[]> {
  let remoteMetas: DbRecordingMeta[] = [];
  try {
    remoteMetas = await dbGetRecordings();
  } catch {
    // Supabase unavailable, fall back to local
  }

  const localMetas = await getLocalMetas();

  // Merge: prefer remote metadata (has storagePath), add any local-only entries
  const merged = new Map<string, RecordingMeta>();
  for (const r of remoteMetas) {
    merged.set(r.id, { ...r });
  }
  for (const l of localMetas) {
    if (!merged.has(l.id)) {
      merged.set(l.id, l);
    }
  }

  return Array.from(merged.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteRecording(id: string, storagePath?: string | null): Promise<void> {
  await deleteFromIndexedDB(id);
  try {
    await dbDeleteRecording(id, storagePath ?? null);
  } catch {
    // Supabase delete can fail if table doesn't exist yet
  }
}
