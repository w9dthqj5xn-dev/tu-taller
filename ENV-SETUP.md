# 🔒 Configuración Segura - Variables de Entorno

## Descripción

Se ha migrado la configuración de Firebase a variables de entorno para mayor seguridad. Ahora las credenciales no están hardcodeadas en el código fuente.

## 📁 Archivos importantes

- `.env` - Archivo con variables reales (NO COMMITAR A GIT)
- `.env.example` - Plantilla para que otros sepan qué variables necesitan
- `.gitignore` - Evita que `.env` se suba al repositorio
- `firebase-config.js` - Lee las variables de entorno

## 🚀 Usar localmente

1. **El archivo `.env` ya existe** con tus credenciales
2. No necesitas hacer nada, funciona automáticamente

## 🌐 Configurar en Netlify

### Opción 1: Variables de entorno en Netlify (RECOMENDADO)

1. **Ve a tu sitio en Netlify**
2. **Site Settings → Build & Deploy → Environment**
3. **Click en "Edit Variables"**
4. **Agrega estas variables:**

```
VITE_FIREBASE_API_KEY = AIzaSyCvVPWVA1RL1LZHeoE9XY9DCqfWBMbCMmM
VITE_FIREBASE_AUTH_DOMAIN = licencias-taller.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = licencias-taller
VITE_FIREBASE_STORAGE_BUCKET = licencias-taller.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 269860282658
VITE_FIREBASE_APP_ID = 1:269860282658:web:bc419fe695e7da84fb057b
VITE_FIREBASE_MEASUREMENT_ID = G-P8WGN2YR21
```

5. **Haz un nuevo deploy** (git push)

### Opción 2: Usar archivo .env en Netlify

1. No subas `.env` a Git (ya está en `.gitignore`)
2. Configura las variables en Netlify directamente (Opción 1)

## ⚙️ Cómo funciona

- **En desarrollo:** Lee del archivo `.env`
- **En Netlify:** Lee de las variables de entorno configuradas
- **Fallback:** Si no hay variables, usa los valores por defecto

## 🔐 Seguridad

✅ Las credenciales NO se ven en el código público
✅ Las credenciales NO se suben a Git
✅ Las credenciales se cargan desde variables de entorno
✅ Mas seguro para producción

## 📝 Notas

- El archivo `.env` está en `.gitignore`
- Cada developer debe crear su propio `.env`
- Para nuevos developers, pueden copiar `.env.example` → `.env`
- Las credenciales de Firebase ya son públicas (diseño de Firebase)
- Lo importante es que tengas buenas Firestore Rules

## 🔗 Referencias

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-modes)
- [Netlify Environment](https://docs.netlify.com/configure-builds/environment-variables/)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
