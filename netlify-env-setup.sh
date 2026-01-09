#!/bin/bash
# Script para configurar variables de entorno en Netlify
# Ejecutar después de hacer 'netlify login' y 'netlify link'

echo "🚀 Configurando variables de entorno en Netlify..."

# Variables de Firebase
netlify env:set FIREBASE_API_KEY "AIzaSyCvVPWVA1RL1LZHeoE9XY9DCqfWBMbCMmM"
netlify env:set FIREBASE_AUTH_DOMAIN "licencias-taller.firebaseapp.com"
netlify env:set FIREBASE_PROJECT_ID "licencias-taller"
netlify env:set FIREBASE_STORAGE_BUCKET "licencias-taller.firebasestorage.app"
netlify env:set FIREBASE_MESSAGING_SENDER_ID "269860282658"
netlify env:set FIREBASE_APP_ID "1:269860282658:web:bc419fe695e7da84fb057b"
netlify env:set FIREBASE_MEASUREMENT_ID "G-P8WGN2YR21"

# Variables de Admin
netlify env:set LICENSE_ADMIN_USER "admin_licencias"
netlify env:set LICENSE_ADMIN_PASSWORD "SecurePass2025!"

echo "✅ Variables configuradas exitosamente!"
echo "🔄 Ejecuta 'netlify build' para actualizar el sitio"