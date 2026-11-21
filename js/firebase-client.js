import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';

export const OperationType = Object.freeze({
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write'
});

let appInstance = null;
let dbInstance = null;
let authInstance = null;
let configCache = null;
let initPromise = null;

export function getAuthInstance() {
  return authInstance;
}

export function getDbInstance() {
  return dbInstance;
}

export function handleFirestoreError(error, operationType, path) {
  const currentUser = authInstance?.currentUser;
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      tenantId: currentUser?.tenantId ?? null,
      providerInfo: currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(db) {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export async function initFirebase() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const res = await fetch('./firebase-applet-config.json', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to load firebase-applet-config.json (HTTP ${res.status})`);
      }
      configCache = await res.json();
      appInstance = initializeApp(configCache);
      dbInstance = configCache.firestoreDatabaseId
        ? getFirestore(appInstance, configCache.firestoreDatabaseId)
        : getFirestore(appInstance);
      authInstance = getAuth(appInstance);

      await testConnection(dbInstance);
      return { app: appInstance, db: dbInstance, auth: authInstance, config: configCache };
    } catch (err) {
      console.warn('Firebase initialization warning:', err);
      return { app: null, db: null, auth: null, config: null };
    }
  })();

  return initPromise;
}

export {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
};
