# Migración segura de autenticación y Firestore

La aplicación deja de validar contraseñas desde el navegador. Netlify Functions valida las cuentas heredadas con Firebase Admin, las convierte en cuentas de Firebase Authentication y elimina la contraseña guardada en el documento de Firestore.

## Configuración requerida antes de publicar

1. En Netlify, crea `FIREBASE_SERVICE_ACCOUNT` como variable privada de entorno con el JSON de una cuenta de servicio del proyecto Firebase. No la agregues a archivos del repositorio ni la compartas en el chat.
2. Da a esa cuenta únicamente los permisos necesarios para administrar Authentication y Firestore en el proyecto.
3. Confirma que `FIREBASE_PROJECT_ID` apunta al proyecto correcto y elimina las variables antiguas `LICENSE_ADMIN_USER` y `LICENSE_ADMIN_PASSWORD`; ya no se usan.
4. Publica las reglas de `firestore.rules` en Firebase desde la raíz del proyecto (`firebase deploy --only firestore:rules`). Revisa las reglas en la consola antes de publicarlas; no uses las reglas permisivas anteriores.
5. Configura el usuario de administración mediante una cuenta de servicio local y el comando documentado abajo. No guardes el JSON de servicio en el repositorio.
6. Solo después de completar estos pasos, publica la aplicación y las funciones de Netlify. No publiques una compilación si falta `FIREBASE_SERVICE_ACCOUNT`.

## Cuentas existentes

En el primer inicio de sesión después de habilitar las funciones, el usuario proporciona sus credenciales actuales. `migrate-account` verifica la contraseña en el servidor, crea su cuenta de Firebase Authentication y elimina el campo de contraseña heredado. Los intentos fallidos se limitan por usuario e IP. No se debe abrir el acceso público a Firestore para completar la migración.

## Conceder acceso de administrador

El enlace «Administrador de Licencias» abre `licencias.html` y requiere una cuenta de Firebase Authentication con el claim `admin`. Para conceder permisos a una cuenta de taller ya migrada, ejecuta localmente:

```sh
FIREBASE_SERVICE_ACCOUNT='(JSON privado de la cuenta de servicio)' node admin-tools/set-admin.mjs <usuario>
```

La antigua cuenta `admin_licencias` era una credencial fija del panel anterior, no una cuenta de Firebase. Para crear una cuenta administrativa independiente, descarga una clave de servicio nueva y ejecuta el script desde una terminal interactiva; la contraseña se solicita sin mostrarla:

```sh
node admin-tools/create-license-admin.mjs admin_licencias /ruta/privada/service-account.json
```

No reutilices claves de servicio que hayan sido compartidas o expuestas. La cuenta creada inicia sesión en `/licencias.html`, donde puede generar, listar, suspender y reactivar licencias. No almacenes el JSON de cuenta de servicio en el repositorio ni en `env.js`.

## Importante

- `env.js` solo contiene configuración pública de Firebase. El script de build no imprime su contenido.
- Firestore es la única fuente persistente para los datos del taller. La aplicación usa solo una caché en memoria durante la sesión; no guarda clientes, órdenes, inventario ni configuración en `localStorage`. La exportación manual de respaldos, si se usa, descarga un archivo únicamente por acción del usuario.
- Los documentos existentes de usuario se migran al primer inicio de sesión; una cuenta que no se haya migrado no puede acceder a Firestore con las reglas nuevas hasta que la función del servidor valide sus credenciales.
- Las reglas restringen los datos de `usuarios-data` y `configuraciones` al UID autenticado que posee el taller. Los cambios de licencias quedan reservados a cuentas con el claim `admin`.
- Si una contraseña heredada estuvo publicada o incluida en registros, cámbiala y rota cualquier credencial asociada antes de producción.
