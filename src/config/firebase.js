import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDMEfh-sQE7FZqiXG7lYic8cy51v18od1o",
  authDomain: "mimi-e-lulu-diario.firebaseapp.com",
  projectId: "mimi-e-lulu-diario",
  storageBucket: "mimi-e-lulu-diario.firebasestorage.app",
  messagingSenderId: "680317972382",
  appId: "1:680317972382:web:5aa4a9c9557292bc3b308f",
  measurementId: "G-NVJYG3MNK3",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, app };
