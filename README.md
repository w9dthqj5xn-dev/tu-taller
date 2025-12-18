# 🔧 Sistema de Taller de Reparaciones - COMPLETO

Sistema profesional y completo para gestionar un taller de reparación de celulares, tablets y otros dispositivos electrónicos.

## ✨ Características Principales

### 📋 Gestión de Clientes
- Registro completo de clientes (nombre, apellido, celular, email, dirección)
- Historial completo de reparaciones por cliente
- Búsqueda rápida de clientes
- Edición y eliminación de clientes
- Vista de estadísticas por cliente

### 🔧 Órdenes de Reparación
- Registro detallado de dispositivos (tipo, marca, modelo, IMEI)
- Descripción del problema reportado
- Control de accesorios incluidos
- **7 estados de seguimiento:**
  - Recibido
  - En Diagnóstico
  - Esperando Repuestos
  - En Reparación
  - Listo para Entrega
  - Entregado
  - Cancelado
- Presupuestos y anticipos
- Control de garantías (días)
- Fechas de ingreso y entrega estimada
- Asignación de técnico
- Notas adicionales
- Numeración automática de órdenes
- **Impresión de recibos de ingreso**

### 💰 Gestión de Pagos y Cuentas por Cobrar
- Control de pagos y anticipos
- Seguimiento de saldos pendientes
- Vista de cuentas por cobrar
- Estadísticas de cobros (total cobrado, por cobrar, cobrado hoy)
- **Impresión de recibos de pago**
- Registro de pagos parciales
- Alerta de saldos pendientes

### 📦 Inventario de Repuestos
- Registro completo de repuestos y piezas
- Categorización (Pantallas, Baterías, Cámaras, Conectores, etc.)
- Control de stock actual y mínimo
- **Alertas de stock bajo**
- Precios de compra y venta
- Compatibilidad con dispositivos
- Códigos/SKU
- Ubicación en almacén
- Filtros por categoría y estado de stock

### 📊 Reportes y Estadísticas Avanzadas
- **Períodos configurables:**
  - Hoy
  - Esta Semana
  - Este Mes
  - Este Año
  - Todo el Tiempo
- **Métricas clave:**
  - Ingresos totales
  - Órdenes completadas
  - Promedio por orden
  - Tiempo promedio de reparación
- **Top rankings:**
  - Dispositivos más reparados
  - Mejores clientes
- **Exportación de datos** (JSON para respaldo)
- **Impresión de reportes**

### 🖨️ Sistema de Impresión de Recibos
- **Recibo de ingreso de equipo**
  - Datos del cliente
  - Datos del equipo
  - Problema reportado
  - Presupuesto y anticipo
  - Garantía
  - Firma del cliente
- **Recibo de pago**
  - Monto pagado
  - Saldo pendiente
  - Historial de pagos

### 🔍 Búsqueda Avanzada
- Búsqueda unificada por:
  - Nombre de cliente
  - Número de celular
  - Número de orden
  - Marca/modelo del dispositivo
  - IMEI/Serie
  - Descripción del problema

### 📱 Dashboard Interactivo
- Vista general con estadísticas en tiempo real
- Total de clientes registrados
- Órdenes activas
- Estado de reparaciones en progreso
- Dispositivos listos para entrega
- Vista de órdenes recientes

## 🎨 Características de Diseño

- ✅ Interfaz profesional con gradientes modernos
- ✅ 100% Responsive (funciona en móviles, tablets y escritorio)
- ✅ Colores por estado para identificación rápida
- ✅ Badges y etiquetas visuales
- ✅ Alertas visuales para stock bajo
- ✅ Diseño intuitivo y fácil de usar
- ✅ Animaciones suaves

## 🚀 Cómo Usar

1. **Abrir el sistema**: Abre el archivo `index.html` en tu navegador web
2. El sistema usa almacenamiento local (localStorage), por lo que los datos se guardan automáticamente
3. **No requiere instalación** ni servidor
4. **No requiere internet** para funcionar

### 📝 Flujo de Trabajo Recomendado

1. **Registrar Clientes**: 
   - Ve a "Clientes" → "+ Nuevo Cliente"
   - Completa los datos básicos

2. **Crear Orden de Reparación**:
   - Ve a "Órdenes" → "+ Nueva Orden"
   - Selecciona el cliente
   - Ingresa datos del dispositivo
   - Describe el problema
   - Define presupuesto y anticipo
   - ¡Imprime el recibo de ingreso!

3. **Actualizar Estado**:
   - Conforme avance la reparación, actualiza el estado
   - Usa "Cambiar Estado" en cada orden

4. **Registrar Pagos**:
   - Ve a "Pagos" para ver cuentas por cobrar
   - Registra pagos parciales o totales
   - Imprime recibos de pago

5. **Controlar Inventario**:
   - Ve a "Inventario" → "+ Agregar Repuesto"
   - Mantén el stock actualizado
   - Recibe alertas cuando el stock esté bajo

6. **Generar Reportes**:
   - Ve a "Reportes"
   - Selecciona el período
   - Analiza estadísticas
   - Exporta datos para respaldo

7. **Entregar Dispositivo**:
   - Marca como "Listo para Entrega"
   - Cliente realiza pago final
   - Marca como "Entregado"

## 💾 Almacenamiento y Respaldo

### Almacenamiento Local
- Los datos se guardan en localStorage del navegador
- ✅ No necesitas internet
- ✅ Datos privados en tu computadora
- ⚠️ Los datos están solo en ese navegador específico
- ⚠️ Si borras datos del navegador, perderás la información

### Sistema de Respaldo
1. Ve a "Reportes"
2. Haz clic en "�� Exportar Datos (JSON)"
3. Guarda el archivo de respaldo
4. Para restaurar: importa el archivo (requiere implementación adicional)

## 🔐 Seguridad

- Almacenamiento 100% local
- Sin transmisión de datos a servidores externos
- Recomendado para uso en red local confiable
- Considera hacer respaldos periódicos

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Google Chrome (recomendado)
- ✅ Mozilla Firefox
- ✅ Microsoft Edge
- ✅ Safari
- ✅ Opera

### Dispositivos
- ✅ Computadoras de escritorio
- ✅ Laptops
- ✅ Tablets
- ✅ Smartphones

## 🎯 Casos de Uso

- **Talleres pequeños**: Gestión completa para 1-3 técnicos
- **Talleres medianos**: Control de múltiples órdenes y clientes
- **Freelance**: Perfecto para técnicos independientes
- **Tiendas de reparación**: Control de inventario y cuentas

## 🛠️ Personalización

Puedes personalizar:
- **styles.css**: Colores, fuentes, diseño
- **app.js**: Funcionalidades y lógica
- **Agregar más campos** según necesites
- **Modificar estados** de las órdenes
- **Categorías de inventario** personalizadas

## 📈 Próximas Mejoras Sugeridas

- [ ] Notificaciones por WhatsApp/SMS
- [ ] Importación de datos de respaldo
- [ ] Gráficos y estadísticas visuales
- [ ] Sistema de usuarios múltiples
- [ ] Integración con impresoras térmicas
- [ ] App móvil nativa

## 💡 Tips y Consejos

1. **Haz respaldos semanales** de tus datos
2. **Imprime siempre** el recibo de ingreso
3. **Actualiza el estado** de las órdenes regularmente
4. **Mantén el inventario actualizado** para evitar sorpresas
5. **Registra anticipos** para reducir cuentas por cobrar
6. **Usa el buscador** para encontrar órdenes rápidamente
7. **Revisa los reportes** para analizar tu negocio

## 🆘 Soporte

Para dudas o mejoras, puedes:
- Modificar el código según tus necesidades
- Agregar funcionalidades específicas
- Personalizar el diseño

## 📜 Licencia

Sistema libre para uso personal y comercial en tu taller.

---

**🔧 Sistema diseñado específicamente para talleres de reparación de dispositivos electrónicos**

**Desarrollado con ❤️ para facilitar tu trabajo diario**
