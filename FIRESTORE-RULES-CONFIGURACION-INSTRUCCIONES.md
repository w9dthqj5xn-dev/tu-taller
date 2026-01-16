# 🔥 INSTRUCCIONES PARA CONFIGURAR REGLAS DE FIRESTORE

## ⚠️ PROBLEMA ACTUAL
La configuración se guarda solo en localStorage (local al navegador), pero NO se sincroniza a Firebase. Esto significa que cuando inicies sesión en otro equipo, NO verás tu configuración.

## ✅ SOLUCIÓN: Actualizar Reglas de Firestore

### Paso 1: Ir a la Consola de Firebase
1. Abre: https://console.firebase.google.com/
2. Selecciona tu proyecto: **licencias-taller**
3. En el menú izquierdo, haz clic en **Firestore Database**
4. Haz clic en la pestaña **Reglas** (Rules)

### Paso 2: Reemplazar las Reglas Actuales

Copia y pega EXACTAMENTE este código en el editor de reglas:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Colección de licencias - acceso completo para usuarios autenticados
    match /licencias/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Colección de usuarios - acceso completo para usuarios autenticados
    match /usuarios/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Colección de usuarios Google - acceso completo para usuarios autenticados
    match /usuarios-google/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Colección de datos de usuarios - acceso completo para usuarios autenticados
    match /usuarios-data/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // 🆕 Colección de configuraciones - IMPORTANTE PARA SINCRONIZACIÓN
    match /configuraciones/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Paso 3: Publicar las Reglas
1. Haz clic en el botón **Publicar** (Publish)
2. Espera el mensaje de confirmación "Reglas publicadas correctamente"

### Paso 4: Probar la Sincronización

#### En el primer equipo (donde tienes la configuración):
1. Abre la consola del navegador (F12)
2. Ve a Configuración y guarda tus datos
3. Deberías ver en la consola:
   ```
   💾 Iniciando guardado de configuración...
   👤 Usuario actual: MOtjB9zHzMT4AnRUyneIOcg0NKA3
   📤 Intentando guardar en Firebase colección: configuraciones...
   ✅ Configuración guardada exitosamente en Firebase
   ```
4. Si ves "❌ Error al guardar en Firebase: permission-denied" → Las reglas NO están correctas aún

#### En otro equipo:
1. Inicia sesión con tu cuenta de Google
2. Ve a Configuración
3. Deberías ver tus datos cargarse automáticamente
4. En la consola deberías ver:
   ```
   📥 Iniciando carga de configuración...
   📤 Intentando leer de Firebase colección: configuraciones...
   ✅ Config encontrada en Firebase
   ```

## 🔍 Verificar en Firebase Console

Después de guardar, puedes verificar que los datos se guardaron:

1. En la consola de Firebase
2. Ve a **Firestore Database** → pestaña **Datos** (Data)
3. Busca la colección **configuraciones**
4. Deberías ver un documento con tu userId
5. Dentro verás: `nombreTaller`, `direccionTaller`, `logoUrl`, etc.

## ❓ Solución de Problemas

### Si sigue sin funcionar:

1. **Verifica que las reglas se publicaron correctamente**
   - Ve a Firestore Database → Rules
   - Verifica que diga `match /configuraciones/{userId}`

2. **Borra la caché del navegador**
   - Presiona Ctrl+Shift+Delete (o Cmd+Shift+Delete en Mac)
   - Selecciona "Todo el tiempo"
   - Marca "Caché e imágenes"
   - Haz clic en "Borrar datos"

3. **Refresca la página**
   - Presiona Ctrl+F5 (o Cmd+Shift+R en Mac)

4. **Verifica tu usuario**
   - Abre la consola (F12)
   - Escribe: `auth.currentUser`
   - Deberías ver tu información de usuario
   - Si es `null`, cierra sesión y vuelve a iniciar

## 📱 Confirmación Final

Una vez que funcione correctamente, verás este mensaje al guardar:
> ✅ Configuración guardada y sincronizada en la nube

En lugar de:
> ✅ Configuración guardada localmente (Firebase no disponible)

**¡Ya debería funcionar en todos tus dispositivos!** 🎉
