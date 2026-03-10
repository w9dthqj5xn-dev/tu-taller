# 📱 FUNCIONALIDADES DEL SISTEMA TU TALLER

Sistema completo de gestión para talleres de reparación de dispositivos electrónicos.

---

## **1. 👥 GESTIÓN DE CLIENTES**

### Funcionalidades principales:
- ✅ Agregar nuevos clientes
  - Nombre
  - Apellido
  - Celular (requerido)
  - Email
  - Dirección
- ✅ Editar información de clientes existentes
- ✅ Eliminar clientes
- ✅ Buscar clientes
- ✅ Cliente final (para órdenes sin cliente registrado)
- ✅ Listado completo con ordenamiento alfabético
- ✅ Validación de datos duplicados por celular

---

## **2. 📋 GESTIÓN DE ÓRDENES DE REPARACIÓN**

### Crear órdenes con:

**Información del dispositivo:**
- Cliente (existente, nuevo o cliente final)
- Tipo de dispositivo (Celular, Tablet, Laptop, Smartwatch, Otro)
- Marca y modelo
- IMEI o número de serie
- Problema reportado
- Accesorios incluidos

**Estado y seguimiento:**
- Estados disponibles:
  - Recibido
  - En Diagnóstico
  - Esperando Repuestos
  - En Reparación
  - Listo para Entrega
  - Entregado
  - Cancelado
- Historial de cambios de estado con fecha y hora

**Información financiera:**
- Presupuesto
- Costo de piezas (no inventariadas)
- Anticipo
- Cálculo automático de saldo pendiente

**Garantía:**
- Con garantía / Sin garantía
- Días de garantía (configurable)
- Fecha de inicio desde la entrega

**Fechas:**
- Fecha de ingreso
- Fecha estimada de entrega
- Fecha de entrega real

**Información adicional:**
- Técnico asignado
- Notas adicionales
- Repuestos utilizados del inventario (con descuento automático)

### Otras funcionalidades:
- ✅ Editar órdenes existentes
- ✅ Eliminar órdenes (restaura repuestos al inventario)
- ✅ Filtrar por estado
- ✅ Generar ticket de orden (imprimible/PDF)
- ✅ Ver historial completo de la orden

---

## **3. 💰 GESTIÓN DE PAGOS**

### Funcionalidades principales:
- ✅ Ver todas las cuentas por cobrar
- ✅ Registrar pagos con:
  - Método de pago:
    - Efectivo (0% comisión)
    - Transferencia (0% comisión)
    - Tarjeta Débito (2.5% comisión)
    - Tarjeta Crédito (3.5% comisión)
    - Mercado Pago (4.5% comisión)
    - Otro (0% comisión)
  - Referencia de pago
  - Monto pagado
  - Cálculo automático de comisión bancaria
  - Cálculo automático de monto neto

### Estadísticas en tiempo real:
- 💵 Total cobrado
- 📊 Por cobrar
- 📅 Cobrado hoy
- 🏦 Dinero en banco (después de comisiones)

### Otras funcionalidades:
- ✅ Historial completo de pagos por orden
- ✅ Seguimiento de pagos parciales
- ✅ Actualización automática de estado cuando se completa el pago

---

## **4. 📦 INVENTARIO DE REPUESTOS**

### Agregar repuestos con:
- Nombre del repuesto
- Categoría (personalizable)
- Cantidad en stock
- Precio de compra
- Precio de venta
- Proveedor
- Ubicación en almacén
- Código o SKU
- Notas adicionales

### Funcionalidades:
- ✅ Editar información de repuestos
- ✅ Eliminar repuestos
- ✅ Control automático de stock
- ✅ Alertas de bajo stock
- ✅ Vincular repuestos a órdenes
- ✅ Descuento automático del inventario al usar en órdenes
- ✅ Restauración automática al inventario al eliminar/editar órdenes
- ✅ Búsqueda rápida en inventario
- ✅ Cálculo de valor total del inventario
- ✅ Reporte de repuestos más utilizados

---

## **5. 💸 GASTOS DE UTILERÍA**

### Registrar gastos con:
- Concepto del gasto
- Monto
- Categoría:
  - Material
  - Servicios
  - Sueldos
  - Transporte
  - Publicidad
  - Renta
  - Servicios Públicos
  - Otro
- Fecha del gasto
- Método de pago
- Notas adicionales

### Funcionalidades:
- ✅ Ver historial completo de gastos
- ✅ Filtrar por categoría
- ✅ Filtrar por rango de fechas
- ✅ Editar gastos registrados
- ✅ Eliminar gastos
- ✅ Estadísticas de gastos por categoría
- ✅ Total de gastos del período
- ✅ Integración en cálculo de ganancias netas

---

## **6. 📊 REPORTES Y ESTADÍSTICAS**

### Dashboard principal:
- 📈 Total de clientes
- 📋 Órdenes activas
- 🔧 Órdenes en reparación
- ✅ Órdenes listas para entrega
- 📅 Órdenes recientes

### Reportes financieros:
**Períodos disponibles:**
- Hoy
- Semana actual
- Mes actual
- Personalizado (rango de fechas)

**Métricas calculadas:**
- 💰 Ingresos totales del período
- 💸 Gastos del período
- 🏦 Comisiones bancarias
- 📦 Costo de repuestos utilizados
- 💵 Ganancia neta real
  - Fórmula: Presupuesto - (Costo Piezas + Costo Repuestos + Comisiones + Gastos)

**Desglose por método de pago:**
- Total por cada método
- Comisiones por método
- Monto neto por método

**Gráficos:**
- Tendencias de ingresos
- Distribución de métodos de pago
- Evolución de gastos

### Reportes de inventario:
- 💰 Valor total del inventario
- ⚠️ Productos con bajo stock
- 📊 Repuestos más utilizados
- 📉 Movimientos de inventario

---

## **7. 🔍 BÚSQUEDA AVANZADA**

### Buscar órdenes por:
- Número de orden
- Nombre del cliente
- Apellido del cliente
- Tipo de dispositivo
- Marca
- Modelo
- IMEI
- Estado actual
- Técnico asignado

### Características:
- ✅ Búsqueda en tiempo real
- ✅ Resultados instantáneos mientras escribes
- ✅ Vista completa de la orden desde resultados
- ✅ Acceso rápido a acciones (editar, ver, imprimir)

---

## **8. ⚙️ CONFIGURACIÓN**

### Gestión de perfil:
- Ver información del taller
- Cambiar nombre del taller
- Actualizar datos de contacto
- Cambiar contraseña

### Información de licencia:
- Tipo de licencia (Prueba, Mensual, Trimestral, Semestral, Anual, Vitalicia)
- Fecha de activación
- Fecha de expiración
- Dispositivos registrados / permitidos
- Estado de la licencia

### Gestión de datos:
- 🔄 **Sincronizar con Firebase**
  - Sincronización manual o automática
  - Multi-dispositivo en tiempo real
  - Backup automático en la nube
  
- 📥 **Exportar datos**
  - Formato JSON
  - Incluye clientes, órdenes, inventario, gastos
  - Backup completo del sistema
  
- 📤 **Importar datos**
  - Restaurar desde backup
  - Modos:
    - Reemplazar todos los datos
    - Combinar con datos existentes
  - Validación de estructura

### Otras opciones:
- ✅ Cerrar sesión
- ✅ Ver información de sesión actual
- ✅ Dispositivo registrado

---

## **9. 🔐 AUTENTICACIÓN Y SEGURIDAD**

### Métodos de autenticación:
- 👤 **Login tradicional**
  - Usuario y contraseña
  - Validación de credenciales
  - Sesión persistente
  
- 🔵 **Login con Google**
  - Autenticación OAuth2
  - Registro automático de usuarios nuevos
  - Sincronización con Firebase

### Activación de licencia:
- ✅ Validación de clave de licencia
- ✅ Formato: TT-TIPO-XXXXXXXX-XXXXX-XXXX
- ✅ Verificación de:
  - Licencia válida
  - No expirada
  - Límite de dispositivos no excedido
  - No suspendida

### Registro de usuarios:
- Nombre del taller
- Nombre de usuario (mínimo 4 caracteres)
- Contraseña (mínimo 4 caracteres)
- Email (opcional)
- Vinculación con licencia existente

### Sistema de sesiones:
- ✅ Sesión persistente en navegador
- ✅ Verificación automática al cargar
- ✅ Control de dispositivos por licencia
- ✅ Cierre de sesión seguro

---

## **10. 🌐 SINCRONIZACIÓN MULTI-DISPOSITIVO**

### Características:
- ☁️ **Firebase Firestore** como backend
- 🔄 Sincronización automática en tiempo real
- 💻 Trabajar desde múltiples dispositivos simultáneamente
- 📱 Acceso desde PC, tablet o móvil
- 🔒 Datos seguros en la nube
- 💾 Backup automático continuo

### Colecciones sincronizadas:
- `clientes` - Información de clientes
- `ordenes` - Órdenes de reparación
- `repuestos` - Inventario de repuestos
- `gastos` - Registro de gastos
- `usuarios` - Usuarios del sistema
- `licencias` - Licencias activas

### Sistema de migración:
- ✅ Migración automática de datos locales a Firebase
- ✅ Detección de duplicados
- ✅ Sincronización bidireccional
- ✅ Resolución de conflictos

---

## **11. 📄 GENERACIÓN DE DOCUMENTOS**

### Tickets de órdenes:
**Información incluida:**
- Logo/nombre del taller
- Número de orden
- Fecha y hora
- Información del cliente
- Detalles del dispositivo
- Problema reportado
- Accesorios incluidos
- Presupuesto y anticipo
- Saldo pendiente
- Condiciones de garantía
- Términos y condiciones
- Espacios para firmas (cliente y taller)

**Funcionalidades:**
- ✅ Generación en PDF
- ✅ Impresión directa
- ✅ Diseño profesional
- ✅ Adaptable a papel tamaño carta
- ✅ Generación desde cualquier orden

---

## **12. 💳 GESTIÓN DE COMISIONES BANCARIAS**

### Cálculo automático de comisiones:

| Método de Pago | Comisión | Descripción |
|----------------|----------|-------------|
| Efectivo | 0% | Sin comisiones |
| Transferencia | 0% | Sin comisiones |
| Tarjeta Débito | 2.5% | Comisión estándar |
| Tarjeta Crédito | 3.5% | Comisión estándar |
| Mercado Pago | 4.5% | Comisión estándar |
| Otro | 0% | Sin comisiones |

### Características:
- ✅ Cálculo automático al registrar pago
- ✅ Visualización de monto antes y después de comisión
- ✅ Registro histórico de comisiones pagadas
- ✅ Suma total de comisiones en reportes
- ✅ Impacto en cálculo de ganancia neta
- ✅ Desglose por método de pago

### Tracking financiero:
- 💰 Total cobrado (bruto)
- 💸 Total de comisiones pagadas
- 🏦 Dinero neto en banco (después de comisiones)
- 📊 Comparativa de métodos más rentables

---

## **13. 🎨 CARACTERÍSTICAS ADICIONALES**

### Interfaz de usuario:
- ✅ Diseño responsive (móvil, tablet, desktop)
- ✅ Tema moderno con gradientes
- ✅ Animaciones suaves
- ✅ Notificaciones visuales
- ✅ Iconos descriptivos
- ✅ Navegación intuitiva

### Validaciones:
- ✅ Validación de campos requeridos
- ✅ Formato de números y montos
- ✅ Validación de stock disponible
- ✅ Prevención de duplicados
- ✅ Confirmación de acciones destructivas

### Optimizaciones:
- ✅ Carga rápida de datos
- ✅ Búsqueda eficiente
- ✅ Caché local para mejor rendimiento
- ✅ Manejo de errores robusto
- ✅ Logs de depuración

---

## **TECNOLOGÍAS UTILIZADAS**

- **Frontend:** HTML5, CSS3, JavaScript vanilla
- **Backend:** Firebase Firestore (NoSQL)
- **Autenticación:** Firebase Authentication
- **Almacenamiento:** localStorage + Firebase
- **PDF:** jsPDF
- **Hosting:** Netlify
- **Control de versiones:** Git/GitHub

---

## **ARQUITECTURA DEL SISTEMA**

```
Tu-Taller/
├── index.html          # Interfaz principal
├── app.js             # Lógica de la aplicación
├── styles.css         # Estilos principales
├── responsive.css     # Estilos responsive
├── firebase-config.js # Configuración Firebase
├── firebase-licencias.js # Gestión de licencias
├── licencias.html     # Panel de administración de licencias
└── env.js            # Variables de entorno
```

---

## **FLUJO DE TRABAJO TÍPICO**

1. **Inicio de sesión** (usuario/contraseña o Google)
2. **Verificación de licencia** (válida y activa)
3. **Dashboard** - Vista general del negocio
4. **Crear orden**:
   - Seleccionar/crear cliente
   - Ingresar detalles del dispositivo
   - Definir presupuesto
   - Agregar repuestos del inventario (opcional)
5. **Seguimiento** - Actualizar estado de la orden
6. **Registrar pagos** - Con cálculo automático de comisiones
7. **Entrega** - Marcar como entregado
8. **Reportes** - Analizar métricas del negocio

---

## **SEGURIDAD Y PRIVACIDAD**

- ✅ Datos encriptados en tránsito (HTTPS)
- ✅ Autenticación segura con Firebase
- ✅ Sesiones con token
- ✅ Validación de permisos
- ✅ Control de acceso por licencia
- ✅ Backup automático en la nube
- ✅ Recuperación de datos disponible

---

**© 2025 Sistema Tu Taller - Ing. Carlos Jiménez**  
**Versión: 2.0**  
**Última actualización: Enero 2026**
