# 📊 Funcionalidad: Imprimir y Descargar Reportes PDF

## ✅ Estado: Implementado

Ahora puedes **imprimir o descargar** los reportes de "Cuentas por Cobrar" en formato PDF.

---

## 🎯 Características

### 1. Modal de Opciones
Cuando generas un reporte, aparece un modal elegante con **2 opciones principales**:

- 🖨️ **Imprimir** - Abre el reporte en una ventana nueva lista para imprimir
- 📥 **Descargar** - Permite guardar el PDF en tu computadora

### 2. Interfaz Intuitiva
```
┌─────────────────────────────────┐
│  📊 Reporte Listo               │
│                                 │
│  Reporte de Cuentas por Cobrar  │
│  Tienda XYZ                     │
│                                 │
│  [🖨️ Imprimir] [📥 Descargar]  │
│                                 │
│     [✕ Cerrar]                 │
└─────────────────────────────────┘
```

### 3. Nombres Automáticos
Los archivos descargados se nombran automáticamente:
```
Reporte-Cuentas-{NOMBRE-TIENDA}-{FECHA}.pdf

Ejemplo:
Reporte-Cuentas-Tu Taller-29-01-2026.pdf
```

---

## 🔧 Funciones Implementadas

### Nueva: `mostrarModalAccionesReporte(html, nombreTienda)`
Muestra el modal con opciones de imprimir y descargar.

**Parámetros:**
- `html` (string) - Contenido HTML del reporte
- `nombreTienda` (string) - Nombre de la tienda para mostrar

**Ejemplo:**
```javascript
mostrarModalAccionesReporte(htmlReporte, 'Tu Taller');
```

---

### Nueva: `imprimirReporte(nombreTienda)`
Abre el reporte en una ventana nueva e inicia el diálogo de impresión.

**Características:**
- Abre ventana nueva con formato profesional
- Auto-abre el diálogo de impresión
- Permite seleccionar impresora
- Opción "Guardar como PDF" disponible

---

### Nueva: `descargarReportePDF(nombreTienda)`
Permite descargar el reporte como archivo PDF.

**Características:**
- Abre diálogo estándar de descarga del navegador
- Archivo se descarga con nombre automático
- Funciona en Chrome, Firefox, Safari, Edge
- Notificación al usuario después de descargar

---

### Nueva: `cerrarModalAccionesReporte()`
Cierra el modal de opciones.

**Función interna** utilizada por los botones del modal.

---

## 🔄 Flujo de Uso

```
Usuario hace clic en "📊 Reporte"
    ↓
Se sincronizan datos desde Firebase
    ↓
Se genera HTML del reporte
    ↓
✨ Modal aparece con opciones
    ├─→ Usuario elige "Imprimir"
    │   ├─ Se cierra el modal
    │   └─ Abre ventana nueva con reporte
    │       └─ Inicia diálogo de impresión
    │
    └─→ Usuario elige "Descargar"
        ├─ Se cierra el modal
        └─ Abre diálogo de descarga
            └─ Guardar como "Reporte-Cuentas-..."
```

---

## 📱 Desde Dónde Puedes Generar Reportes

### 1. **Desde la Vista de Tiendas** 
   - Ir a "🏪 Tiendas"
   - Hacer clic en una tienda
   - Botón "📊 Reporte" en el modal

### 2. **Desde la Vista de Órdenes**
   - Hacer clic en "Órdenes" en la tienda
   - Botón "📊 Imprimir Reporte" arriba

---

## 🖨️ Opción: Imprimir

### Diálogo de Impresión del Navegador
Cuando haces clic en **"🖨️ Imprimir"**:

1. Se abre una ventana nueva
2. Se muestra el reporte con formato profesional
3. Se abre automáticamente el diálogo de impresión
4. Puedes:
   - Seleccionar impresora
   - Elegir número de copias
   - Ajustar márgenes
   - **Guardar como PDF** (File → Print → Destination → Save as PDF)

### Configuración de Impresión Recomendada
- **Orientación:** Vertical (Portrait)
- **Márgenes:** Normal
- **Escala:** 100%
- **Color:** A color (si es posible)

---

## 📥 Opción: Descargar

### Diálogo de Descarga del Navegador
Cuando haces clic en **"📥 Descargar"**:

1. Se abre el diálogo estándar de descarga
2. Nombre automático: `Reporte-Cuentas-{Tienda}-{Fecha}.pdf`
3. Archivo se guarda en tu carpeta de "Descargas"
4. Notificación confirma la descarga

### Dónde Se Guarda
- **Windows:** C:\Users\{Usuario}\Downloads\
- **Mac:** ~/Downloads/
- **Linux:** ~/Downloads/

---

## 📊 Contenido del Reporte

### Secciones Incluidas
1. **Header** - Logo, título, información de la tienda
2. **Estadísticas** - Cantidad y total de órdenes pendientes
3. **Tabla Detallada** - Lista de todas las órdenes pendientes
4. **Totales** - Suma de presupuestos, anticipos y pendientes
5. **Footer** - Fecha de generación, copyright

### Datos Mostrados
- ✅ Número de orden
- ✅ Cliente
- ✅ Equipo (marca y modelo)
- ✅ Fecha de ingreso
- ✅ Estado (Listo para Entrega / Entregado)
- ✅ Presupuesto
- ✅ Anticipo pagado
- ✅ **Pendiente de cobro** (en rojo/amarillo)

### Solo Muestra
- Órdenes en estado "Listo para Entrega" O "Entregado"
- Con balance pendiente (Presupuesto > Anticipo + Cobrado)
- De la tienda seleccionada

---

## 🌐 Multi-Dispositivo

Los reportes incluyen **sincronización explícita desde Firebase**:

- ✅ Datos actuales desde la nube
- ✅ Consistencia garantizada entre dispositivos
- ✅ Si hay Internet: datos frescos de Firebase
- ✅ Si no hay Internet: datos del caché local

---

## 🎨 Diseño del Modal

### Estilos
- **Fondo:** Overlay oscuro semi-transparente
- **Caja:** Blanca con borde redondeado
- **Botón Imprimir:** Gradiente púrpura (667eea → 764ba2)
- **Botón Descargar:** Gradiente rosa/rojo (f093fb → f5576c)
- **Botón Cerrar:** Gris claro (e0e0e0)

### Responsive
- ✅ Se adapta a pantallas pequeñas
- ✅ Toque compatible en móviles
- ✅ Se centra en la pantalla

---

## 🐛 Solución de Problemas

### "El PDF no se descarga"
**Solución:** 
- Verifica que tu navegador permita descargas
- Desactiva bloqueador de pop-ups
- Intenta con Chrome o Firefox

### "La ventana de impresión no aparece"
**Solución:**
- Verifica que no esté bloqueado las pop-ups
- Cierra el modal y vuelve a intentar
- Recarga la página (F5)

### "El reporte muestra datos antiguos"
**Solución:**
- El sistema sincroniza desde Firebase automáticamente
- Si persiste, cierra sesión y vuelve a iniciar

### "El botón no funciona en móvil"
**Solución:**
- Los reportes se optimizan para pantalla
- Para descargar: abre en navegador de escritorio
- Para imprimir: usa la opción nativa del móvil

---

## 📝 Modificaciones al Código

### Archivo: app.js

#### Función Modificada
- `generarReporteCuentasPorCobrar()` - Ahora muestra modal en lugar de abrir ventana directa

#### Nuevas Funciones
1. `mostrarModalAccionesReporte(html, nombreTienda)` - Crea y muestra el modal
2. `imprimirReporte(nombreTienda)` - Abre reporte para imprimir
3. `descargarReportePDF(nombreTienda)` - Descarga como PDF
4. `cerrarModalAccionesReporte()` - Cierra el modal

#### Funciones Expuestas Globalmente
```javascript
window.mostrarModalAccionesReporte = mostrarModalAccionesReporte;
window.cerrarModalAccionesReporte = cerrarModalAccionesReporte;
window.imprimirReporte = imprimirReporte;
window.descargarReportePDF = descargarReportePDF;
```

---

## ✨ Mejoras Futuras Posibles

- [ ] Enviar reporte por email directamente
- [ ] Programar generación automática de reportes
- [ ] Exportar múltiples tiendas en un PDF
- [ ] Agregar gráficos (pie chart, bar chart)
- [ ] Filtro de fechas personalizado
- [ ] Firma digital del gerente

---

## 📞 Resumen

| Aspecto | Detalles |
|---------|----------|
| **Opciones** | Imprimir y Descargar |
| **Formato** | HTML profesional + PDF |
| **Nombres automáticos** | Sí (con fecha) |
| **Datos sincronizados** | Sí (Firebase en tiempo real) |
| **Multi-dispositivo** | Sí |
| **Offline** | Sí (caché local) |
| **Responsive** | Sí |
| **Navegadores soportados** | Chrome, Firefox, Safari, Edge |

---

*Funcionalidad implementada: 29 de enero de 2026*  
*Versión: 1.0*  
*Estado: ✅ Listo para producción*
