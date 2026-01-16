# 💳 Métodos de Pago y Comisiones Bancarias

## 📋 Resumen de Nuevas Funcionalidades

Se han implementado mejoras significativas en el sistema de pagos y reportes para incluir:

1. **Métodos de pago al registrar pagos**
2. **Métodos de pago al entregar órdenes**
3. **Cálculo automático de comisiones bancarias**
4. **Reporte de dinero en banco vs efectivo**
5. **Ganancia neta con desglose de comisiones**

---

## 🎯 Funcionalidades Implementadas

### 1. Registro de Pagos con Método de Pago

Cuando registres un pago (en la sección de **Pagos** o al hacer clic en "💰 Registrar Pago"), el sistema ahora te preguntará:

```
Selecciona el método de pago:
1. Efectivo
2. Transferencia
3. Tarjeta de Crédito/Débito

Ingresa el número (1, 2 o 3):
```

**Comisiones aplicadas:**
- **Efectivo**: 0% (sin comisión)
- **Transferencia**: 1.5% de comisión
- **Tarjeta de Crédito/Débito**: 3% de comisión

**Ejemplo:**
- Pago de $100,000
- Método: Transferencia
- Comisión: $1,500 (1.5%)
- Monto neto recibido: $98,500

---

### 2. Pago Final al Entregar Orden

Cuando cambies el estado de una orden a **"Entregado"** y haya saldo pendiente:

1. El sistema preguntará: *"¿Deseas registrar el pago final ahora?"*
2. Si aceptas, te pedirá seleccionar el método de pago
3. Registrará automáticamente el pago con su respectiva comisión
4. Mostrará un resumen del pago realizado

**Mensaje mostrado:**
```
✅ Orden entregada y pago registrado!
Método: Transferencia
Monto: $50,000
Comisión: $750 (1.5%)
Monto neto: $49,250
```

---

### 3. Sección de Pagos Mejorada

En la sección **Pagos** ahora verás un nuevo panel con:

```
💰 Resumen de Cobros
┌─────────────────────────────────────┐
│ 💵 Efectivo          │ $XXX,XXX     │
│ 🏦 Dinero en Banco   │ $XXX,XXX     │
│    (Neto después de comisiones)     │
│ 📊 Comisiones Pagadas│ $X,XXX       │
└─────────────────────────────────────┘
```

**Detalles:**
- **Efectivo**: Total recibido en efectivo (sin comisiones)
- **Dinero en Banco**: Monto neto depositado después de restar comisiones
- **Comisiones Pagadas**: Total de comisiones pagadas a bancos/procesadores

---

### 4. Reportes con Desglose Completo

En la sección **Reportes**, ahora encontrarás:

#### A) Desglose de Ganancias Actualizado

```
┌─────────────────────────────────────────────────┐
│ Concepto                │ Monto      │ %        │
├─────────────────────────────────────────────────┤
│ 💰 TOTAL COBRADO        │ $1,000,000 │ 100%     │
│ 🔧 Costos Piezas Ext.   │ -$200,000  │ -20%     │
│ 📦 Costos Repuestos     │ -$100,000  │ -10%     │
│ 🏦 Comisiones Bancarias │ -$15,000   │ -1.5%    │
│ ✅ GANANCIA NETA        │ $685,000   │ 68.5%    │
│ 💵 Anticipos Recibidos  │ $500,000   │ 50%      │
└─────────────────────────────────────────────────┘
```

#### B) Nueva Sección: Métodos de Pago Recibidos

```
💳 Métodos de Pago Recibidos
┌──────────────────────────────────────────────┐
│ Método de Pago          │ Monto    │ %       │
├──────────────────────────────────────────────┤
│ 💵 Efectivo             │ $400,000 │ 40%     │
│ 🏦 Dinero en Banco      │ $585,000 │ 58.5%   │
│ 📉 Comisiones Pagadas   │ -$15,000 │ -1.5%   │
│ 💰 Total Cobrado Bruto  │ $1,000,000│ 100%   │
└──────────────────────────────────────────────┘
```

**Explicación:**
- **Efectivo**: Dinero recibido en efectivo (sin deducciones)
- **Dinero en Banco**: Monto neto depositado en cuenta bancaria
- **Comisiones Pagadas**: Costo total de usar transferencias/tarjetas
- **Total Cobrado Bruto**: Suma de todo lo cobrado antes de comisiones

---

## 📊 Interpretación de los Datos

### Ejemplo Práctico

Supongamos que tienes las siguientes órdenes completadas:

**Orden #1:**
- Total: $100,000
- Anticipo: $50,000 (Efectivo)
- Saldo: $50,000 (Transferencia)

**Orden #2:**
- Total: $80,000
- Pago completo: $80,000 (Tarjeta)

**Cálculos:**

1. **Efectivo recibido:** $50,000
2. **Transferencia:** $50,000 - 1.5% = $49,250 neto
3. **Tarjeta:** $80,000 - 3% = $77,600 neto
4. **Comisiones totales:** $750 + $2,400 = $3,150

**En tus reportes verás:**
- 💵 Efectivo: $50,000
- 🏦 Dinero en Banco: $126,850 ($49,250 + $77,600)
- 📊 Comisiones Pagadas: $3,150
- 💰 Total Cobrado Bruto: $180,000

**Ganancia Neta:**
Si tus costos fueron $40,000:
- Ganancia Neta = $180,000 - $40,000 - $3,150 = $136,850

---

## 🔧 Configuración de Comisiones

Las comisiones están configuradas en el código y son:

```javascript
Efectivo: 0%
Transferencia: 1.5%
Tarjeta: 3%
```

Si necesitas ajustar estos porcentajes, debes modificar en [app.js](app.js):

```javascript
const metodos = {
    '1': { nombre: 'Efectivo', comision: 0 },
    '2': { nombre: 'Transferencia', comision: 0.015 }, // 1.5%
    '3': { nombre: 'Tarjeta', comision: 0.03 } // 3%
};
```

**Para cambiar las comisiones:**
1. Localiza esta sección en el código (aparece en 2 lugares)
2. Modifica los valores de `comision`:
   - 0.015 = 1.5%
   - 0.03 = 3%
   - 0.025 = 2.5%
3. Guarda los cambios

---

## 📝 Historial de Pagos

Cada pago registrado ahora incluye:

```javascript
{
    monto: 50000,              // Monto bruto del pago
    montoNeto: 49250,          // Monto después de comisión
    comision: 750,             // Comisión cobrada
    metodoPago: "Transferencia", // Método usado
    fecha: "2026-01-16T...",   // Fecha y hora
    tipo: "Pago"               // Tipo de pago
}
```

Esta información se guarda automáticamente y se usa para:
- Calcular reportes precisos
- Mostrar dinero en banco vs efectivo
- Determinar ganancia neta real

---

## ✅ Ventajas del Sistema

1. **Transparencia Total**: Sabes exactamente cuánto dinero tienes en cada forma
2. **Ganancia Real**: Los reportes muestran tu ganancia después de comisiones
3. **Toma de Decisiones**: Puedes ver el impacto de usar diferentes métodos de pago
4. **Control Financiero**: Distingues entre efectivo en caja y dinero en banco

---

## 🚀 Uso Recomendado

### Al Registrar Pagos:
1. Pregunta al cliente cómo pagará
2. Selecciona el método correcto
3. El sistema calculará automáticamente la comisión
4. Verifica que el monto neto sea correcto

### Al Generar Reportes:
1. Selecciona el período deseado
2. Revisa la sección "💳 Métodos de Pago Recibidos"
3. Compara efectivo vs banco
4. Analiza el impacto de las comisiones en tu ganancia

### Para Mejorar Ganancias:
- Incentiva pagos en efectivo para evitar comisiones
- Considera trasladar la comisión al cliente si es posible
- Analiza periódicamente el porcentaje de comisiones pagadas

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo cambiar el método de pago después de registrarlo?**
R: Actualmente no. Asegúrate de seleccionar el método correcto al registrar.

**P: ¿Las órdenes antiguas se ven afectadas?**
R: No. Las órdenes sin método de pago se asumen como efectivo en los reportes.

**P: ¿Puedo tener diferentes comisiones por tarjeta?**
R: Sí, puedes modificar los porcentajes en el código según tus necesidades.

**P: ¿Se puede registrar parte en efectivo y parte con tarjeta?**
R: Puedes hacerlo en pagos separados. Registra cada pago con su método.

---

## 📞 Soporte

Si necesitas ajustar las comisiones o personalizar los métodos de pago, contacta al desarrollador del sistema.

**Última actualización:** 16 de enero de 2026
