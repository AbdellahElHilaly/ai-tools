const DB_NAME = "ai-tools";
const DB_VERSION = 1;
const STORE = "quizzes";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction(mode, operation) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = operation(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export const localQuizStore = {
  put: (quiz) => transaction("readwrite", (store) => store.put(quiz)),
  get: (id) => transaction("readonly", (store) => store.get(id)),
  getAll: () => transaction("readonly", (store) => store.getAll()),
  remove: (id) => transaction("readwrite", (store) => store.delete(id))
};
