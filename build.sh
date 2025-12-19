#!/bin/bash
# Script de build para generar variables de entorno para el frontend

echo "🚀 Generando variables de entorno para el frontend..."

# Crear el archivo env.js con las variables de entorno
cat > env.js << EOF
// Variables de entorno generadas automáticamente durante el build
window.ENV = {
  FIREBASE_API_KEY: '${FIREBASE_API_KEY}',
  FIREBASE_AUTH_DOMAIN: '${FIREBASE_AUTH_DOMAIN}',
  FIREBASE_PROJECT_ID: '${FIREBASE_PROJECT_ID}',
  FIREBASE_STORAGE_BUCKET: '${FIREBASE_STORAGE_BUCKET}',
  FIREBASE_MESSAGING_SENDER_ID: '${FIREBASE_MESSAGING_SENDER_ID}',
  FIREBASE_APP_ID: '${FIREBASE_APP_ID}',
  FIREBASE_MEASUREMENT_ID: '${FIREBASE_MEASUREMENT_ID}',
  LICENSE_ADMIN_USER: '${LICENSE_ADMIN_USER}',
  LICENSE_ADMIN_PASSWORD: '${LICENSE_ADMIN_PASSWORD}'
};
EOF

echo "✅ Archivo env.js generado exitosamente"
echo "📄 Contenido:"
cat env.js