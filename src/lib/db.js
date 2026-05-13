// (RS) Logistics Production App
import { database } from './firebase';
import { ref, set, get, update, remove, push } from 'firebase/database';

const ensureDatabase = () => {
  if (!database) {
    throw new Error("Firebase Database is not initialized. Please configure your API key.");
  }
};

export const writeData = async (path, data) => {
  ensureDatabase();
  return set(ref(database, path), data);
};

export const readData = async (path) => {
  ensureDatabase();
  const snapshot = await get(ref(database, path));
  return snapshot.val();
};

export const updateData = async (path, data) => {
  ensureDatabase();
  return update(ref(database, path), data);
};

export const deleteData = async (path) => {
  ensureDatabase();
  return remove(ref(database, path));
};
export const pushData = async (path, data) => {
  ensureDatabase();
  const newRef = push(ref(database, path));
  await set(newRef, data);
  return newRef.key;
};
