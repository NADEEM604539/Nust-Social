// IndexedDB utility for storing uploaded files locally on frontend
const DB_NAME = 'NUST_SOCIAL_FILES';
const DB_VERSION = 1;
const STORE_NAME = 'uploads';

let db = null;

// Initialize IndexedDB
export async function initDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Save file to IndexedDB
export async function saveFileLocally(file, fileId) {
  try {
    await initDB();

    const fileData = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      blob: file,
      uploadedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(fileData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(fileId);
    });
  } catch (error) {
    console.error('Error saving file locally:', error);
    throw error;
  }
}

// Get file from IndexedDB
export async function getFileLocally(fileId) {
  try {
    await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(fileId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const fileData = request.result;
        if (fileData) {
          resolve({
            ...fileData,
            blobUrl: URL.createObjectURL(fileData.blob),
          });
        } else {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error('Error retrieving file locally:', error);
    throw error;
  }
}

// Delete file from IndexedDB
export async function deleteFileLocally(fileId) {
  try {
    await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(fileId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Error deleting file locally:', error);
    throw error;
  }
}

// Get all files from IndexedDB
export async function getAllFilesLocally() {
  try {
    await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const files = request.result.map((fileData) => ({
          ...fileData,
          blobUrl: URL.createObjectURL(fileData.blob),
        }));
        resolve(files);
      };
    });
  } catch (error) {
    console.error('Error retrieving all files:', error);
    throw error;
  }
}

// Create blob URL from file
export function createBlobUrl(file) {
  return URL.createObjectURL(file);
}

// Revoke blob URL
export function revokeBlobUrl(url) {
  URL.revokeObjectURL(url);
}
