// Funciones de Firebase para gestión de licencias

// Editar número de dispositivos
async function editarLicenciaFirebase(licenseKey) {
    try {
        const snapshot = await db.collection('licencias')
            .where('licenseKey', '==', licenseKey)
            .get();
        
        if (snapshot.empty) {
            alert('❌ Licencia no encontrada');
            return false;
        }
        
        const doc = snapshot.docs[0];
        const licencia = doc.data();
        
        const nuevoMaxDispositivos = prompt(
            `Editar licencia de: ${licencia.clientName}\n\n` +
            `Dispositivos actuales: ${licencia.maxDevices}\n\n` +
            `Ingrese el nuevo número máximo de dispositivos (1-99):`,
            licencia.maxDevices
        );
        
        if (!nuevoMaxDispositivos) return false;
        
        const numeroDispositivos = parseInt(nuevoMaxDispositivos);
        
        if (isNaN(numeroDispositivos) || numeroDispositivos < 1 || numeroDispositivos > 99) {
            alert('❌ Por favor ingrese un número válido entre 1 y 99');
            return false;
        }
        
        await doc.ref.update({
            maxDevices: numeroDispositivos,
            fechaModificacion: new Date().toISOString()
        });
        
        alert(`✅ Licencia actualizada correctamente\n\nNuevo máximo de dispositivos: ${numeroDispositivos}`);
        return true;
        
    } catch (error) {
        console.error('Error al editar licencia:', error);
        alert('❌ Error al actualizar licencia');
        return false;
    }
}

// Renovar licencia
async function renovarLicenciaFirebase(licenseKey) {
    try {
        const snapshot = await db.collection('licencias')
            .where('licenseKey', '==', licenseKey)
            .get();
        
        if (snapshot.empty) {
            alert('❌ Licencia no encontrada');
            return false;
        }
        
        const doc = snapshot.docs[0];
        const licencia = doc.data();
        
        const tipoTexto = {
            prueba: '3 días',
            mensual: '1 mes (30 días)',
            trimestral: '3 meses (90 días)',
            semestral: '6 meses (180 días)',
            anual: '1 año (365 días)',
            vitalicia: 'Sin expiración'
        };
        
        const opciones = [
            { valor: 'prueba', dias: 3 },
            { valor: 'mensual', dias: 30 },
            { valor: 'trimestral', dias: 90 },
            { valor: 'semestral', dias: 180 },
            { valor: 'anual', dias: 365 },
            { valor: 'vitalicia', dias: 0 }
        ];
        
        let mensaje = `Renovar licencia de: ${licencia.clientName}\n\nSeleccione el período de renovación:\n\n`;
        opciones.forEach((op, i) => {
            mensaje += `${i + 1}. ${tipoTexto[op.valor]}\n`;
        });
        
        const seleccion = prompt(mensaje + '\nIngrese el número (1-6):');
        
        if (!seleccion || seleccion < 1 || seleccion > 6) return false;
        
        const opcionSeleccionada = opciones[parseInt(seleccion) - 1];
        const ahora = new Date();
        
        let fechaBase = ahora;
        if (licencia.fechaExpiracion) {
            const fechaExp = new Date(licencia.fechaExpiracion);
            if (fechaExp > ahora) {
                fechaBase = fechaExp;
            }
        }
        
        let nuevaFechaExpiracion = null;
        if (opcionSeleccionada.dias > 0) {
            nuevaFechaExpiracion = new Date(fechaBase);
            nuevaFechaExpiracion.setDate(nuevaFechaExpiracion.getDate() + opcionSeleccionada.dias);
        }
        
        await doc.ref.update({
            licenseType: opcionSeleccionada.valor,
            fechaExpiracion: nuevaFechaExpiracion ? nuevaFechaExpiracion.toISOString() : null,
            fechaRenovacion: ahora.toISOString()
        });
        
        alert(`✅ Licencia renovada exitosamente\n\nNuevo período: ${tipoTexto[opcionSeleccionada.valor]}${nuevaFechaExpiracion ? '\nExpira: ' + nuevaFechaExpiracion.toLocaleDateString() : ''}`);
        return true;
        
    } catch (error) {
        console.error('Error al renovar licencia:', error);
        alert('❌ Error al renovar licencia');
        return false;
    }
}

// Suspender/Activar licencia
async function toggleSuspenderLicenciaFirebase(licenseKey) {
    try {
        const snapshot = await db.collection('licencias')
            .where('licenseKey', '==', licenseKey)
            .get();
        
        if (snapshot.empty) {
            alert('❌ Licencia no encontrada');
            return false;
        }
        
        const doc = snapshot.docs[0];
        const licencia = doc.data();
        const estaSuspendida = licencia.suspendida === true;
        
        if (estaSuspendida) {
            if (!confirm(`¿Activar la licencia de ${licencia.clientName}?\n\nEl usuario podrá volver a usar el sistema.`)) {
                return false;
            }
            await doc.ref.update({
                suspendida: false,
                fechaActivacion: new Date().toISOString()
            });
            alert('✅ Licencia activada correctamente');
        } else {
            if (!confirm(`¿Suspender la licencia de ${licencia.clientName}?\n\nEl usuario no podrá acceder al sistema hasta que sea reactivada.`)) {
                return false;
            }
            await doc.ref.update({
                suspendida: true,
                fechaSuspension: new Date().toISOString()
            });
            alert('⚠️ Licencia suspendida. El usuario no podrá acceder.');
        }
        
        return true;
        
    } catch (error) {
        console.error('Error al suspender/activar licencia:', error);
        alert('❌ Error al actualizar licencia');
        return false;
    }
}

// Eliminar licencia
async function eliminarLicenciaFirebase(licenseKey) {
    try {
        const snapshot = await db.collection('licencias')
            .where('licenseKey', '==', licenseKey)
            .get();
        
        if (snapshot.empty) {
            alert('❌ Licencia no encontrada');
            return false;
        }
        
        const doc = snapshot.docs[0];
        const licencia = doc.data();
        
        if (!confirm(`¿Está seguro de eliminar la licencia de ${licencia.clientName}?\n\nClave: ${licenseKey}\n\nEsta acción no se puede deshacer.`)) {
            return false;
        }
        
        await doc.ref.delete();
        
        alert('✅ Licencia eliminada correctamente');
        return true;
        
    } catch (error) {
        console.error('Error al eliminar licencia:', error);
        alert('❌ Error al eliminar licencia');
        return false;
    }
}
