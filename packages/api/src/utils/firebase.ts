import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { env } from "@/config/env";

const FIREBASE_PROJECT_ID = env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const firebaseConfig = {
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY
};

const app = !getApps().length ? initializeApp({ credential: cert(firebaseConfig) }) : getApps()[0];

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };