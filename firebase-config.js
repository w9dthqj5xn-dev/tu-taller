// Configuración de Firebase
// Las credenciales se cargan desde window.ENV (generadas por build.sh en Netlify)
const firebaseConfig = {
  apiKey: window.ENV?.FIREBASE_API_KEY,
  authDomain: window.ENV?.FIREBASE_AUTH_DOMAIN,
  projectId: window.ENV?.FIREBASE_PROJECT_ID,
  storageBucket: window.ENV?.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: window.ENV?.FIREBASE_MESSAGING_SENDER_ID,
  appId: window.ENV?.FIREBASE_APP_ID,
  measurementId: window.ENV?.FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Configurar proveedor de Google
let googleProvider;
try {
    googleProvider = new firebase.auth.GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    
    console.log('✅ Firebase y Google Auth inicializados correctamente');
    
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
}
