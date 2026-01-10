# Corregir Licencia Vitalicia

Tu licencia está guardada incorrectamente en localStorage. Sigue estos pasos:

## Opción 1: Usar la herramienta de diagnóstico (RECOMENDADO)

1. Abre en tu navegador: https://tu-taller.netlify.app/diagnostico-licencia.html
2. Haz clic en **"✅ Corregir Licencia Vitalicia"**
3. Confirma la corrección
4. Vuelve a https://tu-taller.netlify.app
5. Recarga la página (Cmd+R o F5)

## Opción 2: Desde la consola del navegador

1. Abre la consola del navegador (F12 o Cmd+Option+I)
2. Ve a la pestaña "Console"
3. Copia y pega este código:

```javascript
// Obtener licencia actual
const licencia = JSON.parse(localStorage.getItem('licenciaActiva'));
console.log('Licencia antes:', licencia);

// Corregir tipo y expiración
licencia.licenseType = 'vitalicia';
licencia.fechaExpiracion = null;

// Guardar licencia corregida
localStorage.setItem('licenciaActiva', JSON.stringify(licencia));
console.log('Licencia después:', licencia);

// Recargar página
location.reload();
```

4. Presiona Enter
5. La página se recargará automáticamente

## Verificar que funcionó

Después de aplicar cualquiera de las opciones, deberías ver en la esquina inferior derecha:

**♾️ Licencia Vitalicia - Sin expiración**

en lugar de "Licencia: prueba (3 días restantes)"
