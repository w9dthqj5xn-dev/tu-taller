# 🔧 Funcionalidad: Agregar Artículos a Órdenes Existentes

## Descripción General

Esta funcionalidad permite agregar más artículos/repuestos a una orden **después de haberla creado** y **antes de ser entregada**. Es muy útil cuando durante la reparación se descubre que se necesitan más piezas o servicios adicionales.

---

## ✅ Características Implementadas

### 1. **Botón de Agregar Artículos**
- Aparece en cada tarjeta de orden (excepto órdenes Entregadas o Canceladas)
- Botón con ícono: **"🔧 + Artículos"** (color naranja)
- Ubicado junto a los botones de Editar, Cambiar Estado, etc.

### 2. **Modal Interactivo**
- **Información de la orden**: Muestra número de orden, cliente, dispositivo y estado actual
- **Lista de artículos actuales**: Visualiza todos los repuestos ya agregados a la orden
- **Selector de inventario**: Desplegable organizado por categorías
- **Control de cantidades**: Input numérico para especificar cantidad de cada artículo
- **Validación de stock**: Verifica disponibilidad en tiempo real

### 3. **Gestión de Artículos**
- ✅ **Agregar**: Selecciona repuestos del inventario y agrégalos a la orden
- ✅ **Eliminar**: Quita artículos antes de guardar
- ✅ **Editar cantidades**: Suma cantidades si agregas el mismo artículo varias veces
- ✅ **Vista previa**: Muestra tabla completa con subtotales y total

### 4. **Actualización Automática de Inventario**
- Cuando guardas los cambios:
  - Los artículos **anteriores** se restauran al inventario
  - Los artículos **nuevos** se descuentan del inventario
- Validación de stock disponible antes de guardar
- Sincronización automática con Firebase

---

## 🎯 Cómo Usar

### Paso a Paso:

1. **Navega a la sección "Órdenes"**
   - Ve al menú lateral y haz clic en "Órdenes"

2. **Localiza la orden**
   - Busca la orden a la que quieres agregar artículos
   - La orden debe estar en estado diferente a "Entregado" o "Cancelado"

3. **Haz clic en "🔧 + Artículos"**
   - Se abrirá un modal con toda la información de la orden

4. **Agrega artículos desde el inventario**
   - Selecciona un repuesto del desplegable
   - Especifica la cantidad deseada
   - Haz clic en "+ Agregar"
   - Repite para cada artículo adicional

5. **Revisa los artículos**
   - Verifica la lista de artículos agregados
   - Elimina artículos si te equivocaste (botón 🗑️)
   - Revisa el total

6. **Guarda los cambios**
   - Haz clic en "💾 Guardar Cambios"
   - Confirma la acción
   - El inventario se actualizará automáticamente

---

## 📋 Casos de Uso

### **Escenario 1: Reparación requiere piezas adicionales**
```
Situación: Un cliente trae un celular para cambio de pantalla,
pero durante la reparación descubres que también necesita batería.

Solución:
1. Abres la orden existente
2. Haces clic en "🔧 + Artículos"
3. Agregas la batería desde el inventario
4. Guardas los cambios
5. El costo se actualiza automáticamente
```

### **Escenario 2: Cliente aprueba servicios adicionales**
```
Situación: Cliente inicialmente solo quería limpieza,
luego aprueba cambio de micrófono durante la reparación.

Solución:
1. Abres la orden
2. Agregas el micrófono con "🔧 + Artículos"
3. El presupuesto se actualiza con el nuevo costo
4. Puedes imprimir recibo actualizado
```

### **Escenario 3: Corrección de artículos**
```
Situación: Agregaste un repuesto equivocado al crear la orden.

Solución:
1. Abres "🔧 + Artículos"
2. Eliminas el artículo incorrecto (🗑️)
3. Agregas el artículo correcto
4. Guardas y el inventario se ajusta correctamente
```

---

## 🔒 Restricciones y Validaciones

### **Estados permitidos para agregar artículos:**
- ✅ Recibido
- ✅ En Diagnóstico
- ✅ Esperando Repuestos
- ✅ En Reparación
- ✅ Listo para Entrega

### **Estados NO permitidos:**
- ❌ **Entregado**: La orden ya fue completada y entregada
- ❌ **Cancelado**: La orden fue cancelada

### **Validaciones de inventario:**
- No puedes agregar más unidades de las disponibles en stock
- El sistema verifica stock en tiempo real
- Alerta si intentas exceder el stock disponible
- Los artículos sin stock aparecen deshabilitados en el selector

---

## 💾 Sincronización

### **Datos que se sincronizan:**
1. **Orden actualizada**: Con la nueva lista de repuestos
2. **Inventario ajustado**: Stock actualizado de cada artículo
3. **Firebase**: Todos los cambios se guardan en la nube

### **Flujo de sincronización:**
```
1. Usuario agrega artículos → Temporal en memoria
2. Usuario hace clic en "Guardar" → Confirmación
3. Sistema restaura artículos anteriores → Actualiza inventario
4. Sistema descuenta artículos nuevos → Actualiza inventario
5. Sistema guarda orden actualizada → Firebase
6. Sistema guarda inventario actualizado → Firebase
7. Recarga vista de órdenes → Muestra cambios
```

---

## 🎨 Interfaz de Usuario

### **Modal de Agregar Artículos**
```
┌─────────────────────────────────────────────┐
│ 🔧 Agregar Artículos a la Orden          ✕  │
├─────────────────────────────────────────────┤
│ Orden: #20250001 | Cliente: Juan Pérez      │
│ Dispositivo: Apple iPhone 12 | Estado: En Rep│
├─────────────────────────────────────────────┤
│ 💡 Los artículos se descontarán del inventar│
├─────────────────────────────────────────────┤
│ 🔧 Artículos en esta orden:                  │
│ ┌───────────────────────────────────────┐   │
│ │ Pantalla iPhone 12   2  $150  $300    │   │
│ │ Batería iPhone 12    1  $80   $80     │   │
│ │                      TOTAL: $380.00   │   │
│ └───────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│ ➕ Agregar Nuevo Artículo                    │
│ [Seleccionar repuesto ▼] [Cant: 1] [+Agregar]│
├─────────────────────────────────────────────┤
│                    [Cancelar] [💾 Guardar]  │
└─────────────────────────────────────────────┘
```

---

## 🔧 Archivos Modificados

### 1. **index.html**
- ✅ Agregado modal completo para agregar artículos
- Estructura HTML con formulario interactivo
- Estilos inline para componentes específicos

### 2. **app.js**
- ✅ `abrirModalArticulos(ordenId)`: Abre el modal y carga datos
- ✅ `cargarInventarioSelectModal()`: Carga inventario en el selector
- ✅ `agregarArticuloModal()`: Agrega artículo al temporal
- ✅ `eliminarArticuloModal(index)`: Elimina artículo del temporal
- ✅ `actualizarArticulosActualesOrden()`: Actualiza vista de artículos
- ✅ `guardarArticulosOrden()`: Guarda cambios y actualiza inventario
- ✅ `cerrarModalArticulos()`: Cierra el modal
- ✅ Modificada función `filtrarOrdenes()`: Agregado botón "🔧 + Artículos"

### 3. **styles.css**
- ✅ Estilos para modal (`.modal`, `.modal-content`)
- ✅ Animaciones (`fadeIn`, `slideDown`)
- ✅ Responsive design para móviles

---

## 📱 Compatibilidad

### **Navegadores soportados:**
- ✅ Chrome (todas las versiones recientes)
- ✅ Firefox (todas las versiones recientes)
- ✅ Safari (macOS e iOS)
- ✅ Edge (Chromium)

### **Dispositivos:**
- ✅ Escritorio (Windows, Mac, Linux)
- ✅ Tablets (iPad, Android)
- ✅ Móviles (iPhone, Android)

### **Características responsive:**
- Modal se adapta a pantallas pequeñas (95% ancho en móviles)
- Tabla de artículos scrolleable horizontalmente
- Botones apilados en pantallas pequeñas

---

## ⚠️ Consideraciones Importantes

### **Para el administrador:**
1. Los artículos agregados se descuentan **automáticamente** del inventario
2. Si necesitas cancelar, simplemente cierra el modal sin guardar
3. Una vez guardado, no puedes deshacer (debes volver a abrir y corregir)
4. El presupuesto NO se actualiza automáticamente (debes editarlo manualmente)

### **Para el técnico:**
1. Siempre verifica el stock antes de agregar artículos
2. Confirma con el cliente antes de agregar servicios adicionales
3. Actualiza el presupuesto de la orden después de agregar artículos
4. Imprime un nuevo recibo si es necesario

---

## 🚀 Mejoras Futuras Posibles

1. **Actualización automática de presupuesto**: Sumar costo de artículos al presupuesto
2. **Historial de cambios**: Registrar quién y cuándo agregó cada artículo
3. **Notificaciones al cliente**: Enviar notificación cuando se agregan servicios
4. **Aprobación de cliente**: Solicitar aprobación antes de agregar artículos costosos
5. **Notas por artículo**: Agregar notas específicas para cada artículo agregado

---

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias, contacta al desarrollador.

---

**Versión**: 1.0  
**Fecha**: 16 de enero de 2026  
**Estado**: ✅ Completado y funcional
