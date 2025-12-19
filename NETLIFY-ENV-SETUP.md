# CONFIGURACIÓN DE VARIABLES DE ENTORNO EN NETLIFY

## Problema
Netlify detectó la API key de Firebase como un secreto expuesto y bloqueó el deployment.

## Solución
Mover las credenciales de Firebase a variables de entorno.

## Pasos para configurar en Netlify:

### 1. Ve a tu sitio en Netlify Dashboard
- Abre https://app.netlify.com
- Selecciona tu sitio "Tu Taller"

### 2. Ve a Site settings
- Clic en "Site settings"
- Luego "Environment variables" en el menú lateral

### 3. Agrega estas variables de entorno:

```
FIREBASE_API_KEY = ***REMOVED***
FIREBASE_AUTH_DOMAIN = licencias-taller.firebaseapp.com
FIREBASE_PROJECT_ID = licencias-taller
FIREBASE_STORAGE_BUCKET = licencias-taller.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID = 269860282658
FIREBASE_APP_ID = 1:269860282658:web:bc419fe695e7da84fb057b
FIREBASE_MEASUREMENT_ID = G-P8WGN2YR21
```

### 4. Para cada variable:
- Clic en "Add variable"
- Key: Nombre de la variable (ej: FIREBASE_API_KEY)
- Value: El valor correspondiente
- Clic en "Create variable"

### 5. Crear script de build
Netlify inyectará las variables automáticamente durante el build.

### 6. Re-deploy
Una vez agregadas todas las variables, haz un nuevo deploy:
- Ve a "Deploys"
- Clic en "Trigger deploy" → "Deploy site"

## Verificación
- El build debería completarse sin errores de "exposed secrets"
- Firebase debería funcionar normalmente
- Las credenciales estarán seguras en variables de entorno

## Notas Importantes:
- Las Firebase API Keys para web frontend son técnicamente públicas
- Netlify es extra cauteloso detectándolas como secretos
- Esta configuración mejora la seguridad y cumple con las mejores prácticas
- Los valores por defecto en el código funcionarán si no hay variables configuradas

## Si tienes problemas:
1. Verifica que todas las variables estén bien escritas
2. Revisa que no haya espacios extra en los valores
3. Re-deploy después de agregar variables
4. Checa la consola del navegador para errores de Firebase