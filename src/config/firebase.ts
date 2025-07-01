import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDCE9Qzkr0nPy9il1GxmHA79G7RiahjQQo",
  authDomain: "sistemaeditais.firebaseapp.com",
  projectId: "sistemaeditais",
  storageBucket: "sistemaeditais.firebasestorage.app",
  messagingSenderId: "86257422781",
  appId: "1:86257422781:web:ecad0dd2b43dd336a4c2d4",
  measurementId: "G-V284RY3H5T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export default app;