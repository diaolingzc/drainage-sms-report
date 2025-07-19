import { openDB, deleteDB } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const DB_NAME = 'SmsReportDB';
const DB_VERSION = 2;
const STORES = ['signatures', 'links', 'numbers', 'templates'];

let db;

const initDB = async () => {
  if (db) return;
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      for (const storeName of STORES) {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          if (storeName === 'signatures') {
            store.createIndex('content', 'content', { unique: true });
          }
          if (storeName === 'links') {
            store.createIndex('short_url', 'short_url', { unique: true });
          }
          if (storeName === 'numbers') {
            store.createIndex('number', 'number', { unique: true });
          }
          if (storeName === 'templates') {
            store.createIndex('content', 'content', { unique: true });
          }
        }
      }
    },
  });
};

const getAll = async (storeName) => {
  await initDB();
  return db.getAll(storeName);
};

const add = async (storeName, value) => {
  await initDB();
  if (!value.id) {
    value.id = uuidv4();
  }
  return db.add(storeName, value);
};

const put = async (storeName, value) => {
  await initDB();
  if (!value.id) {
    value.id = uuidv4();
  }
  return db.put(storeName, value);
};

const remove = async (storeName, key) => {
  await initDB();
  return db.delete(storeName, key);
};

const exportDB = async () => {
  await initDB();
  const zip = new JSZip();
  const data = {};
  for (const storeName of STORES) {
    data[storeName] = await db.getAll(storeName);
  }
  zip.file('SmsReportDB.json', JSON.stringify(data));
  const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 }, password: '123456' });
  saveAs(content, 'SmsReportDB.zip');
};

const importDB = async (file, mode = 'incremental') => {
  await initDB();
  const zip = await JSZip.loadAsync(file, { password: '123456' });
  const jsonFile = zip.file('SmsReportDB.json');
  if (!jsonFile) throw new Error('Invalid zip file: SmsReportDB.json not found');

  const dataStr = await jsonFile.async('string');
  const data = JSON.parse(dataStr);

  const tx = db.transaction(STORES, 'readwrite');

  try {
    const uniqueIndexes = {
      signatures: 'content',
      links: 'short_url',
      numbers: 'number',
      templates: 'content',
    };

    if (mode === 'overwrite') {
      for (const storeName of STORES) {
        await tx.objectStore(storeName).clear();
      }
    }

    for (const storeName of STORES) {
      const storeData = data[storeName];
      if (storeData) {
        const store = tx.objectStore(storeName);
        const uniqueIndexName = uniqueIndexes[storeName];

        for (const item of storeData) {
          if (mode === 'incremental' && uniqueIndexName) {
            const uniqueValue = item[uniqueIndexName];
            if (uniqueValue) {
              const existing = await store.index(uniqueIndexName).get(uniqueValue);
              if (existing) {
                continue; // Skip if item with unique key already exists
              }
            }
            item.id = uuidv4(); // Ensure new ID is generated
            store.put(item);
          } else {
            if (!item.id || mode === 'incremental') {
              item.id = uuidv4();
            }
            store.put(item);
          }
        }
      }
    }

    await tx.done;
  } catch (error) {
    tx.abort();
    console.error('Import transaction failed:', error);
    if (error.name === 'NotFoundError') {
      db.close();
      await deleteDB(DB_NAME);
      throw new Error('数据库结构已过期，已自动删除旧数据库。请刷新页面重试。');
    } else {
      throw error; // Re-throw other errors
    }

  }
};

export const dbService = {
  initDB,
  getAll,
  add,
  put,
  remove,
  exportDB,
  importDB,
};