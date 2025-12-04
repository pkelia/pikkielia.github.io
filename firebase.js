// Import Firebase services
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } 
from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBa0KpAP8TK7mYyqdYO_I_S5IWzcrbcutU",
  authDomain: "christiananswer-979f0.firebaseapp.com",
  projectId: "christiananswer-979f0",
  storageBucket: "christiananswer-979f0.firebasestorage.app",
  messagingSenderId: "443060144806",
  appId: "1:443060144806:web:cd5908666f88fbfff08267"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Add quiz score
export async function saveScore(playerName, score) {
  await addDoc(collection(db, "leaderboard"), {
    name: playerName,
    score: score,
    date: new Date()
  });
}

// Get top leaderboard scores
export async function loadLeaderboard() {
  const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(20));
  const data = await getDocs(q);
  return data.docs.map(doc => doc.data());
}