// Configuración de Firebase
const firebaseConfig = {
  apiKey: "***REMOVED***",
  authDomain: "licencias-taller.firebaseapp.com",
  projectId: "licencias-taller",
  storageBucket: "licencias-taller.firebasestorage.app",
  messagingSenderId: "269860282658",
  appId: "1:269860282658:web:bc419fe695e7da84fb057b",
  measurementId: "G-P8WGN2YR21"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log('✅ Firebase inicializado correctamente');
