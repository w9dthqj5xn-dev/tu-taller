// Configuración de Firebase
// Usa variables de entorno si están disponibles (Netlify)
// Si no, usa los valores por defecto (desarrollo local)

const getEnv = (key, defaultValue) => {
  // En Netlify, las variables de entorno están disponibles
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
    return window.__ENV__[key];
  }
  // Fallback a valores por defecto
  return defaultValue;
};

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY", "AIzaSyCvVPWVA1RL1LZHeoE9XY9DCqfWBMbCMmM"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN", "licencias-taller.firebaseapp.com"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID", "licencias-taller"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET", "licencias-taller.firebasestorage.app"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "269860282658"),
  appId: getEnv("VITE_FIREBASE_APP_ID", "1:269860282658:web:bc419fe695e7da84fb057b"),
  measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID", "G-P8WGN2YR21")
};

// Inicializar Firebase con manejo de errores
try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    let db = firebase.firestore();
    
    // Hacer db disponible globalmente
    window.db = db;
    
    console.log('✅ Firebase inicializado correctamente');
    console.log('📦 db global disponible:', typeof window.db !== 'undefined');
  } else {
    console.error('❌ Firebase SDK no cargó correctamente');
  }
} catch (error) {
  console.error('❌ Error al inicializar Firebase:', error);
  console.warn('⚠️ La aplicación funcionará solo con localStorage');
}
