// Configuración de Firebase
const firebaseConfig = {
  apiKey: window.ENV?.FIREBASE_API_KEY || "***REMOVED***",
  authDomain: window.ENV?.FIREBASE_AUTH_DOMAIN || "licencias-taller.firebaseapp.com",
  projectId: window.ENV?.FIREBASE_PROJECT_ID || "licencias-taller",
  storageBucket: window.ENV?.FIREBASE_STORAGE_BUCKET || "licencias-taller.firebasestorage.app",
  messagingSenderId: window.ENV?.FIREBASE_MESSAGING_SENDER_ID || "269860282658",
  appId: window.ENV?.FIREBASE_APP_ID || "1:269860282658:web:bc419fe695e7da84fb057b",
  measurementId: window.ENV?.FIREBASE_MEASUREMENT_ID || "G-P8WGN2YR21"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log('✅ Firebase inicializado correctamente');
