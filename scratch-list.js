import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAdbbOAhpyNGLF_EcEKXnchYSUB-wFTnCk",
  authDomain: "elfarouk-store.firebaseapp.com",
  projectId: "elfarouk-store",
  storageBucket: "elfarouk-store.firebasestorage.app",
  messagingSenderId: "180294720357",
  appId: "1:180294720357:web:7e44bd24127ec13aae1f8c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  try {
    console.log("Signing in...");
    await signInWithEmailAndPassword(auth, "omarabdelhamead611@gmail.com", "omar333hhh!!!");
    console.log("Signed in successfully!");

    console.log("Fetching categories...");
    const snap = await getDocs(collection(db, 'categories'));
    const categories = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Categories found:", categories);
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

run();
