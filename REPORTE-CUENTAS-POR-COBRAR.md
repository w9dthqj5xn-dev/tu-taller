# 📊 Reportes de Cuentas por Cobrar por Tienda

## 🎯 Descripción General

Se agregó una nueva funcionalidad que permite generar e imprimir **reportes de cuentas por cobrar** para cada tienda. Esto facilita el seguimiento de pagos pendientes y permite enviar un resumen detallado a cada tienda sobre sus órdenes sin cobrar.

## ✨ Características

### ✅ Funcionalidades principales:

1. **Botón de Reporte en Modal de Tienda**
   - Al hacer clic en una tienda, se abre un modal con opciones
   - Ahora hay un botón **"📊 Reporte"** naranja
   - Genera automáticamente el PDF

2. **Botón de Reporte en Vista de Órdenes**
   - Al ver las órdenes de una tienda, hay un botón **"📊 Imprimir Reporte de Cuentas"**
   - Genera el reporte con todas las órdenes pendientes

3. **Contenido del Reporte:**
   - 📦 Total de órdenes pendientes de pago
   - 💰 Monto total a cobrar (suma de todos los pendientes)
   - ✅ Total en presupuesto de las órdenes
   - 📋 Tabla detallada con:
     - Número de orden
     - Nombre del cliente
     - Equipo (marca y modelo)
     - Fecha de ingreso
     - Estado (Listo para Entrega / Entregado)
     - Presupuesto
     - Anticipo pagado
     - Pendiente por cobrar
   - 🏪 Información de la tienda:
     - Nombre
     - Contacto
     - Teléfono
     - Dirección
     - Email

## 📖 Cómo Usar

### Opción 1: Desde el listado de Tiendas

1. Ve a la sección **"🏪 Tiendas"**
2. Haz clic en la tarjeta de cualquier tienda
3. Se abrirá un modal con varios botones
4. Haz clic en **"📊 Reporte"**
5. Se abrirá una nueva ventana con el reporte y se iniciará automáticamente la impresión

### Opción 2: Desde la vista de Órdenes de la Tienda

1. Ve a la sección **"🏪 Tiendas"**
2. Haz clic en una tienda
3. Se abre la vista con todas las órdenes de esa tienda
4. En la parte inferior, haz clic en **"📊 Imprimir Reporte de Cuentas"**
5. Se abrirá el reporte en una nueva ventana

## 🔍 Qué incluye el Reporte

### Órdenes que aparecen en el reporte:
- ✅ Órdenes en estado **"Listo para Entrega"** sin cobrar
- ✅ Órdenes en estado **"Entregado"** sin cobrar completamente
- ✅ Cualquier orden con saldo pendiente

### Órdenes que NO aparecen:
- ❌ Órdenes completamente pagadas
- ❌ Órdenes canceladas
- ❌ Órdenes en otros estados (Recibido, En Diagnóstico, etc.)

## 📐 Datos que se calculan automáticamente

### Totales mostrados:

1. **Total Órdenes Pendientes**: Cantidad de órdenes sin pagar completamente
2. **Monto Total a Cobrar**: Suma de todos los saldos pendientes
3. **Total en Presupuesto**: Suma de todos los presupuestos de esas órdenes

### Para cada orden se calcula:

```
Pendiente = Presupuesto - Anticipo Pagado
```

## 🖨️ Cómo Imprimir

### Desde el navegador:

1. El reporte se abre automáticamente en modo vista previa de impresión
2. Si no abre automático, usa **Ctrl+P** (Windows/Linux) o **Cmd+P** (Mac)
3. Configura:
   - Márgenes: Normal
   - Orientación: Vertical (Portrait)
   - Papel: A4
   - Escala: 100%
4. Haz clic en **"Imprimir"**

### Alternativas de guardado:

- **Guardar como PDF**: 
  - En lugar de impresora física, selecciona "Guardar como PDF"
  - Se descargará el archivo PDF a tu computadora

- **Enviar por email**:
  - Primero guarda como PDF
  - Adjunta el PDF al email
  - Envía a la tienda

## 📊 Ejemplo de Reporte

```
┌─────────────────────────────────────────┐
│  REPORTE DE CUENTAS POR COBRAR          │
│  Órdenes pendientes de pago             │
└─────────────────────────────────────────┘

🏪 Tienda: Tienda Centro
📞 Contacto: Juan García
📍 Dirección: Calle Principal 123

┌─────────────────────────────────────────┐
│ 📦 Total Órdenes: 3                     │
│ 💰 Monto a Cobrar: $15,750              │
│ ✅ Total Presupuesto: $18,500           │
└─────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ #Orden │ Cliente  │ Estado    │ Pendiente       │
├──────────────────────────────────────────────────┤
│ #1001  │ Cliente A│ Listo     │ $5,000          │
│ #1002  │ Cliente B│ Entregado │ $7,500          │
│ #1003  │ Cliente C│ Listo     │ $3,250          │
├──────────────────────────────────────────────────┤
│ TOTAL                                │ $15,750     │
└──────────────────────────────────────────────────┘

Generado: 29 de enero de 2026, 14:30
```

## 🔧 Configuración Técnica

### Funciones agregadas:

1. **`obtenerOrdenesPendientesTienda(tiendaId)`**
   - Filtra las órdenes pendientes de una tienda
   - Retorna array de órdenes

2. **`generarReporteCuentasPorCobrar(tiendaId)`**
   - Genera el HTML del reporte
   - Abre en nueva ventana
   - Inicia impresión automáticamente

### Filtros utilizados:

```javascript
// Una orden se incluye si:
// 1. Pertenece a la tienda especificada
// 2. Está en estado "Listo para Entrega" O "Entregado"
// 3. Tiene saldo pendiente (presupuesto > anticipo)
```

## 💡 Casos de Uso

### Uso 1: Control de Pagos Pendientes
- Generar reporte cada viernes
- Revisar qué tiendas deben dinero
- Preparar cobranza

### Uso 2: Comunicación con Tiendas
- Imprimir reporte
- Enviar a tienda por email o WhatsApp
- Tienda sabe exactamente cuánto debe

### Uso 3: Registro Administrativo
- Guardar PDF como respaldo
- Crear archivo de cuentas por cobrar
- Auditoría de pagos

## ⚙️ Mejoras Futuras Posibles

- [ ] Envío automático de reporte por email
- [ ] Filtrar órdenes por rango de fechas
- [ ] Agregar gráficos de pago por tienda
- [ ] Crear alertas para cuentas vencidas
- [ ] Reporte comparativo entre tiendas

## 📝 Notas Importantes

1. **Privacidad**: Cada tienda solo ve su propio reporte
2. **Actualización en Tiempo Real**: El reporte siempre muestra datos actuales
3. **Historial**: Se basa en el estado actual de las órdenes
4. **Cálculos Automáticos**: Todos los montos se calculan automáticamente

## ❓ Preguntas Frecuentes

### P: ¿Qué pasa si no hay órdenes pendientes?
R: El reporte muestra un mensaje "✅ ¡Excelente! No hay órdenes pendientes de pago"

### P: ¿Se incluyen órdenes completamente pagadas?
R: No, solo se incluyen órdenes con saldo pendiente

### P: ¿Puedo personalizar el reporte?
R: Sí, puedes editar el CSS en la función `generarReporteCuentasPorCobrar`

### P: ¿Se puede programar para que se envíe automáticamente?
R: Actualmente no, pero es una mejora futura planeada

## 📞 Soporte

Si tienes problemas:
1. Verifica que la tienda tenga órdenes
2. Comprueba que las órdenes tengan estado "Listo para Entrega" o "Entregado"
3. Asegúrate que tengan saldo pendiente
4. Revisa la consola del navegador (F12) para mensajes de error

---

**Versión**: 1.0  
**Fecha**: 29 de enero de 2026  
**Autor**: Sistema Tu-Taller
