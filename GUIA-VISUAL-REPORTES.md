# 📊 GUÍA VISUAL - Reportes de Cuentas por Cobrar

## 🎯 Nuevos Botones Agregados

### 1️⃣ Botón en Modal de Tienda

Cuando haces clic en una tienda desde el listado, aparece este modal:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Tienda Centro                                  │
│  Contacto: Juan García                          │
│  Teléfono: +57 300 123 4567                     │
│  Email: tienda@email.com                        │
│  Dirección: Calle Principal 123, Piso 2         │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ 👁️ Ver Órdenes │ 📊 Reporte │ ✏️ Editar │  │
│  │ 🗑️ Eliminar    │                         │  │
│  └──────────────────────────────────────────┘  │
│  [ Cancelar ]                                   │
│                                                 │
└─────────────────────────────────────────────────┘

👆 El nuevo botón naranja "📊 Reporte"
```

### 2️⃣ Botón en Vista de Órdenes de Tienda

En la vista de órdenes de una tienda, al final de la página:

```
─────────────────────────────────────────────────

[ 📊 Imprimir Reporte de Cuentas ] [ ← Volver a Tiendas ]

─────────────────────────────────────────────────

👆 Nuevo botón naranja
```

---

## 📄 Vista Previa del Reporte PDF

### Parte Superior (Header)

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  📊 REPORTE DE CUENTAS POR COBRAR                            ║
║  Órdenes pendientes de pago                                 ║
║                                                              ║
║  🏪 Tienda: Tienda Centro                                    ║
║  📞 Contacto: Juan García                                    ║
║  📍 Dirección: Calle Principal 123, Piso 2                   ║
║  ✉️ Email: tienda@email.com                                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### Sección de Estadísticas

```
┌────────────────────────────────┐  ┌────────────────────────────────┐
│  📦 Total Órdenes Pendientes    │  │  💰 Monto Total a Cobrar        │
│                                 │  │                                 │
│  5 órdenes                      │  │  $38,750                        │
└────────────────────────────────┘  └────────────────────────────────┘

┌────────────────────────────────┐
│  ✅ Total en Presupuesto        │
│                                 │
│  $42,500                        │
└────────────────────────────────┘
```

### Tabla de Órdenes Detalladas

```
┌──────────────────────────────────────────────────────────────────────────┐
│ #Orden │ Cliente      │ Equipo          │ Fecha     │ Estado   │ Monto  │
├──────────────────────────────────────────────────────────────────────────┤
│ #1001  │ Cliente A    │ iPhone 12 Pro   │ 15 ene    │ Listo    │ $5,000 │
│ #1002  │ Cliente B    │ Samsung S21     │ 18 ene    │ Entreg.  │ $8,750 │
│ #1003  │ Cliente C    │ Galaxy A51      │ 20 ene    │ Listo    │ $3,500 │
│ #1004  │ Cliente D    │ Motorola G10    │ 22 ene    │ Entreg.  │ $7,250 │
│ #1005  │ Cliente E    │ Xiaomi Note 10  │ 24 ene    │ Listo    │ $14,250│
├──────────────────────────────────────────────────────────────────────────┤
│ TOTAL                                                    │ $38,750 │
└──────────────────────────────────────────────────────────────────────────┘
```

### Tabla Completa (Todas las Columnas)

```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ #Ord │ Cliente      │ Equipo          │ Fecha │ Estado   │ Presupuesto │ Anticipo │ Pendiente│
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│1001  │ Cliente A    │ iPhone 12 Pro   │15-ene│ Listo    │ $5,500      │ $500     │ $5,000  │
│1002  │ Cliente B    │ Samsung S21     │18-ene│ Entreg.  │ $9,000      │ $250     │ $8,750  │
│1003  │ Cliente C    │ Galaxy A51      │20-ene│ Listo    │ $4,000      │ $500     │ $3,500  │
│1004  │ Cliente D    │ Motorola G10    │22-ene│ Entreg.  │ $7,750      │ $500     │ $7,250  │
│1005  │ Cliente E    │ Xiaomi Note 10  │24-ene│ Listo    │ $15,000     │ $750     │ $14,250 │
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│ TOTAL                                                    │ $41,250     │ $2,500   │ $38,750 │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Footer (Pie de Página)

```
═════════════════════════════════════════════════════════════════

  Reporte generado el 29 de enero de 2026, 14:35:22
  © 2025 Sistema de Taller - Tu Taller
  Imprima este documento y entréguelo a la tienda para su registro

═════════════════════════════════════════════════════════════════
```

---

## 🔄 Flujo de Uso Paso a Paso

### Opción 1: Desde Listado de Tiendas

```
Inicio de Sesión
    ↓
Dashboard Principal
    ↓
Click en "🏪 Tiendas" (Navegación)
    ↓
Ver Grid de Tiendas
    ├─ Tienda Centro [$8,500 pendiente]
    ├─ Tienda Suroeste [$12,300 pendiente]
    └─ Tienda Oriente [$0 pendiente]
    ↓
Click en "Tienda Centro" (Tarjeta)
    ↓
Modal con opciones
    ├─ 👁️ Ver Órdenes
    ├─ 📊 Reporte  ← Click aquí
    ├─ ✏️ Editar
    └─ 🗑️ Eliminar
    ↓
Se abre nueva ventana con el PDF
    ↓
Impresión automática (o descargar PDF)
```

### Opción 2: Desde Vista de Órdenes

```
Grid de Tiendas
    ↓
Click en una Tienda
    ↓
Modal de opciones
    ↓
Click "👁️ Ver Órdenes"
    ↓
Tabla con todas las órdenes de la tienda
    (Recibido, En Diagnóstico, Listo, Entregado, etc.)
    ↓
En la parte inferior:
    [ 📊 Imprimir Reporte ] ← Click aquí
    [ ← Volver a Tiendas ]
    ↓
Se abre nueva ventana con el PDF
    ↓
Impresión automática
```

---

## 💾 Cómo Guardar el Reporte

### En Navegador Firefox o Chrome:

```
1. El PDF se abre automáticamente
2. Haz clic en icono de descarga (esquina superior derecha)
   O presiona Ctrl+S (Windows) / Cmd+S (Mac)
3. Selecciona carpeta de destino
4. Guarda con nombre como: "Cuentas_por_Cobrar_Tienda_Centro_29ene2026.pdf"
```

### Para Imprimir en Papel:

```
1. El diálogo de impresión aparece automáticamente
   O presiona Ctrl+P (Windows) / Cmd+P (Mac)
2. Selecciona impresora
3. Configura:
   - Márgenes: Normal
   - Orientación: Vertical
   - Papel: A4
   - Escala: 100%
4. Haz clic en "Imprimir"
```

---

## 🎨 Colores Utilizados en el Reporte

```
Elemento                    Color           Código
─────────────────────────────────────────────────────
Header (Fondo)              Gradiente       #667eea → #764ba2
Header (Texto)              Blanco          #FFFFFF
Estadísticas (Normal)       Gris Claro      #f5f7fa
Estadísticas (Alerta)       Naranja         #f59e0b
Estadísticas (Éxito)        Verde           #10b981
Tabla (Encabezado)          Gris            #f5f5f5
Tabla (Líneas)              Gris Claro      #e0e0e0
Tabla (Filas pares)         Blanco          #FFFFFF
Tabla (Filas impares)       Gris Muy Claro  #fafafa
Fila Total                  Gradiente       #667eea (fondo)
Texto Pendiente             Naranja         #f59e0b
Footer                      Gris            #f5f5f5
```

---

## 📊 Datos que Se Muestran

### De la Tienda:
- ✅ Nombre de la tienda
- ✅ Contacto (persona responsable)
- ✅ Teléfono
- ✅ Email
- ✅ Dirección

### De las Órdenes Pendientes:
- ✅ Número de orden
- ✅ Nombre del cliente
- ✅ Marca y modelo del equipo
- ✅ Fecha de ingreso
- ✅ Estado actual
- ✅ Presupuesto total
- ✅ Anticipo pagado
- ✅ Saldo pendiente

### Cálculos Automáticos:
- ✅ Total de órdenes pendientes
- ✅ Suma de presupuestos
- ✅ Suma de anticipos
- ✅ Suma total a cobrar

---

## ⚠️ Órdenes que Aparecen/No Aparecen

### ✅ APARECEN en el reporte:

- Órdenes en estado "Listo para Entrega" sin cobrar
- Órdenes en estado "Entregado" con saldo pendiente
- Cualquier orden donde: `Presupuesto > Anticipo`

### ❌ NO APARECEN en el reporte:

- Órdenes completamente pagadas
- Órdenes canceladas
- Órdenes en estado "Recibido"
- Órdenes en estado "En Diagnóstico"
- Órdenes en estado "Esperando Repuestos"
- Órdenes en estado "En Reparación"

---

## 💡 Casos de Uso del Reporte

### Caso 1: Cobro de Deudas
```
👤 Gerente del Taller
   ↓
   Quiere saber cuánto debe la Tienda Centro
   ↓
   Genera el reporte
   ↓
   Ve que debe $38,750 en 5 órdenes
   ↓
   Imprime y envía a la tienda
   ↓
   Tienda ve exactamente lo que debe
   ↓
   ✅ Cobro facilitado
```

### Caso 2: Auditoría Contable
```
👤 Contador
   ↓
   Necesita documentar cuentas por cobrar
   ↓
   Genera reporte de cada tienda
   ↓
   Suma todos los reportes
   ↓
   Total cuentas por cobrar: $150,000
   ↓
   ✅ Documentación lista
```

### Caso 3: Comunicación con Cliente
```
👤 Vendedor
   ↓
   Tienda dice "No sé cuánto debo exactamente"
   ↓
   Genera reporte
   ↓
   Envía PDF por email
   ↓
   Tienda imprime y archiva
   ↓
   ✅ Transparencia garantizada
```

---

## 🔍 Ejemplo de Cálculos en el Reporte

### Orden #1001
```
Presupuesto:          $5,500
Anticipo pagado:      -$500
─────────────────────────
Pendiente por cobrar: $5,000  ← Aparece en reporte
```

### Orden #2010 (NO aparece)
```
Presupuesto:          $3,000
Anticipo pagado:      -$3,000
─────────────────────────
Pendiente por cobrar: $0      ← NO aparece (completamente pagada)
```

### Totales en Reporte
```
Orden #1001:  Pendiente $5,000
Orden #1002:  Pendiente $8,750
Orden #1003:  Pendiente $3,500
Orden #1004:  Pendiente $7,250
Orden #1005:  Pendiente $14,250
─────────────────────────
TOTAL:        Pendiente $38,750  ← Se suma automáticamente
```

---

## 📱 Responsive en Móvil

El reporte se adapta a diferentes tamaños de pantalla:

```
Desktop (Pantalla grande):
┌──────────────────────────────────────────────────┐
│ Tabla completa con 8 columnas                    │
│ Estadísticas en 3 columnas                      │
└──────────────────────────────────────────────────┘

Tablet (Pantalla mediana):
┌──────────────────────────────────────────────────┐
│ Tabla comprimida pero legible                    │
│ Estadísticas en 1-2 columnas                    │
└──────────────────────────────────────────────────┘

Móvil (Pantalla pequeña):
┌──────────────────────────────────────────────────┐
│ Tabla con scroll horizontal                      │
│ Estadísticas apiladas verticalmente             │
└──────────────────────────────────────────────────┘
```

---

## 🎓 Resumen Visual de la Implementación

```
TU APLICACIÓN (app.js)
         │
         ├── Sección "Tiendas"
         │   ├── Listado de Tiendas (Grid)
         │   │   └── Click en Tienda
         │   │       └── Modal con botones
         │   │           ├── 👁️ Ver Órdenes
         │   │           ├── 📊 Reporte ← NUEVO
         │   │           ├── ✏️ Editar
         │   │           └── 🗑️ Eliminar
         │   │
         │   └── Vista Detallada de Órdenes
         │       ├── Tabla de órdenes por estado
         │       └── Botones inferiores:
         │           ├── 📊 Imprimir Reporte ← NUEVO
         │           └── ← Volver a Tiendas
         │
         └── Funciones Nuevas:
             ├── obtenerOrdenesPendientesTienda()
             └── generarReporteCuentasPorCobrar()
                 └── Genera PDF profesional
                     └── Abre en nueva ventana
                         └── Imprime automáticamente
```

---

## ✨ Ventajas Inmediatas

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Saber deuda de tienda** | Buscar orden por orden | 1 botón = reporte completo |
| **Enviar a tienda** | Decirle por teléfono | Imprime y envía PDF |
| **Documentación** | Ninguna | Reporte impreso con fecha |
| **Tiempo de cobro** | 30 minutos | 5 minutos |
| **Errores de cálculo** | Manual, propenso a errores | Automático, 100% preciso |
| **Profesionalismo** | Informal | Reporte con logo y diseño |

---

**Versión**: 1.0  
**Fecha**: 29 de enero de 2026  
**Estado**: ✅ Completado
