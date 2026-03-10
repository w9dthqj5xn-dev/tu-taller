# 🖨️ Guía Rápida: Imprimir y Descargar Reportes

## 📋 Pasos Rápidos

### Para Imprimir un Reporte:

1. **Abre Tu-Taller** → https://tu-taller.netlify.app
2. **Ve a "🏪 Tiendas"** 
3. **Haz clic en una Tienda**
4. **Botón "📊 Reporte"** en el modal
5. **Elige "🖨️ Imprimir"**
6. Selecciona impresora y confirma

✨ **Listo:** Tu reporte se envía a imprimir

---

### Para Descargar un Reporte en PDF:

1. **Abre Tu-Taller** → https://tu-taller.netlify.app
2. **Ve a "🏪 Tiendas"**
3. **Haz clic en una Tienda**
4. **Botón "📊 Reporte"** en el modal
5. **Elige "📥 Descargar"**
6. Archivo se guarda automáticamente en Downloads

✨ **Listo:** PDF descargado con nombre automático

---

## 📊 Qué Contiene el Reporte

✅ **Datos de la Tienda**
- Nombre
- Contacto
- Teléfono
- Email

✅ **Estadísticas**
- Total de órdenes pendientes
- Monto total pendiente

✅ **Tabla de Órdenes**
- Número de orden
- Cliente
- Equipo
- Fecha
- Estado
- Presupuesto
- Anticipo
- **Pendiente de cobro** ⚠️

✅ **Resumen**
- Total presupuesto
- Total anticipos
- Total pendiente

---

## 🎯 Diferencias entre Opciones

| Aspecto | Imprimir | Descargar |
|---------|----------|-----------|
| **Resultado** | Papel físico | Archivo PDF |
| **Uso** | Entregar a tienda | Guardar/Compartir |
| **Requiere** | Impresora | Carpeta descargas |
| **Permanencia** | Física | Digital |
| **Compartir** | Copias impresas | Por email |

---

## 💡 Tips Útiles

### Tip 1: Guardar como PDF sin Impresora
Puedes usar la opción **Imprimir** y seleccionar:
- **Destino:** "Guardar como PDF"
- Tendrás más control sobre nombres y ubicación

### Tip 2: Nombres de Archivo
Los PDFs descargados se nombran así:
```
Reporte-Cuentas-TuTaller-29-01-2026.pdf
```
Puedes renombrarlos después si lo necesitas

### Tip 3: Datos Actualizados
Cada vez que generas un reporte:
- ✅ Se sincroniza desde Firebase
- ✅ Siempre ves datos actuales
- ✅ Múltiples usuarios ven lo mismo

### Tip 4: Sin Internet
Si se corta la conexión:
- ✅ Funciona con datos guardados en caché
- ✅ Reportes siguen disponibles
- Los datos se actualizan cuando vuelva Internet

---

## 🚀 Casos de Uso

### Caso 1: Entrega Física
```
Gerente A: "Necesito imprimir un reporte para la tienda"
→ Usa opción "IMPRIMIR"
→ Entrega a tienda en mano
```

### Caso 2: Respuesta por Email
```
Tienda: "¿Cuánto me deben?"
Gerente: Descarga reporte
→ Usa opción "DESCARGAR"
→ Envía por email
```

### Caso 3: Archivo Permanente
```
Auditoría: "Necesito registro de cobros"
→ Gerente descarga periódicamente
→ Guarda en carpeta de "Reportes Archivados"
```

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo descargar el mismo reporte varias veces?**
R: Sí, sin problemas. Solo genera un nuevo reporte.

**P: ¿Aparecen datos de hace 1 año?**
R: No, solo órdenes pendientes de pago recientes.

**P: ¿Funciona en móvil?**
R: Sí, pero se recomienda hacer clic en botones. Para imprimir/descargar, mejor desde PC.

**P: ¿Se ven bien en color?**
R: Sí, está diseñado con colores profesionales.

**P: ¿Puedo editar el PDF después?**
R: No directamente. Puedes imprimir a PDF nuevamente si necesitas cambios.

---

## 🎨 Vista Previa del Modal

```
╔═══════════════════════════════════════╗
║                                       ║
║         📊 Reporte Listo              ║
║                                       ║
║    Reporte de Cuentas por Cobrar      ║
║    Tienda XYZ                         ║
║                                       ║
║  ┌─────────────────────────────────┐  ║
║  │ 🖨️ Imprimir │ 📥 Descargar     │  ║
║  └─────────────────────────────────┘  ║
║                                       ║
║       ┌──────────────────────┐        ║
║       │  ✕ Cerrar          │        ║
║       └──────────────────────┘        ║
║                                       ║
╚═══════════════════════════════════════╝
```

---

## ✅ Verificación

- ✅ Modal aparece al hacer clic en "📊 Reporte"
- ✅ Botón "🖨️ Imprimir" abre ventana con reporte
- ✅ Botón "📥 Descargar" abre diálogo de descarga
- ✅ Datos sincronizados desde Firebase
- ✅ Nombres de archivo automáticos
- ✅ Funciona sin conexión (caché local)

---

*Última actualización: 29 de enero de 2026*  
*Versión: 1.0*
