# 🔧 SOLUCIÓN: Error de Permisos en Firebase

## ❌ Problema
```
Error al cargar licencias: FirebaseError: Missing or insufficient permissions.
Error al cargar usuarios: FirebaseError: Missing or insufficient permissions.
```

## ✅ Solución

El panel de administración de licencias necesita permisos completos en Firestore. Sigue estos pasos:

### 📋 Paso 1: Ir a Firebase Console

1. Abre tu navegador
2. Ve a: **https://console.firebase.google.com/**
3. Inicia sesión con tu cuenta de Google
4. Selecciona el proyecto: **licencias-taller**

### 🔐 Paso 2: Actualizar Reglas de Firestore

1. En el menú lateral, haz clic en: **Firestore Database**
2. Haz clic en la pestaña: **Reglas** (Rules)
3. Verás un editor con las reglas actuales
4. **BORRA TODO** el contenido actual
5. **COPIA Y PEGA** las reglas del archivo: `FIRESTORE-RULES-ADMIN.txt`

### 📝 Paso 3: Publicar las Reglas

1. Revisa que las reglas se hayan pegado correctamente
2. Haz clic en el botón: **Publicar** (Publish)
3. Espera la confirmación: "Reglas publicadas correctamente"

### 🔄 Paso 4: Verificar

1. Regresa al panel de administración: https://tu-taller.netlify.app/licencias.html
2. Cierra sesión (si estás logueado)
3. Inicia sesión nuevamente con:
   - Usuario: `admin_licencias`
   - Contraseña: `SecurePass2025!`
4. Verifica que ahora carguen las licencias

---

## 🎯 Reglas que debes aplicar (resumen)

Las reglas permiten acceso completo porque:
- ✅ El panel de admin NO usa Firebase Authentication
- ✅ Usa login simple con localStorage
- ✅ La seguridad está en el login del panel (protegido por contraseña)

---

## 📱 Prueba en Ambos Dispositivos

**Dispositivo Principal:**
1. Abre el panel de licencias
2. Click en "🔄 Migrar Datos Locales" (sidebar)
3. Confirma la migración
4. Verás las licencias cargadas

**Otro Dispositivo:**
1. Abre el panel de licencias
2. Inicia sesión
3. Ahora verás todas las licencias sincronizadas
4. Los botones de "🔄 Sincronizar" funcionarán correctamente

---

## 🆘 ¿Sigue sin funcionar?

Si después de aplicar las reglas sigues teniendo problemas:

1. **Verifica que las reglas se aplicaron:**
   - Ve a Firebase Console → Firestore → Reglas
   - Confirma que diga `allow read, write, delete: if true;`

2. **Limpia caché del navegador:**
   - Ctrl + Shift + Delete (Windows/Linux)
   - Cmd + Shift + Delete (Mac)
   - Selecciona "Caché" y "Cookies"

3. **Abre la consola del navegador (F12):**
   - Ve a la pestaña "Console"
   - Envíame cualquier error que veas

---

## 📄 Archivos Relacionados

- `FIRESTORE-RULES-ADMIN.txt` - Reglas completas para copiar
- `firestore-rules-updated.txt` - Reglas anteriores (referencia)

---

**Fecha:** 10 de enero de 2026
**Sistema:** Tu Taller - Panel de Administración de Licencias
