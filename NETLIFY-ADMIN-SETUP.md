# 🔐 CONFIGURAR VARIABLES DE ENTORNO EN NETLIFY

## Paso 1: Acceder a Netlify Dashboard
1. Ve a: https://app.netlify.com
2. Inicia sesión
3. Selecciona tu sitio: **tu-taller**

## Paso 2: Ir a Configuración de Entorno
1. En el menú del sitio, haz clic en **"Site configuration"** (⚙️)
2. En el menú lateral, busca **"Environment variables"**
3. Haz clic en **"Environment variables"**

## Paso 3: Agregar Variables Secretas
Haz clic en **"Add a variable"** y agrega estas DOS variables:

### Variable 1:
- **Key:** `ADMIN_USER`
- **Value:** `admin_licencias_2026`
- **Scopes:** ✅ Same value for all deploy contexts

### Variable 2:
- **Key:** `ADMIN_PASSWORD`
- **Value:** (Crea una contraseña nueva y segura, por ejemplo: `TuTaller$ecur3#2026!`)
- **Scopes:** ✅ Same value for all deploy contexts

**⚠️ IMPORTANTE:** NO uses la contraseña actual `SecurePass2025!` - ya está comprometida en el código público.

## Paso 4: Guardar
Haz clic en **"Save"** para cada variable.

---

## 🔄 SIGUIENTE: Actualizar el Código

Después de configurar estas variables en Netlify, necesitarás:
1. Actualizar el script `build.sh` para usar las nuevas variables
2. Hacer un nuevo deploy

**¿Estás listo para que actualice el código automáticamente?**
Responde "si" cuando hayas agregado las variables en Netlify.
