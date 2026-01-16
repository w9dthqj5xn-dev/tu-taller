// Configuración de Firebase
// Las credenciales se cargan desde window.ENV (generadas por build.sh en Netlify)
// Con valores por defecto de respaldo para desarrollo local
const firebaseConfig = {
  apiKey: window.ENV?.FIREBASE_API_KEY || "AIzaSyCvVPWVA1RL1LZHeoE9XY9DCqfWBMbCMmM",
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
const auth = firebase.auth();
const storage = firebase.storage();

// Configurar proveedor de Google (declarar en scope global)
let googleProvider = null;
try {
    googleProvider = new firebase.auth.GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    
    console.log('✅ Firebase y Google Auth inicializados correctamente');
    console.log('✅ Google Provider configurado:', googleProvider);
    
    // Verificar estado de autenticación al cargar
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log('👤 Usuario ya autenticado:', user.displayName || user.email);
        } else {
            console.log('👤 No hay usuario autenticado');
        }
    });
    
} catch (error) {
    console.error('❌ Error al configurar Google Provider:', error);
    console.log('🔍 Verifica que Firebase Auth esté correctamente configurado');
    console.error('Stack:', error.stack);
}
