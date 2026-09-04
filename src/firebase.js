import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCx9gT32hIeag_Eca7p8d5b575F3Y8YY0Y",
  authDomain: "ink-saboteur.firebaseapp.com",
  databaseURL: "https://ink-saboteur-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ink-saboteur",
  storageBucket: "ink-saboteur.firebasestorage.app",
  messagingSenderId: "73553820521",
  appId: "1:73553820521:web:fa1080762449e99d291bf8"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export default app;
