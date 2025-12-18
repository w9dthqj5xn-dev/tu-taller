# 🔒 Guía Rápida - Configuración Segura en Netlify

## Pasos para Netlify

### 1. Variables de Entorno en Netlify

```
Site Settings 
  → Build & Deploy 
    → Environment Variables 
      → Add variables
```

Agrega estas 7 variables:

| Variable | Valor |
|----------|-------|
| VITE_FIREBASE_API_KEY | ***REMOVED*** |
| VITE_FIREBASE_AUTH_DOMAIN | licencias-taller.firebaseapp.com |
| VITE_FIREBASE_PROJECT_ID | licencias-taller |
| VITE_FIREBASE_STORAGE_BUCKET | licencias-taller.firebasestorage.app |
| VITE_FIREBASE_MESSAGING_SENDER_ID | 269860282658 |
| VITE_FIREBASE_APP_ID | 1:269860282658:web:bc419fe695e7da84fb057b |
| VITE_FIREBASE_MEASUREMENT_ID | G-P8WGN2YR21 |

### 2. Hacer Push a Git

```bash
git add .env.example .gitignore netlify.toml firebase-config.js ENV-SETUP.md
git commit -m "🔒 Agregar configuración segura con variables de entorno"
git push
```

### 3. Redeploy en Netlify

- Netlify automáticamente redesplegará con las nuevas variables

## ✅ Verificar que funciona

1. Ve a tu sitio en Netlify
2. Abre la consola (F12)
3. Deberías ver: `✅ Firebase inicializado correctamente`
4. Sin errores de configuración

## 📁 Archivos creados

- `.env` - Credenciales (NO en Git)
- `.env.example` - Plantilla
- `.gitignore` - Ignora .env
- `ENV-SETUP.md` - Documentación completa
- `firebase-config.js` - Actualizado con variables de entorno

## 🚨 Importante

**NUNCA hagas commit del archivo `.env`**

El `.gitignore` ya lo protege, pero verifica:

```bash
# Esto NO debería subirse
git status | grep .env

# Debería estar vacío o no mostrar .env
```

## 🔐 Beneficios

✅ Credenciales no están en código fuente
✅ Diferentes credenciales por ambiente (dev/prod)
✅ Mayor seguridad
✅ Fácil para equipo
✅ Soluciona el warning de Netlify

¿Necesitas ayuda con los pasos?
