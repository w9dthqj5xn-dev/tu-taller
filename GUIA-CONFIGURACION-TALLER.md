# 🔧 Guía de Configuración del Taller

## ✨ Nueva Funcionalidad: Configuración Personalizada

Ahora cada usuario puede personalizar completamente sus facturas y recibos con su logo, información de contacto y políticas propias.

## 📍 Cómo Acceder

1. **Desde el botón del header**: Haz clic en el botón "⚙️ Configuración" en la parte superior derecha
2. **Desde la navegación**: Selecciona la pestaña "⚙️ Configuración" en el menú de navegación

## 🎨 Funcionalidades Disponibles

### 📷 Logo del Taller
- **Formatos soportados**: JPG, PNG, GIF
- **Tamaño máximo**: 2MB
- **Dimensiones recomendadas**: 400px de ancho (se redimensiona automáticamente)
- **Vista previa**: Se muestra inmediatamente al seleccionar el archivo
- El logo aparecerá en:
  - ✅ Facturas PDF
  - ✅ Recibos de ingreso
  - ✅ Recibos de pago

### 🏪 Información del Taller
Puedes configurar:
- **Nombre del Taller**: Aparece como título principal en las facturas
- **Dirección**: Se muestra debajo del nombre
- **Teléfono de Contacto**: Para que tus clientes puedan comunicarse
- **Email de Contacto**: Correo electrónico de tu negocio

### 📋 Políticas del Taller
- **Texto personalizable**: Define tus propias políticas
- **Ejemplo por defecto**: "Luego de su equipo ser arreglado tiene un plazo de 15 días para retirarlo..."
- **Ubicación**: Aparece en un recuadro destacado en todas las facturas y recibos

## 💾 Almacenamiento y Sincronización

### 🔄 Sincronización Automática
- ✅ **Firebase**: Toda tu configuración se guarda en la nube
- ✅ **Multi-dispositivo**: Inicia sesión desde cualquier dispositivo y verás tu configuración
- ✅ **Backup local**: También se guarda en localStorage como respaldo
- ✅ **Por usuario**: Cada usuario tiene su propia configuración

### 📱 Disponible En
- Computadoras de escritorio
- Tablets
- Navegadores móviles

## 🎯 Cómo Usar

### Configuración Inicial

1. **Accede a Configuración**
   - Haz clic en "⚙️ Configuración" en el header o navegación

2. **Sube tu Logo** (Opcional)
   - Haz clic en el campo de archivo
   - Selecciona una imagen (JPG, PNG, GIF)
   - Verás la vista previa inmediatamente

3. **Completa la Información**
   - Nombre del Taller
   - Dirección completa
   - Teléfono de contacto
   - Email de contacto

4. **Define tus Políticas**
   - Escribe las políticas y términos de tu taller
   - Este texto aparecerá en todas las facturas

5. **Guarda los Cambios**
   - Haz clic en "💾 Guardar Configuración"
   - Verás un mensaje de confirmación

### Actualizar Configuración

- En cualquier momento puedes:
  - Cambiar el logo (sube uno nuevo)
  - Modificar la información de contacto
  - Actualizar las políticas
  - Hacer clic en "🔄 Recargar" para restaurar valores guardados

## 📄 Dónde Aparece la Configuración

### 1. Facturas PDF (generarPDFFacturaBlob)
- Logo en la parte superior izquierda
- Nombre del taller como título principal
- Dirección, teléfono y email debajo del nombre
- Políticas en recuadro amarillo antes de la firma

### 2. Recibos de Ingreso (imprimirRecibo)
- Logo centrado en la parte superior
- Nombre del taller
- Información de contacto
- Políticas personalizadas

### 3. Recibos de Pago (imprimirReciboPago)
- Logo centrado en la parte superior
- Nombre del taller
- Información de contacto completa

## 🔒 Configuración de Firebase

### Requisitos Técnicos

Para que funcione correctamente en producción, asegúrate de que:

1. **Firebase Storage está habilitado**
   - Ir a Firebase Console
   - Seleccionar tu proyecto
   - Activar Storage

2. **Reglas de Firestore**
   ```javascript
   match /configuraciones/{userId} {
     allow read, write: if request.auth != null && request.auth.uid == userId;
   }
   ```

3. **El SDK de Storage está cargado**
   - ✅ Ya incluido en index.html:
   ```html
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js"></script>
   ```

## 📝 Ejemplo de Configuración Completa

```javascript
{
  nombreTaller: "Electrónica XYZ",
  direccionTaller: "Calle 123 #45-67, Local 3, Ciudad",
  telefonoTaller: "+57 300 123 4567",
  emailTaller: "contacto@electronicaxyz.com",
  politicasTaller: "1. Garantía de 30 días en reparaciones.\n2. Los equipos deben retirarse en 15 días.\n3. No nos hacemos responsables por datos eliminados.",
  logoUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg...", // Base64 del logo
  fechaActualizacion: "2025-01-16T10:30:00.000Z"
}
```

## 🎨 Diseño Responsivo

El logo se ajusta automáticamente:
- **En PDFs**: Máximo 30mm de ancho
- **En recibos HTML**: Máximo 80px, mantiene proporción
- **Vista previa**: 120x120px con object-fit: contain

## ⚡ Optimizaciones

1. **Compresión de imágenes**: Las imágenes se redimensionan y comprimen automáticamente
2. **Caché local**: La configuración se guarda en memoria para acceso rápido
3. **Fallback**: Si Firebase falla, se usa localStorage
4. **Base64**: Las imágenes se convierten a base64 para fácil almacenamiento

## 🐛 Solución de Problemas

### El logo no aparece
- Verifica que el archivo sea menor a 2MB
- Asegúrate de guardar después de seleccionar el archivo
- Revisa que Firebase Storage esté habilitado

### La configuración no se sincroniza
- Verifica tu conexión a internet
- Comprueba que estés autenticado
- Revisa las reglas de Firestore

### El logo se ve distorsionado
- Usa imágenes con buena resolución (mínimo 300x300px)
- Formatos recomendados: PNG con fondo transparente

## 📞 Soporte

Si necesitas ayuda:
- Contacta al desarrollador: Ing. Carlos Jiménez
- Revisa los logs de la consola del navegador (F12)
- Verifica que Firebase esté correctamente configurado

---

**Versión**: 1.0  
**Fecha**: Enero 2026  
**Desarrollado por**: Ing. Carlos Jiménez
