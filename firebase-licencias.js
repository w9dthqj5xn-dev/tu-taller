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
        console.log('🗑️ Iniciando eliminación de licencia:', licenseKey);
        
        // Buscar licencia en Firebase
        const snapshot = await db.collection('licencias')
            .where('licenseKey', '==', licenseKey)
            .get();
        
        if (snapshot.empty) {
            console.log('❌ Licencia no encontrada en Firebase');
            alert('❌ Licencia no encontrada en Firebase');
            return false;
        }
        
        const doc = snapshot.docs[0];
        const licencia = doc.data();
        
        console.log('📄 Licencia encontrada:', licencia);
        
        if (!confirm(`¿Está seguro de eliminar la licencia de ${licencia.clientName}?\n\nClave: ${licenseKey}\n\nEsta acción no se puede deshacer.`)) {
            console.log('❌ Eliminación cancelada por el usuario');
            return false;
        }
        
        console.log('💥 Eliminando documento con ID:', doc.id);
        await doc.ref.delete();
        
        // IMPORTANTE: También eliminar del localStorage para evitar que vuelva a aparecer
        console.log('🧹 Limpiando licencia del localStorage...');
        const licenciasLocal = JSON.parse(localStorage.getItem('licenciasGeneradas') || '[]');
        const licenciasFiltradas = licenciasLocal.filter(lic => lic.licenseKey !== licenseKey);
        localStorage.setItem('licenciasGeneradas', JSON.stringify(licenciasFiltradas));
        console.log(`✅ Licencias en localStorage: ${licenciasLocal.length} → ${licenciasFiltradas.length}`);
        
        console.log('✅ Documento eliminado exitosamente de Firebase');
        alert('✅ Licencia eliminada correctamente');
        return true;
        
    } catch (error) {
        console.error('❌ Error al eliminar licencia:', error);
        console.error('Stack:', error.stack);
        alert(`❌ Error al eliminar licencia: ${error.message}`);
        return false;
    }
}

// ====== FUNCIONES PARA USUARIOS DE GOOGLE ======

// Suspender/Activar usuario de Google
async function toggleSuspenderUsuarioGoogle(email) {
    try {
        const snapshot = await db.collection('usuarios-google')
            .where('email', '==', email)
            .get();
        
        if (snapshot.empty) {
            alert('❌ Usuario de Google no encontrado');
            return false;
        }
        
        const doc = snapshot.docs[0];
        const usuario = doc.data();
        const estaSuspendido = usuario.suspendido === true;
        
        if (estaSuspendido) {
            if (!confirm(`¿Activar el acceso de ${usuario.nombre || usuario.email}?\n\nEl usuario podrá volver a usar el sistema con su cuenta de Google.`)) {
                return false;
            }
            await doc.ref.update({
                suspendido: false,
                fechaActivacion: new Date().toISOString()
            });
            alert('✅ Usuario activado correctamente');
        } else {
            if (!confirm(`¿Suspender el acceso de ${usuario.nombre || usuario.email}?\n\nEl usuario no podrá acceder al sistema hasta que sea reactivado.`)) {
                return false;
            }
            await doc.ref.update({
                suspendido: true,
                fechaSuspension: new Date().toISOString()
            });
            alert('⚠️ Usuario suspendido. No podrá acceder al sistema.');
        }
        
        return true;
        
    } catch (error) {
        console.error('Error al suspender/activar usuario de Google:', error);
        alert('❌ Error al actualizar usuario');
        return false;
    }
}

// Eliminar usuario de Google
async function eliminarUsuarioGoogle(email) {
    try {
        const snapshot = await db.collection('usuarios-google')
            .where('email', '==', email)
            .get();
        
        if (snapshot.empty) {
            alert('❌ Usuario de Google no encontrado');
            return false;
        }
        
        const doc = snapshot.docs[0];
        const usuario = doc.data();
        
        if (!confirm(`¿Está seguro de eliminar el usuario de Google?\n\nUsuario: ${usuario.nombre || usuario.email}\nEmail: ${email}\n\nEsta acción no se puede deshacer.`)) {
            return false;
        }
        
        await doc.ref.delete();
        
        console.log('✅ Usuario de Google eliminado de Firebase');
        alert('✅ Usuario de Google eliminado correctamente');
        return true;
        
    } catch (error) {
        console.error('Error al eliminar usuario de Google:', error);
        alert('❌ Error al eliminar usuario');
        return false;
    }
}

