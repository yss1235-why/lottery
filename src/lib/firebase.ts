// File path: src/lib/firebase.ts
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration using environment variables or fallback to hard-coded values
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCG9FYiBcL3XCaF9_JNLcsVAFyjdRWq5g4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "lottery-85f3f.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://lottery-85f3f-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "lottery-85f3f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "lottery-85f3f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1037764284568",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1037764284568:web:98bde5d514183fd0c500ed",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-E0LCNTMCZT"
};

// Initialize Firebase with robust error handling
let app: FirebaseApp;
let database: Database;
let storage: FirebaseStorage;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialize Realtime Database
  try {
    database = getDatabase(app);
    console.log("Firebase Realtime Database initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase Realtime Database:", error);
    // Create a placeholder database object with the expected interface
    database = {} as Database;
  }
  
  // Initialize Storage
  try {
    storage = getStorage(app);
    console.log("Firebase Storage initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase Storage:", error);
    // Create a placeholder storage object with the expected interface
    storage = {} as FirebaseStorage;
  }
  
} catch (error) {
  console.error("Error initializing Firebase:", error);
  // Provide fallback for SSR
  if (typeof window !== 'undefined') {
    console.warn("Firebase services are unavailable. Some features may not work correctly.");
  }
  // Initialize with empty objects that match the expected interfaces
  app = {} as FirebaseApp;
  database = {} as Database;
  storage = {} as FirebaseStorage;
}

export { app, database, storage };