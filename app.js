// === SISTEMA DE AUTENTICACIÓN ===
function verificarSesion() {
    const sesion = localStorage.getItem('sesionActiva');
    if (sesion === 'true') {
        // Verificar licencia si está activada
        if (!verificarLicenciaActiva()) {
            return;
        }
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }
}

function verificarLicenciaActiva() {
    const licenciaActiva = localStorage.getItem('licenciaActiva');
    if (!licenciaActiva) return true; // Si no hay licencia configurada, permitir acceso normal
    
    const licencia = JSON.parse(licenciaActiva);
    
    // Verificar si la licencia está suspendida
    if (licencia.suspendida === true) {
        alert('⚠️ Tu licencia ha sido suspendida. Por favor, contacta al administrador para más información.');
        cerrarSesion();
        return false;
    }
    
    // Verificar si la licencia ha expirado
    if (licencia.fechaExpiracion) {
        const ahora = new Date();
        const expiracion = new Date(licencia.fechaExpiracion);
        
        if (ahora > expiracion) {
            alert('❌ Tu licencia ha expirado. Por favor, renueva tu licencia para continuar usando el sistema.');
            cerrarSesion();
            return false;
        }
    }
    
    return true;
}

// Función para formatear números: sin decimales y con separador de miles
function formatearMonto(numero) {
    return Math.round(numero).toLocaleString('es-CO'); // Formato: 2.000 (sin decimales)
}

// Funciones para formatear fechas y horas usando la configuración regional del navegador
function formatearFecha(fecha) {
    // Convierte cualquier fecha a formato local del navegador
    const date = new Date(fecha);
    return date.toLocaleDateString(navigator.language || 'es', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatearFechaHora(fecha) {
    // Convierte fecha y hora a formato local del navegador
    const date = new Date(fecha);
    return date.toLocaleString(navigator.language || 'es', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatearHora(fecha) {
    // Convierte solo la hora a formato local del navegador
    const date = new Date(fecha);
    return date.toLocaleTimeString(navigator.language || 'es', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para mostrar notificaciones al usuario
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Tipos: 'success', 'error', 'warning', 'info'
    const colores = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colores[tipo] || colores.info};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;
    notif.textContent = mensaje;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

// Exportar funciones básicas inmediatamente
window.verificarSesion = verificarSesion;
window.verificarLicenciaActiva = verificarLicenciaActiva;
window.formatearMonto = formatearMonto;
window.mostrarNotificacion = mostrarNotificacion;

// === GOOGLE SIGN-IN ===
async function signInWithGoogle() {
    try {
        console.log('🔍 Iniciando Google Sign-In...');
        
        // Verificar si Firebase está disponible
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase no está cargado. Recarga la página.');
        }
        
        // Verificar si Firebase Auth está disponible
        if (!firebase.auth) {
            throw new Error('Firebase Auth no está cargado correctamente');
        }
        
        console.log('✅ Firebase disponible');
        console.log('✅ Auth disponible:', auth);
        console.log('✅ Google Provider:', googleProvider);

        // Verificar si el proveedor de Google está configurado
        if (!googleProvider) {
            throw new Error('Google Provider no está configurado. Verifica firebase-config.js');
        }

        // Mostrar loading
        const btn = document.querySelector('.google-signin-btn');
        if (!btn) {
            throw new Error('Botón de Google no encontrado');
        }
        
        const originalText = btn.innerHTML;
        btn.innerHTML = '<div style="width: 20px; height: 20px; border: 2px solid #ddd; border-top: 2px solid #666; border-radius: 50%; animation: spin 1s linear infinite;"></div> Conectando...';
        btn.disabled = true;

        console.log('🚀 Abriendo popup de Google...');
        
        // Autenticar con Google
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        console.log('✅ Usuario autenticado con Google:', user.displayName);

        // Crear datos del usuario
        const userData = {
            uid: user.uid,
            email: user.email,
            nombre: user.displayName,
            foto: user.photoURL,
            proveedor: 'google',
            fechaRegistro: new Date().toISOString(),
            ultimoAcceso: new Date().toISOString()
        };

        // Verificar si el usuario ya existe en nuestra base de datos
        let existeUsuario = false;
        try {
            const userDoc = await db.collection('usuarios-google').doc(user.uid).get();
            existeUsuario = userDoc.exists;
        } catch (error) {
            console.log('Primer acceso del usuario');
        }

        // Si es nuevo usuario, guardarlo
        if (!existeUsuario) {
            try {
                await db.collection('usuarios-google').doc(user.uid).set(userData);
                console.log('✅ Usuario registrado en Firebase');
                
                // IMPORTANTE: Inicializar estructura de datos en Firebase para el nuevo usuario
                console.log('🔧 Inicializando estructura de datos en Firebase para:', user.email);
                const userDataRef = db.collection('usuarios-data').doc(user.email);
                await userDataRef.set({
                    usuario: user.email,
                    nombreTaller: user.displayName || user.email.split('@')[0],
                    ultimaActualizacion: new Date().toISOString(),
                    version: '2.0',
                    fechaCreacion: new Date().toISOString(),
                    proveedor: 'google'
                });
                
                // Crear subcollections vacías
                await userDataRef.collection('clientes').doc('_init').set({ init: true });
                await userDataRef.collection('ordenes').doc('_init').set({ init: true });
                await userDataRef.collection('repuestos').doc('_init').set({ init: true });
                
                // Eliminar documentos de inicialización
                await userDataRef.collection('clientes').doc('_init').delete();
                await userDataRef.collection('ordenes').doc('_init').delete();
                await userDataRef.collection('repuestos').doc('_init').delete();
                
                console.log('✅ Estructura de datos inicializada en Firebase para nuevo usuario Google');
                
                // Limpiar datos de cualquier sesión anterior
                Storage.clear();
                
                // Inicializar datos locales vacíos
                Storage.set('clientes', []);
                Storage.set('ordenes', []);
                Storage.set('repuestos', []);
                
            } catch (error) {
                console.warn('No se pudo guardar en Firebase (modo offline):', error);
            }
        } else {
            // Actualizar último acceso
            try {
                await db.collection('usuarios-google').doc(user.uid).update({
                    ultimoAcceso: new Date().toISOString()
                });
            } catch (error) {
                console.warn('No se pudo actualizar en Firebase (modo offline):', error);
            }
        }

        // Guardar sesión localmente
        localStorage.setItem('sesionActiva', 'true');
        localStorage.setItem('usuarioGoogle', JSON.stringify(userData));
        localStorage.setItem('tipoLogin', 'google');
        // Importante: guardar el email como usuario para sincronización
        localStorage.setItem('usuario', user.email);
        localStorage.setItem('nombreTaller', user.displayName || user.email.split('@')[0]);
        
        // Cargar datos desde Firebase
        console.log('🔄 Cargando datos de Firebase para:', user.email);
        await cargarDatosUsuario(user.email);

        // Verificar licencia
        if (!verificarLicenciaActiva()) {
            return;
        }

        // Mostrar mensaje de bienvenida
        mostrarMensaje(`¡Bienvenido/a ${user.displayName}! 🎉`, 'success');
        
        // Mostrar información de la licencia al iniciar sesión
        setTimeout(() => mostrarInfoLicencia(), 1500);

        // Cambiar a la aplicación principal
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';

        // Restaurar botón
        btn.innerHTML = originalText;
        btn.disabled = false;

    } catch (error) {
        console.error('Error en Google Sign-In:', error);
        console.error('Código del error:', error.code);
        console.error('Mensaje del error:', error.message);
        
        let mensaje = '❌ Error al iniciar sesión con Google';
        let detalles = '';
        
        if (error.code === 'auth/popup-closed-by-user') {
            mensaje = '⚠️ Ventana cerrada. Intenta nuevamente.';
        } else if (error.code === 'auth/popup-blocked') {
            mensaje = '🚫 Pop-up bloqueado. Permite pop-ups para este sitio.';
        } else if (error.code === 'auth/operation-not-allowed') {
            mensaje = '🔧 Google Sign-In no está configurado';
            detalles = 'El administrador debe habilitar Google Authentication en Firebase Console';
        } else if (error.code === 'auth/unauthorized-domain') {
            mensaje = '🌐 Dominio no autorizado';
            detalles = 'El dominio tu-taller.netlify.app debe agregarse a dominios autorizados en Firebase';
        } else if (error.code === 'auth/configuration-not-found') {
            mensaje = '⚙️ Configuración faltante';
            detalles = 'Falta configurar OAuth en Google Cloud Console';
        } else {
            mensaje = `❌ Error: ${error.message}`;
            detalles = `Código: ${error.code}`;
        }
        
        // Mostrar error detallado en consola para debugging
        console.log('🔍 Para solucionar:');
        console.log('1. Ve a https://console.firebase.google.com');
        console.log('2. Selecciona tu proyecto licencias-taller');
        console.log('3. Ve a Authentication > Sign-in method');
        console.log('4. Habilita Google como proveedor');
        console.log('5. Agrega tu-taller.netlify.app a dominios autorizados');
        
        mostrarMensaje(mensaje + (detalles ? `\n${detalles}` : ''), 'error');

        // Mostrar instrucciones de configuración si es un error de configuración
        if (error.code === 'auth/operation-not-allowed' || 
            error.code === 'auth/unauthorized-domain' || 
            error.code === 'auth/configuration-not-found') {
            const helpDiv = document.getElementById('google-config-help');
            if (helpDiv) {
                helpDiv.style.display = 'block';
            }
        }

        // Restaurar botón
        const btn = document.querySelector('.google-signin-btn');
        if (btn) {
            btn.innerHTML = '<img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" width="20" height="20"> Continuar con Google';
            btn.disabled = false;
        }
    }
}

// Exportar signInWithGoogle inmediatamente
window.signInWithGoogle = signInWithGoogle;

document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();
    
    // Agregar estilos para el loading spinner
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
});

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        font-size: 15px;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        animation: slideInRight 0.3s ease;
        background: ${tipo === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 
                    tipo === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 
                    'linear-gradient(135deg, #3b82f6, #1d4ed8)'};
    `;
    toast.textContent = mensaje;
    
    // Agregar animación CSS si no existe
    if (!document.querySelector('#toast-animations')) {
        const toastStyle = document.createElement('style');
        toastStyle.id = 'toast-animations';
        toastStyle.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(toastStyle);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Función de prueba para verificar configuración de Firebase
function testFirebaseConfig() {
    console.log('🔍 Probando configuración de Firebase...');
    
    const tests = {
        firebase: !!window.firebase,
        auth: !!window.firebase?.auth,
        firestore: !!window.firebase?.firestore,
        googleProvider: !!window.googleProvider,
        projectId: firebase.app().options.projectId,
        authDomain: firebase.app().options.authDomain
    };
    
    console.table(tests);
    
    let mensaje = '🔍 Prueba de configuración:\n';
    mensaje += `✅ Firebase: ${tests.firebase ? 'OK' : 'FALLO'}\n`;
    mensaje += `✅ Auth: ${tests.auth ? 'OK' : 'FALLO'}\n`;
    mensaje += `✅ Firestore: ${tests.firestore ? 'OK' : 'FALLO'}\n`;
    mensaje += `✅ Google Provider: ${tests.googleProvider ? 'OK' : 'FALLO'}\n`;
    mensaje += `📱 Proyecto: ${tests.projectId}\n`;
    mensaje += `🌐 Dominio: ${tests.authDomain}`;
    
    alert(mensaje);
    
    // También probar conexión a Firestore
    if (tests.firestore) {
        db.collection('test').limit(1).get()
            .then(() => {
                console.log('✅ Conexión a Firestore exitosa');
                mostrarMensaje('✅ Conexión a Firebase exitosa', 'success');
            })
            .catch((error) => {
                console.error('❌ Error de conexión a Firestore:', error);
                mostrarMensaje('❌ Error de conexión a Firebase', 'error');
            });
    }
}

// Exportar testFirebaseConfig inmediatamente
window.testFirebaseConfig = testFirebaseConfig;

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log('🔐 Intentando iniciar sesión con usuario:', username);
    
    try {
        // Buscar usuario en Firebase Firestore
        console.log('📡 Consultando Firebase...');
        const snapshot = await db.collection('usuarios')
            .where('usuario', '==', username)
            .get();
        
        console.log('📊 Resultados de Firebase:', snapshot.size, 'documentos encontrados');
        
        let usuarioEncontrado = null;
        if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();
            console.log('👤 Usuario encontrado:', userData.usuario);
            // Verificar contraseña
            if (userData.password === password) {
                usuarioEncontrado = userData;
                console.log('✅ Contraseña correcta');
            } else {
                console.log('❌ Contraseña incorrecta');
            }
        } else {
            console.log('⚠️ No se encontró usuario en Firebase');
        }
        
        // También permitir credenciales admin por defecto
        const esAdmin = (username === 'admin' && password === 'admin123');
        if (esAdmin) {
            console.log('🔑 Login como admin por defecto');
        }
        
        if (usuarioEncontrado || esAdmin) {
            const nombreTaller = usuarioEncontrado ? (usuarioEncontrado.nombreTaller || 'Taller de Reparaciones') : 'Taller de Reparaciones';
            
            console.log('🎉 Login exitoso! Taller:', nombreTaller);
            
            // IMPORTANTE: Limpiar datos de cualquier usuario anterior
            console.log('🧹 Limpiando datos de sesión anterior...');
            Storage.clear();
            
            localStorage.setItem('sesionActiva', 'true');
            localStorage.setItem('usuario', username);
            localStorage.setItem('nombreTaller', nombreTaller);
            localStorage.setItem('usuarioActual', username); // Para identificar la configuración
            localStorage.setItem('ultimoUsuarioLogin', username); // Backup para configuración
            
            // Cargar datos desde Firebase
            console.log('📥 Cargando datos del usuario...');
            const cargaExitosa = await cargarDatosUsuario(username);
            
            if (cargaExitosa) {
                console.log('✅ Datos cargados correctamente');
            } else {
                console.warn('⚠️ Advertencia: No se pudieron cargar todos los datos');
            }
            
            console.log('🚀 Mostrando aplicación principal');
            
            // Verificar licencia
            if (!verificarLicenciaActiva()) {
                return;
            }
            
            // Mostrar información de la licencia al iniciar sesión
            setTimeout(() => mostrarInfoLicencia(), 1000);
            
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            actualizarDashboard();
        } else {
            console.log('❌ Credenciales incorrectas');
            alert('❌ Usuario o contraseña incorrectos');
            document.getElementById('loginPassword').value = '';
        }
    } catch (error) {
        console.error('💥 Error al iniciar sesión:', error);
        console.error('Stack:', error.stack);
        alert(`❌ Error al verificar credenciales: ${error.message}\nRevisa la consola para más detalles.`);
    }
});

// Función para cargar datos del usuario desde Firebase
async function cargarDatosUsuario(usuario) {
    try {
        console.log('🔄 Cargando datos desde Firebase para:', usuario);
        
        // Intentar cargar desde Firebase
        let clientes = [];
        let ordenes = [];
        let repuestos = [];
        
        try {
            clientes = await Storage.loadFromFirebase(usuario, 'clientes') || [];
            ordenes = await Storage.loadFromFirebase(usuario, 'ordenes') || [];
            repuestos = await Storage.loadFromFirebase(usuario, 'repuestos') || [];
            
            console.log(`✅ Datos cargados desde Firebase:`, {
                clientes: clientes.length,
                ordenes: ordenes.length,
                repuestos: repuestos.length
            });
        } catch (firebaseError) {
            console.warn('⚠️ Error al cargar desde Firebase, intentando con datos locales:', firebaseError.message);
            
            // Fallback: Usar datos locales si existen
            clientes = Storage.get('clientes') || [];
            ordenes = Storage.get('ordenes') || [];
            repuestos = Storage.get('repuestos') || [];
            
            console.log(`📦 Usando datos locales como fallback:`, {
                clientes: clientes.length,
                ordenes: ordenes.length,
                repuestos: repuestos.length
            });
        }
        
        // Siempre actualizar localStorage con los datos cargados
        Storage.set('clientes', clientes);
        Storage.set('ordenes', ordenes);
        Storage.set('repuestos', repuestos);
        
        console.log(`💾 Datos guardados en localStorage para sesión actual`);
        
        // Mostrar notificación al usuario
        const totalRegistros = clientes.length + ordenes.length + repuestos.length;
        if (totalRegistros > 0) {
            mostrarNotificacion(
                `✅ Sincronizado: ${clientes.length} clientes, ${ordenes.length} órdenes, ${repuestos.length} repuestos`, 
                'success'
            );
        } else {
            // Usuario nuevo o sin datos
            mostrarNotificacion(
                `🎉 ¡Cuenta lista! Tus datos se sincronizarán automáticamente en todos tus dispositivos`, 
                'info'
            );
        }
        
        return true;
    } catch (error) {
        console.error('💥 Error crítico al cargar datos del usuario:', error);
        console.error('Stack:', error.stack);
        
        // Último recurso: cargar del localStorage
        try {
            const clientesLocal = Storage.get('clientes') || [];
            const ordenesLocal = Storage.get('ordenes') || [];
            const repuestosLocal = Storage.get('repuestos') || [];
            
            console.log('📦 Usando datos del localStorage como último recurso');
            
            mostrarNotificacion(
                `⚠️ Usando datos locales. Verifica tu conexión a internet.`, 
                'warning'
            );
            return true;
        } catch (fallbackError) {
            console.error('❌ Error crítico: no hay datos disponibles', fallbackError);
            mostrarNotificacion('❌ No se pudieron cargar tus datos. Por favor intenta de nuevo.', 'error');
            return false;
        }
    }
}

// === SISTEMA DE LICENCIAS ===
function mostrarActivacionLicencia() {
    document.querySelector('.login-container:not(#modalLicencia)').style.display = 'none';
    document.getElementById('modalLicencia').style.display = 'block';
}

function ocultarActivacionLicencia() {
    document.querySelector('.login-container:not(#modalLicencia)').style.display = 'block';
    document.getElementById('modalLicencia').style.display = 'none';
    document.getElementById('licenseKey').value = '';
    document.getElementById('licenseError').style.display = 'none';
    document.getElementById('licenseSuccess').style.display = 'none';
}

async function activarLicencia(event) {
    event.preventDefault();
    
    const claveIngresada = document.getElementById('licenseKey').value.trim().toUpperCase();
    const errorDiv = document.getElementById('licenseError');
    const successDiv = document.getElementById('licenseSuccess');
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Validar formato de licencia TT-XXX-...-...-...
    const formatoValido = /^TT-[A-Z0-9]{3}-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/;
    if (!formatoValido.test(claveIngresada)) {
        errorDiv.textContent = '❌ Formato de licencia inválido. Por favor verifica la clave ingresada.';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Buscar licencia en Firebase
    try {
        const snapshot = await db.collection('licencias')
            .where('licenseKey', '==', claveIngresada)
            .get();
        
        let licenciaEncontrada = null;
        
        if (!snapshot.empty) {
            licenciaEncontrada = snapshot.docs[0].data();
        }
        
        // Si no se encuentra en Firebase, crear licencia básica desde el código
        if (!licenciaEncontrada) {
        // Extraer tipo de licencia del código (segunda parte)
        const partes = claveIngresada.split('-');
        const codigoTipo = partes[1];
        
        // Determinar tipo de licencia basado en el código
        let licenseType = 'mensual';
        let dias = 30;
        
        if (codigoTipo.startsWith('PRU')) {
            licenseType = 'prueba';
            dias = 3;
        } else if (codigoTipo.startsWith('MEN')) {
            licenseType = 'mensual';
            dias = 30;
        } else if (codigoTipo.startsWith('TRI')) {
            licenseType = 'trimestral';
            dias = 90;
        } else if (codigoTipo.startsWith('SEM')) {
            licenseType = 'semestral';
            dias = 180;
        } else if (codigoTipo.startsWith('ANU')) {
            licenseType = 'anual';
            dias = 365;
        } else if (codigoTipo.startsWith('VIT')) {
            licenseType = 'vitalicia';
            dias = 0;
        }
        
        // Crear licencia temporal
        const ahora = new Date();
        let fechaExpiracion = null;
        if (dias > 0) {
            fechaExpiracion = new Date();
            fechaExpiracion.setDate(ahora.getDate() + dias);
        }
        
        licenciaEncontrada = {
            licenseKey: claveIngresada,
            clientName: 'Cliente',
            clientEmail: '',
            licenseType: licenseType,
            maxDevices: 1,
            fechaCreacion: ahora.toISOString(),
            fechaExpiracion: fechaExpiracion ? fechaExpiracion.toISOString() : null,
            activa: true
            };
        }
        
        // Verificar si la licencia ha expirado
    if (licenciaEncontrada.fechaExpiracion) {
        const ahora = new Date();
        const expiracion = new Date(licenciaEncontrada.fechaExpiracion);
        
        if (ahora > expiracion) {
            errorDiv.textContent = '❌ Esta licencia ha expirado. Por favor contacta al administrador.';
            errorDiv.style.display = 'block';
            return;
        }
    }
    
    // Verificar si está suspendida
    if (licenciaEncontrada.suspendida === true) {
        errorDiv.textContent = '⚠️ Esta licencia está suspendida. Contacta al administrador.';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Verificar si ya existe un usuario registrado con esta licencia EN ESTE DISPOSITIVO
    const usuariosRegistrados = JSON.parse(localStorage.getItem('usuariosRegistrados') || '[]');
    const usuarioExistente = usuariosRegistrados.find(u => u.licenseKey === claveIngresada);
    
    if (usuarioExistente) {
        // Si ya existe usuario en este dispositivo, permitir login directo
        successDiv.innerHTML = `
            ✅ Esta licencia ya está activada en este dispositivo<br>
            <strong>Usuario:</strong> ${usuarioExistente.usuario}<br>
            Puedes iniciar sesión con tus credenciales
        `;
        successDiv.style.display = 'block';
        
        setTimeout(() => {
            ocultarActivacionLicencia();
        }, 3000);
        return;
    }
    
    // Activar la licencia y guardar temporalmente
    localStorage.setItem('licenciaActiva', JSON.stringify(licenciaEncontrada));
    localStorage.setItem('licenciaTemporal', JSON.stringify(licenciaEncontrada));
    
    // Mostrar modal de registro de usuario
    document.getElementById('modalLicencia').style.display = 'none';
    document.getElementById('modalRegistro').style.display = 'block';
    
        // Pre-llenar el nombre del taller
        document.getElementById('regNombreTaller').value = licenciaEncontrada.clientName;
        
    } catch (error) {
        console.error('Error al validar licencia:', error);
        errorDiv.textContent = '❌ Error al validar la licencia. Por favor intenta de nuevo.';
        errorDiv.style.display = 'block';
    }
}

async function registrarUsuario(event) {
    event.preventDefault();
    
    const nombreTaller = document.getElementById('regNombreTaller').value.trim();
    const usuario = document.getElementById('regUsuario').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const errorDiv = document.getElementById('registroError');
    
    errorDiv.style.display = 'none';
    
    // Validaciones
    if (usuario.length < 4) {
        errorDiv.textContent = '❌ El usuario debe tener al menos 4 caracteres';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (password.length < 6) {
        errorDiv.textContent = '❌ La contraseña debe tener al menos 6 caracteres';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (password !== passwordConfirm) {
        errorDiv.textContent = '❌ Las contraseñas no coinciden';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Obtener licencia temporal
    const licenciaTemporal = JSON.parse(localStorage.getItem('licenciaTemporal'));
    
    if (!licenciaTemporal) {
        errorDiv.textContent = '❌ Error: No se encontró la licencia. Por favor intenta de nuevo.';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        // Verificar si el usuario ya existe en Firebase
        const snapshot = await db.collection('usuarios')
            .where('usuario', '==', usuario)
            .get();
        
        if (!snapshot.empty) {
            errorDiv.textContent = '❌ Este nombre de usuario ya está en uso. Elige otro.';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Crear nuevo usuario vinculado a la licencia
        const nuevoUsuario = {
            id: Date.now(),
            nombreTaller,
            usuario,
            password,
            email: licenciaTemporal.clientEmail || '',
            licenseKey: licenciaTemporal.licenseKey,
            fechaRegistro: new Date().toISOString(),
            fechaCreacion: new Date().toISOString(),
            licencia: licenciaTemporal,
            estado: 'activo'
        };
        
        // Guardar en Firebase
        await db.collection('usuarios').add(nuevoUsuario);
        
        // IMPORTANTE: Inicializar estructura de datos en Firebase para el nuevo usuario
        console.log('🔧 Inicializando estructura de datos en Firebase para:', usuario);
        const userDataRef = db.collection('usuarios-data').doc(usuario);
        await userDataRef.set({
            usuario: usuario,
            nombreTaller: nombreTaller,
            ultimaActualizacion: new Date().toISOString(),
            version: '2.0',
            fechaCreacion: new Date().toISOString()
        });
        
        // Crear subcollections vacías (esto asegura que la estructura esté lista)
        await userDataRef.collection('clientes').doc('_init').set({ init: true });
        await userDataRef.collection('ordenes').doc('_init').set({ init: true });
        await userDataRef.collection('repuestos').doc('_init').set({ init: true });
        
        // Eliminar documentos de inicialización
        await userDataRef.collection('clientes').doc('_init').delete();
        await userDataRef.collection('ordenes').doc('_init').delete();
        await userDataRef.collection('repuestos').doc('_init').delete();
        
        console.log('✅ Estructura de datos inicializada en Firebase');
        
        localStorage.removeItem('licenciaTemporal');
        
        // Iniciar sesión automáticamente
        localStorage.setItem('sesionActiva', 'true');
        localStorage.setItem('usuario', usuario);
        localStorage.setItem('nombreTaller', nombreTaller);
        
        // Inicializar datos locales vacíos
        Storage.set('clientes', []);
        Storage.set('ordenes', []);
        Storage.set('repuestos', []);
        
        console.log('✅ Datos locales inicializados');
        
        // Ocultar modal y mostrar app
        document.getElementById('modalRegistro').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        mostrarNotificacion(`✅ ¡Bienvenido ${nombreTaller}! Tu cuenta ha sido creada con sincronización automática en la nube`, 'success');
        actualizarDashboard();
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        errorDiv.textContent = '❌ Error al crear la cuenta. Por favor intenta de nuevo.';
        errorDiv.style.display = 'block';
    }
}

// Exportar funciones de licencias inmediatamente
window.mostrarActivacionLicencia = mostrarActivacionLicencia;
window.ocultarActivacionLicencia = ocultarActivacionLicencia;
window.activarLicencia = activarLicencia;
window.registrarUsuario = registrarUsuario;

function mostrarInfoLicencia() {
    const licenciaActiva = localStorage.getItem('licenciaActiva');
    if (!licenciaActiva) return;
    
    const licencia = JSON.parse(licenciaActiva);
    
    let texto = '';
    let tipo = 'success';
    
    // Verificar si es licencia vitalicia
    if (licencia.licenseType === 'vitalicia') {
        texto = `♾️ Licencia Vitalicia - Sin expiración`;
    } else {
        texto = `🔐 Licencia: ${licencia.licenseType}`;
        if (licencia.fechaExpiracion) {
            const diasRestantes = Math.ceil((new Date(licencia.fechaExpiracion) - new Date()) / (1000 * 60 * 60 * 24));
            texto += ` (${diasRestantes} días restantes)`;
            
            // Cambiar color según días restantes
            if (diasRestantes <= 3) {
                tipo = 'error';
            } else if (diasRestantes <= 7) {
                tipo = 'info';
            }
        }
    }
    
    // Mostrar como mensaje temporal en lugar de indicador permanente
    mostrarMensaje(texto, tipo);
}

function cerrarSesion() {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
        // Limpiar TODOS los datos para evitar mezcla entre usuarios
        console.log('🧹 Limpiando datos de sesión...');
        Storage.clear();
        
        // Remover datos locales
        localStorage.removeItem('sesionActiva');
        localStorage.removeItem('usuario');
        localStorage.removeItem('usuarioGoogle');
        localStorage.removeItem('tipoLogin');
        localStorage.removeItem('nombreTaller');
        
        // Cerrar sesión de Google si es necesario
        const tipoLogin = localStorage.getItem('tipoLogin');
        if (tipoLogin === 'google' && auth.currentUser) {
            auth.signOut().then(() => {
                console.log('✅ Sesión de Google cerrada');
            }).catch((error) => {
                console.error('Error al cerrar sesión de Google:', error);
            });
        }
        
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('loginForm').reset();
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        location.reload();
    }
}

function exportarDatos() {
    try {
        const usuario = localStorage.getItem('usuario');
        const nombreTaller = localStorage.getItem('nombreTaller');
        
        // Obtener todos los datos del usuario
        const clientes = Storage.get('clientes');
        const ordenes = Storage.get('ordenes');
        const repuestos = Storage.get('repuestos');
        
        const datosExportar = {
            usuario: usuario,
            nombreTaller: nombreTaller,
            fechaExportacion: new Date().toISOString(),
            clientes: clientes,
            ordenes: ordenes,
            repuestos: repuestos,
            version: '1.0' // Versión del formato de backup
        };
        
        // Crear archivo JSON y descargarlo
        const jsonStr = JSON.stringify(datosExportar, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${usuario}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(`✅ Datos exportados exitosamente\n\nClientes: ${clientes.length}\nÓrdenes: ${ordenes.length}\nRepuestos: ${repuestos.length}\n\nArchivo: backup_${usuario}_${Date.now()}.json`);
        
    } catch (error) {
        console.error('Error al exportar datos:', error);
        alert('❌ Error al exportar datos');
    }
}

// Función para importar datos desde un archivo de backup
function importarDatos() {
    // Crear input file
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            // Leer archivo
            const texto = await file.text();
            const datosImportados = JSON.parse(texto);
            
            // Validar estructura del backup
            if (!datosImportados.clientes || !datosImportados.ordenes || !datosImportados.repuestos) {
                throw new Error('Formato de backup inválido. Falta información de clientes, órdenes o repuestos.');
            }
            
            // Mostrar resumen y confirmar
            const mensaje = `📦 Backup encontrado:\n\n` +
                `Usuario: ${datosImportados.usuario || 'No especificado'}\n` +
                `Taller: ${datosImportados.nombreTaller || 'No especificado'}\n` +
                `Fecha exportación: ${datosImportados.fechaExportacion ? formatearFechaHora(datosImportados.fechaExportacion) : 'No especificada'}\n\n` +
                `Clientes: ${datosImportados.clientes.length}\n` +
                `Órdenes: ${datosImportados.ordenes.length}\n` +
                `Repuestos: ${datosImportados.repuestos.length}\n\n` +
                `¿Cómo deseas importar los datos?`;
            
            // Preguntar modo de importación
            const opciones = [
                '🔄 COMBINAR - Agregar datos nuevos y mantener los existentes',
                '⚠️ SOBRESCRIBIR - Reemplazar todos los datos actuales',
                '❌ Cancelar'
            ];
            
            const seleccion = prompt(mensaje + '\n\n' + opciones.map((o, i) => `${i + 1}. ${o}`).join('\n') + '\n\nIngresa el número de opción (1-3):');
            
            if (!seleccion || seleccion === '3') {
                alert('❌ Importación cancelada');
                return;
            }
            
            const modo = seleccion === '1' ? 'merge' : seleccion === '2' ? 'overwrite' : null;
            
            if (!modo) {
                alert('❌ Opción inválida. Importación cancelada.');
                return;
            }
            
            // Confirmar acción
            if (modo === 'overwrite') {
                const confirmar = confirm('⚠️ ADVERTENCIA: Esto eliminará TODOS tus datos actuales y los reemplazará con los del backup.\n\n¿Estás seguro de continuar?');
                if (!confirmar) {
                    alert('❌ Importación cancelada');
                    return;
                }
            }
            
            // Realizar importación
            await realizarImportacion(datosImportados, modo);
            
        } catch (error) {
            console.error('Error al importar datos:', error);
            alert(`❌ Error al importar datos:\n\n${error.message}`);
        }
    };
    
    input.click();
}

// Función auxiliar para realizar la importación
async function realizarImportacion(datosImportados, modo) {
    try {
        const usuario = localStorage.getItem('usuario');
        
        let clientesActuales = Storage.get('clientes');
        let ordenesActuales = Storage.get('ordenes');
        let repuestosActuales = Storage.get('repuestos');
        
        let clientesNuevos, ordenesNuevos, repuestosNuevos;
        let stats = { clientesAgregados: 0, ordenesAgregadas: 0, repuestosAgregados: 0 };
        
        if (modo === 'overwrite') {
            // Modo sobrescribir: reemplazar todo
            clientesNuevos = datosImportados.clientes;
            ordenesNuevos = datosImportados.ordenes;
            repuestosNuevos = datosImportados.repuestos;
            
            stats.clientesAgregados = clientesNuevos.length;
            stats.ordenesAgregadas = ordenesNuevos.length;
            stats.repuestosAgregados = repuestosNuevos.length;
            
        } else {
            // Modo merge: combinar datos
            // Encontrar IDs máximos actuales
            const maxClienteId = clientesActuales.length > 0 ? Math.max(...clientesActuales.map(c => c.id)) : 0;
            const maxOrdenId = ordenesActuales.length > 0 ? Math.max(...ordenesActuales.map(o => o.id)) : 0;
            const maxRepuestoId = repuestosActuales.length > 0 ? Math.max(...repuestosActuales.map(r => r.id)) : 0;
            
            // Mapear IDs antiguos a nuevos para evitar conflictos
            const clienteIdMap = new Map();
            const repuestoIdMap = new Map();
            
            // Importar clientes (evitar duplicados por celular)
            const celularesExistentes = new Set(clientesActuales.map(c => c.celular));
            clientesNuevos = [...clientesActuales];
            let nuevoClienteId = maxClienteId + 1;
            
            datosImportados.clientes.forEach(cliente => {
                if (!celularesExistentes.has(cliente.celular)) {
                    const clienteNuevo = { ...cliente, id: nuevoClienteId };
                    clienteIdMap.set(cliente.id, nuevoClienteId);
                    clientesNuevos.push(clienteNuevo);
                    stats.clientesAgregados++;
                    nuevoClienteId++;
                } else {
                    // Mapear al cliente existente
                    const clienteExistente = clientesActuales.find(c => c.celular === cliente.celular);
                    clienteIdMap.set(cliente.id, clienteExistente.id);
                }
            });
            
            // Importar repuestos (evitar duplicados por código)
            const codigosExistentes = new Set(repuestosActuales.map(r => r.codigo));
            repuestosNuevos = [...repuestosActuales];
            let nuevoRepuestoId = maxRepuestoId + 1;
            
            datosImportados.repuestos.forEach(repuesto => {
                if (!codigosExistentes.has(repuesto.codigo)) {
                    const repuestoNuevo = { ...repuesto, id: nuevoRepuestoId };
                    repuestoIdMap.set(repuesto.id, nuevoRepuestoId);
                    repuestosNuevos.push(repuestoNuevo);
                    stats.repuestosAgregados++;
                    nuevoRepuestoId++;
                } else {
                    // Mapear al repuesto existente
                    const repuestoExistente = repuestosActuales.find(r => r.codigo === repuesto.codigo);
                    repuestoIdMap.set(repuesto.id, repuestoExistente.id);
                }
            });
            
            // Importar órdenes (actualizar referencias a clientes y repuestos)
            ordenesNuevos = [...ordenesActuales];
            let nuevoOrdenId = maxOrdenId + 1;
            
            datosImportados.ordenes.forEach(orden => {
                const ordenNueva = { 
                    ...orden, 
                    id: nuevoOrdenId,
                    numero: generarNumeroOrden(), // Generar nuevo número único
                    clienteId: clienteIdMap.get(orden.clienteId) || orden.clienteId,
                    repuestos: orden.repuestos.map(r => ({
                        ...r,
                        id: repuestoIdMap.get(r.id) || r.id
                    }))
                };
                ordenesNuevos.push(ordenNueva);
                stats.ordenesAgregadas++;
                nuevoOrdenId++;
            });
        }
        
        // Guardar en localStorage
        Storage.set('clientes', clientesNuevos);
        Storage.set('ordenes', ordenesNuevos);
        Storage.set('repuestos', repuestosNuevos);
        
        // SIEMPRE sincronizar con Firebase después de importar
        const sesionActiva = localStorage.getItem('sesionActiva');
        let firebaseSyncSuccess = false;
        
        if (sesionActiva === 'true') {
            try {
                console.log('📤 Subiendo datos importados a Firebase...');
                await sincronizarConFirebase();
                firebaseSyncSuccess = true;
                console.log('✅ Datos importados y sincronizados con Firebase exitosamente');
            } catch (error) {
                console.error('⚠️ Error al sincronizar con Firebase:', error);
                // Continuar aunque falle Firebase (datos ya están en localStorage)
            }
        }
        
        // Recargar vistas
        if (typeof cargarClientes === 'function') cargarClientes();
        if (typeof cargarOrdenes === 'function') cargarOrdenes();
        if (typeof cargarInventario === 'function') cargarInventario();
        if (typeof cargarDashboard === 'function') cargarDashboard();
        
        // Mostrar resultado con info de Firebase
        const resultadoBase = modo === 'overwrite'
            ? `✅ Datos importados exitosamente (SOBRESCRIBIR)\n\n` +
              `Clientes: ${stats.clientesAgregados}\n` +
              `Órdenes: ${stats.ordenesAgregadas}\n` +
              `Repuestos: ${stats.repuestosAgregados}`
            : `✅ Datos importados exitosamente (COMBINAR)\n\n` +
              `Nuevos clientes: ${stats.clientesAgregados}\n` +
              `Nuevas órdenes: ${stats.ordenesAgregadas}\n` +
              `Nuevos repuestos: ${stats.repuestosAgregados}\n\n` +
              `Total clientes: ${clientesNuevos.length}\n` +
              `Total órdenes: ${ordenesNuevos.length}\n` +
              `Total repuestos: ${repuestosNuevos.length}`;
        
        const resultadoFirebase = firebaseSyncSuccess 
            ? '\n\n🔥 FIREBASE: Datos subidos correctamente\n✅ Sincronizado en la nube'
            : '\n\n⚠️ FIREBASE: No se pudo sincronizar\n(Los datos están guardados localmente)';
        
        alert(resultadoBase + resultadoFirebase);
        
    } catch (error) {
        console.error('Error en realizarImportacion:', error);
        throw error;
    }
}

// Función para sincronizar datos locales con Firebase
async function sincronizarConFirebase() {
    try {
        const usuario = localStorage.getItem('usuario');
        if (!usuario) {
            throw new Error('No hay usuario autenticado');
        }
        
        // Verificar si Firebase está disponible
        if (typeof db === 'undefined') {
            throw new Error('Firebase no está inicializado');
        }
        
        const clientes = Storage.get('clientes') || [];
        const ordenes = Storage.get('ordenes') || [];
        const repuestos = Storage.get('repuestos') || [];
        
        console.log('🔄 Sincronizando con Firebase...', {
            usuario: usuario,
            clientes: clientes.length,
            ordenes: ordenes.length,
            repuestos: repuestos.length
        });
        
        // Usar Storage.syncToFirebase para mantener consistencia con subcollections
        const resultadoClientes = await Storage.syncToFirebase(usuario, 'clientes', clientes);
        const resultadoOrdenes = await Storage.syncToFirebase(usuario, 'ordenes', ordenes);
        const resultadoRepuestos = await Storage.syncToFirebase(usuario, 'repuestos', repuestos);
        
        if (resultadoClientes && resultadoOrdenes && resultadoRepuestos) {
            console.log('✅ Todos los datos sincronizados correctamente con Firebase');
            return true;
        } else {
            console.warn('⚠️ Algunos datos no se sincronizaron completamente');
            return false;
        }
        
    } catch (error) {
        console.error('Error al sincronizar con Firebase:', error);
        throw error;
    }
}

// Exportar funciones inmediatamente
window.cerrarSesion = cerrarSesion;
window.exportarDatos = exportarDatos;
window.importarDatos = importarDatos;
window.sincronizarConFirebase = sincronizarConFirebase;

// === DATOS DE DEMOSTRACIÓN ===
async function cargarDatosDemo() {
    if (!confirm('¿Cargar datos de demostración? Esto sobrescribirá los datos existentes.')) return;
    
    // Clientes demo
    const clientesDemo = [
        {id: 1, nombre: 'Juan', apellido: 'Pérez García', celular: '555-0101', email: 'juan.perez@email.com', direccion: 'Av. Principal 123'},
        {id: 2, nombre: 'María', apellido: 'González López', celular: '555-0102', email: 'maria.gonzalez@email.com', direccion: 'Calle Secundaria 456'},
        {id: 3, nombre: 'Carlos', apellido: 'Ramírez Torres', celular: '555-0103', email: 'carlos.ramirez@email.com', direccion: 'Plaza Central 789'},
        {id: 4, nombre: 'Ana', apellido: 'Martínez Silva', celular: '555-0104', email: 'ana.martinez@email.com', direccion: 'Colonia Norte 321'},
        {id: 5, nombre: 'Roberto', apellido: 'Sánchez Mora', celular: '555-0105', email: 'roberto.sanchez@email.com', direccion: 'Zona Sur 654'}
    ];
    
    // Repuestos demo
    const repuestosDemo = [
        {id: 1, nombre: 'Pantalla iPhone 12', categoria: 'Pantallas', stock: 15, stockMinimo: 5, precioCompra: 80, precioVenta: 150, codigo: 'PAN-IP12', compatibilidad: 'iPhone 12', ubicacion: 'Estante A1'},
        {id: 2, nombre: 'Batería Samsung S21', categoria: 'Baterías', stock: 12, stockMinimo: 5, precioCompra: 25, precioVenta: 50, codigo: 'BAT-SS21', compatibilidad: 'Samsung Galaxy S21', ubicacion: 'Estante B2'},
        {id: 3, nombre: 'Cámara Xiaomi Redmi Note 10', categoria: 'Cámaras', stock: 8, stockMinimo: 3, precioCompra: 30, precioVenta: 60, codigo: 'CAM-XRN10', compatibilidad: 'Xiaomi Redmi Note 10', ubicacion: 'Estante C1'},
        {id: 4, nombre: 'Conector de Carga USB-C', categoria: 'Conectores', stock: 25, stockMinimo: 10, precioCompra: 5, precioVenta: 15, codigo: 'CON-USBC', compatibilidad: 'Universal USB-C', ubicacion: 'Estante D3'},
        {id: 5, nombre: 'Pantalla Huawei P30', categoria: 'Pantallas', stock: 6, stockMinimo: 5, precioCompra: 70, precioVenta: 130, codigo: 'PAN-HP30', compatibilidad: 'Huawei P30', ubicacion: 'Estante A2'},
        {id: 6, nombre: 'Altavoz iPhone 11', categoria: 'Altavoces', stock: 10, stockMinimo: 5, precioCompra: 15, precioVenta: 35, codigo: 'ALT-IP11', compatibilidad: 'iPhone 11', ubicacion: 'Estante E1'}
    ];
    
    // Órdenes demo
    const hoy = new Date();
    const ordenesDemo = [
        {
            id: 1, numero: '20250001', clienteId: 1, tipoDispositivo: 'Celular', marca: 'Apple', modelo: 'iPhone 12',
            imei: '123456789012345', problema: 'Pantalla rota por caída', accesorios: 'Funda, cable cargador',
            estado: 'En Reparación', presupuesto: 200, anticipo: 100, garantia: 30,
            fechaIngreso: new Date(hoy.getTime() - 2*24*60*60*1000).toISOString().split('T')[0],
            fechaEstimada: new Date(hoy.getTime() + 1*24*60*60*1000).toISOString().split('T')[0],
            tecnico: 'Técnico Principal', notas: 'Cliente requiere urgencia',
            repuestos: [{id: 1, nombre: 'Pantalla iPhone 12', cantidad: 1, precio: 150}],
            fechaCreacion: new Date(hoy.getTime() - 2*24*60*60*1000).toISOString(), fechaEntrega: null
        },
        {
            id: 2, numero: '20250002', clienteId: 2, tipoDispositivo: 'Celular', marca: 'Samsung', modelo: 'Galaxy S21',
            imei: '987654321098765', problema: 'Batería se descarga rápido', accesorios: 'Ninguno',
            estado: 'Listo para Entrega', presupuesto: 80, anticipo: 80, garantia: 30,
            fechaIngreso: new Date(hoy.getTime() - 3*24*60*60*1000).toISOString().split('T')[0],
            fechaEstimada: new Date(hoy.getTime()).toISOString().split('T')[0],
            tecnico: 'Técnico Auxiliar', notas: 'Cambio de batería estándar',
            repuestos: [{id: 2, nombre: 'Batería Samsung S21', cantidad: 1, precio: 50}],
            fechaCreacion: new Date(hoy.getTime() - 3*24*60*60*1000).toISOString(), fechaEntrega: null
        },
        {
            id: 3, numero: '20250003', clienteId: 3, tipoDispositivo: 'Celular', marca: 'Xiaomi', modelo: 'Redmi Note 10',
            imei: '456789123456789', problema: 'No enciende', accesorios: 'Cargador',
            estado: 'En Diagnóstico', presupuesto: 0, anticipo: 0, garantia: 30,
            fechaIngreso: new Date(hoy.getTime() - 1*24*60*60*1000).toISOString().split('T')[0],
            fechaEstimada: new Date(hoy.getTime() + 2*24*60*60*1000).toISOString().split('T')[0],
            tecnico: 'Técnico Principal', notas: 'Revisión general pendiente',
            repuestos: [], fechaCreacion: new Date(hoy.getTime() - 1*24*60*60*1000).toISOString(), fechaEntrega: null
        },
        {
            id: 4, numero: '20250004', clienteId: 4, tipoDispositivo: 'Tablet', marca: 'Apple', modelo: 'iPad Air',
            imei: '789123456789123', problema: 'Cristal tactil no responde', accesorios: 'Funda, lápiz',
            estado: 'Esperando Repuestos', presupuesto: 280, anticipo: 100, garantia: 30,
            fechaIngreso: new Date(hoy.getTime() - 5*24*60*60*1000).toISOString().split('T')[0],
            fechaEstimada: new Date(hoy.getTime() + 5*24*60*60*1000).toISOString().split('T')[0],
            tecnico: 'Técnico Auxiliar', notas: 'Esperando llegada de pantalla',
            repuestos: [], fechaCreacion: new Date(hoy.getTime() - 5*24*60*60*1000).toISOString(), fechaEntrega: null
        },
        {
            id: 5, numero: '20250005', clienteId: 5, tipoDispositivo: 'Celular', marca: 'Huawei', modelo: 'P30',
            imei: '321654987321654', problema: 'Conector de carga dañado', accesorios: 'Cable',
            estado: 'Recibido', presupuesto: 50, anticipo: 0, garantia: 30,
            fechaIngreso: new Date(hoy.getTime()).toISOString().split('T')[0],
            fechaEstimada: new Date(hoy.getTime() + 3*24*60*60*1000).toISOString().split('T')[0],
            tecnico: '', notas: 'Pendiente de revisión inicial',
            repuestos: [], fechaCreacion: new Date(hoy.getTime()).toISOString(), fechaEntrega: null
        }
    ];
    
    // Guardar datos y sincronizar con Firebase
    await Storage.saveAndSync('clientes', clientesDemo);
    await Storage.saveAndSync('repuestos', repuestosDemo);
    await Storage.saveAndSync('ordenes', ordenesDemo);
    
    alert('✅ Datos de demostración cargados y sincronizados con Firebase!');
    location.reload();
}

// Sistema de almacenamiento con Firebase - Cada usuario tiene su propia base de datos
class Storage {
    static get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }
    static set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }
    static getNextId(key) {
        const items = this.get(key);
        return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
    }
    static clear() {
        localStorage.removeItem('clientes');
        localStorage.removeItem('ordenes');
        localStorage.removeItem('repuestos');
    }
    
    // Métodos para Firebase - Estructura: usuarios/{usuario}/{coleccion}
    static async syncToFirebase(usuario, key, data) {
        try {
            if (!usuario) {
                console.warn(`No hay usuario para sincronizar ${key}`);
                return false;
            }
            
            console.log(`🔄 Sincronizando ${data.length} items de ${key} para usuario: ${usuario}`);
            
            // Usar subcollection dentro del documento del usuario
            const userRef = db.collection('usuarios-data').doc(usuario);
            const collectionRef = userRef.collection(key);
            
            // Crear documento del usuario si no existe
            await userRef.set({ 
                ultimaActualizacion: new Date().toISOString(),
                usuario: usuario 
            }, { merge: true });
            
            // Obtener documentos actuales en Firebase
            const snapshot = await collectionRef.get();
            const existingIds = new Set();
            snapshot.docs.forEach(doc => {
                existingIds.add(doc.id);
            });
            
            // Guardar/actualizar cada item usando su ID como documento ID
            const savePromises = data.map(item => {
                const docId = String(item.id); // Usar el ID del item como ID del documento
                existingIds.delete(docId); // Marcar como procesado
                return collectionRef.doc(docId).set(item);
            });
            await Promise.all(savePromises);
            
            // Eliminar documentos que ya no existen en los datos locales
            const deletePromises = Array.from(existingIds).map(docId => 
                collectionRef.doc(docId).delete()
            );
            await Promise.all(deletePromises);
            
            console.log(`✅ ${key} sincronizado correctamente para usuario: ${usuario}`);
            return true;
        } catch (error) {
            console.error(`❌ Error al sincronizar ${key}:`, error);
            console.error('Stack:', error.stack);
            return false;
        }
    }
    
    static async loadFromFirebase(usuario, key) {
        try {
            if (!usuario) return [];
            
            // Cargar desde subcollection del usuario
            const collectionRef = db.collection('usuarios-data').doc(usuario).collection(key);
            const snapshot = await collectionRef.get();
            
            const data = [];
            snapshot.forEach(doc => {
                // Ya no necesitamos agregar firebaseId porque el ID del documento es el ID del item
                data.push(doc.data());
            });
            
            console.log(`✅ Cargados ${data.length} registros de ${key} para usuario: ${usuario}`);
            return data;
        } catch (error) {
            console.error(`❌ Error al cargar ${key} desde Firebase:`, error);
            console.error('Stack:', error.stack);
            return [];
        }
    }
    
    // Método combinado: guardar localmente Y sincronizar con Firebase
    static async saveAndSync(key, data) {
        // Guardar localmente primero
        this.set(key, data);
        console.log(`💾 Guardado localmente: ${key} (${data.length} items)`);
        
        // Sincronizar con Firebase si hay usuario activo
        const usuario = localStorage.getItem('usuario');
        if (usuario) {
            const success = await this.syncToFirebase(usuario, key, data);
            if (!success) {
                console.warn(`⚠️ No se pudo sincronizar ${key} con Firebase, pero está guardado localmente`);
            }
        } else {
            console.warn(`⚠️ No hay usuario activo, ${key} solo se guardó localmente`);
        }
    }
}

// Función para resetear el sistema
function resetearSistema() {
    if (confirm('⚠️ ADVERTENCIA: Esto eliminará TODOS los datos del sistema (clientes, órdenes, inventario).\n\n¿Estás seguro de continuar?')) {
        if (confirm('Esta acción NO se puede deshacer. ¿Confirmas que deseas borrar todo?')) {
            Storage.clear();
            alert('✅ Sistema reseteado. La página se recargará.');
            location.reload();
        }
    }
}

// Gestión de navegación
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        if (section === 'dashboard') actualizarDashboard();
        if (section === 'clientes') cargarClientes();
        if (section === 'ordenes') cargarOrdenes();
        if (section === 'tiendas') mostrarTiendas();
        if (section === 'pagos') cargarPagos();
        if (section === 'inventario') filtrarInventario();
        if (section === 'reportes') generarReportes();
        if (section === 'configuracion') cargarConfiguracion();
    });
});

// === SINCRONIZACIÓN Y REFRESH DE DATOS ===

// Función para refrescar todos los datos desde Firebase
async function refrescarDatos() {
    const usuario = localStorage.getItem('usuario');
    if (!usuario) {
        mostrarNotificacion('❌ No hay usuario activo', 'error');
        return;
    }
    
    console.log('🔄 Refrescando todos los datos desde Firebase...');
    mostrarNotificacion('🔄 Sincronizando datos...', 'info');
    
    const success = await cargarDatosUsuario(usuario);
    
    if (success) {
        // Recargar la sección activa
        const activeSection = document.querySelector('.section.active');
        if (activeSection) {
            const sectionId = activeSection.id;
            console.log('🎯 Recargando sección activa:', sectionId);
            
            if (sectionId === 'dashboard') {
                actualizarDashboard();
            } else if (sectionId === 'clientes') {
                cargarClientes();
            } else if (sectionId === 'ordenes') {
                cargarOrdenes();
            } else if (sectionId === 'tiendas') {
                mostrarTiendas();
            } else if (sectionId === 'inventario') {
                filtrarInventario();
            }
        }
        
        mostrarNotificacion('✅ Datos sincronizados correctamente', 'success');
    } else {
        mostrarNotificacion('⚠️ No se pudieron sincronizar todos los datos', 'warning');
    }
}

// Exportar función de refresh al scope global
window.refrescarDatos = refrescarDatos;

// CLIENTES
function mostrarFormCliente() {
    document.getElementById('formCliente').style.display = 'block';
    document.getElementById('clienteForm').reset();
    document.getElementById('clienteId').value = '';
}
function cancelarFormCliente() {
    document.getElementById('formCliente').style.display = 'none';
    document.getElementById('clienteForm').reset();
}

document.getElementById('clienteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const clientes = Storage.get('clientes');
    const id = document.getElementById('clienteId').value;
    const cliente = {
        id: id ? parseInt(id) : Storage.getNextId('clientes'),
        nombre: document.getElementById('clienteNombre').value,
        apellido: document.getElementById('clienteApellido').value,
        celular: document.getElementById('clienteCelular').value,
        email: document.getElementById('clienteEmail').value,
        direccion: document.getElementById('clienteDireccion').value,
        fechaRegistro: id ? clientes.find(c => c.id === parseInt(id)).fechaRegistro : new Date().toISOString()
    };
    if (id) {
        const index = clientes.findIndex(c => c.id === parseInt(id));
        clientes[index] = cliente;
    } else {
        clientes.push(cliente);
    }
    
    // Guardar y sincronizar con Firebase
    await Storage.saveAndSync('clientes', clientes);
    
    cancelarFormCliente();
    cargarClientes();
    alert('Cliente guardado exitosamente');
});

function cargarClientes() {
    const clientes = Storage.get('clientes');
    const container = document.getElementById('listaClientes');
    if (clientes.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No hay clientes registrados</h3><p>Agrega tu primer cliente para comenzar</p></div>';
        return;
    }
    // Ordenar clientes alfabéticamente por nombre y apellido
    const clientesOrdenados = [...clientes].sort((a, b) => {
        const nombreA = `${a.nombre} ${a.apellido}`.toLowerCase();
        const nombreB = `${b.nombre} ${b.apellido}`.toLowerCase();
        return nombreA.localeCompare(nombreB, 'es');
    });
    let html = '<table><thead><tr><th>Nombre Completo</th><th>Celular</th><th>Email</th><th>Fecha Registro</th><th>Acciones</th></tr></thead><tbody>';
    clientesOrdenados.forEach(cliente => {
        html += `<tr><td>${cliente.nombre} ${cliente.apellido}</td><td>${cliente.celular}</td><td>${cliente.email || '-'}</td><td>${formatearFecha(cliente.fechaRegistro)}</td><td><button class="btn-success" onclick="editarCliente(${cliente.id})">Editar</button><button class="btn-secondary" onclick="verHistorialCliente(${cliente.id})">Historial</button><button class="btn-danger" onclick="eliminarCliente(${cliente.id})">Eliminar</button></td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Función para filtrar clientes por búsqueda
function filtrarClientes() {
    const termino = document.getElementById('busquedaClientes').value.toLowerCase().trim();
    const clientes = Storage.get('clientes');
    const container = document.getElementById('listaClientes');
    
    // Si el campo está vacío, mostrar todos
    if (!termino) {
        cargarClientes();
        return;
    }
    
    // Filtrar clientes que coincidan con el término
    const clientesFiltrados = clientes.filter(cliente => {
        const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`.toLowerCase();
        const celular = (cliente.celular || '').toLowerCase();
        const email = (cliente.email || '').toLowerCase();
        
        return (
            nombreCompleto.includes(termino) ||
            celular.includes(termino) ||
            email.includes(termino)
        );
    });
    
    // Ordenar los resultados
    const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
        const nombreA = `${a.nombre} ${a.apellido}`.toLowerCase();
        const nombreB = `${b.nombre} ${b.apellido}`.toLowerCase();
        return nombreA.localeCompare(nombreB, 'es');
    });
    
    // Mostrar resultados o mensaje de no encontrado
    if (clientesFiltrados.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No se encontraron clientes</h3>
                <p>Ningún cliente coincide con: "<strong>${termino}</strong>"</p>
                <button class="btn-secondary" onclick="limpiarBusquedaClientes()" style="margin-top: 10px;">
                    ✕ Limpiar búsqueda
                </button>
            </div>
        `;
        return;
    }
    
    // Mostrar resultados filtrados
    let html = `
        <div style="margin-bottom: 15px; padding: 10px; background: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 6px;">
            <strong>🔍 Resultados:</strong> ${clientesFiltrados.length} de ${clientes.length} cliente(s) encontrado(s)
        </div>
        <table><thead><tr><th>Nombre Completo</th><th>Celular</th><th>Email</th><th>Fecha Registro</th><th>Acciones</th></tr></thead><tbody>
    `;
    
    clientesOrdenados.forEach(cliente => {
        html += `<tr><td>${cliente.nombre} ${cliente.apellido}</td><td>${cliente.celular}</td><td>${cliente.email || '-'}</td><td>${formatearFecha(cliente.fechaRegistro)}</td><td><button class="btn-success" onclick="editarCliente(${cliente.id})">Editar</button><button class="btn-secondary" onclick="verHistorialCliente(${cliente.id})">Historial</button><button class="btn-danger" onclick="eliminarCliente(${cliente.id})">Eliminar</button></td></tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Función para limpiar la búsqueda
function limpiarBusquedaClientes() {
    document.getElementById('busquedaClientes').value = '';
    cargarClientes();
}

// Función para filtrar clientes en el selector de órdenes
function filtrarClientesOrden() {
    const termino = document.getElementById('ordenClienteBusqueda').value.toLowerCase().trim();
    const clientes = Storage.get('clientes');
    const dropdown = document.getElementById('dropdownClientesOrden');
    
    // Si está vacío, mostrar todos los clientes
    if (!termino) {
        mostrarDropdownClientesOrden(clientes);
        return;
    }
    
    // Filtrar clientes que coincidan con el término de búsqueda
    const clientesFiltrados = clientes.filter(cliente => {
        const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`.toLowerCase();
        const celular = (cliente.celular || '').toLowerCase();
        const email = (cliente.email || '').toLowerCase();
        
        return (
            nombreCompleto.includes(termino) ||
            celular.includes(termino) ||
            email.includes(termino)
        );
    });
    
    mostrarDropdownClientesOrden(clientesFiltrados);
}

// Función para mostrar el dropdown de clientes
function mostrarDropdownClientesOrden(clientes) {
    const dropdown = document.getElementById('dropdownClientesOrden');
    
    // Ordenar clientes alfabéticamente
    const clientesOrdenados = [...clientes].sort((a, b) => {
        const nombreA = `${a.nombre} ${a.apellido}`.toLowerCase();
        const nombreB = `${b.nombre} ${b.apellido}`.toLowerCase();
        return nombreA.localeCompare(nombreB, 'es');
    });
    
    if (clientesOrdenados.length === 0) {
        dropdown.innerHTML = '<div style="padding: 10px; color: #999; text-align: center;">No se encontraron clientes</div>';
        dropdown.style.display = 'block';
        return;
    }
    
    let html = '';
    clientesOrdenados.forEach(cliente => {
        html += `
            <div style="padding: 10px 12px; border-bottom: 1px solid #eee; cursor: pointer; hover: background: #f5f5f5;" 
                 onmouseover="this.style.background='#f5f5f5'" 
                 onmouseout="this.style.background='white'"
                 onclick="seleccionarClienteOrden(${cliente.id}, '${cliente.nombre.replace(/'/g, "\\'")} ${cliente.apellido.replace(/'/g, "\\'")}')">
                <strong>${cliente.nombre} ${cliente.apellido}</strong><br>
                <small style="color: #666;">📱 ${cliente.celular}${cliente.email ? ` | 📧 ${cliente.email}` : ''}</small>
            </div>
        `;
    });
    
    dropdown.innerHTML = html;
    dropdown.style.display = 'block';
}

// Función para seleccionar un cliente del dropdown
function seleccionarClienteOrden(clienteId, nombreCliente) {
    document.getElementById('ordenCliente').value = clienteId;
    document.getElementById('ordenClienteBusqueda').value = nombreCliente;
    document.getElementById('dropdownClientesOrden').style.display = 'none';
}

// Cerrar dropdown cuando se hace click fuera
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('dropdownClientesOrden');
    const input = document.getElementById('ordenClienteBusqueda');
    if (dropdown && input && !event.target.closest('[id="ordenClienteBusqueda"], [id="dropdownClientesOrden"]')) {
        dropdown.style.display = 'none';
    }
});

function editarCliente(id) {
    const clientes = Storage.get('clientes');
    const cliente = clientes.find(c => c.id === id);
    document.getElementById('clienteId').value = cliente.id;
    document.getElementById('clienteNombre').value = cliente.nombre;
    document.getElementById('clienteApellido').value = cliente.apellido;
    document.getElementById('clienteCelular').value = cliente.celular;
    document.getElementById('clienteEmail').value = cliente.email || '';
    document.getElementById('clienteDireccion').value = cliente.direccion || '';
    document.getElementById('formCliente').style.display = 'block';
}

async function eliminarCliente(id) {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    let clientes = Storage.get('clientes');
    clientes = clientes.filter(c => c.id !== id);
    
    // Guardar y sincronizar con Firebase
    await Storage.saveAndSync('clientes', clientes);
    
    cargarClientes();
}

function verHistorialCliente(id) {
    const cliente = Storage.get('clientes').find(c => c.id === id);
    const ordenes = Storage.get('ordenes').filter(o => o.clienteId === id);
    let html = `<h3>${cliente.nombre} ${cliente.apellido}</h3><p><strong>Celular:</strong> ${cliente.celular}</p><p><strong>Total de reparaciones:</strong> ${ordenes.length}</p><hr><h4>Historial de Órdenes:</h4>`;
    if (ordenes.length === 0) {
        html += '<p>No hay órdenes registradas para este cliente.</p>';
    } else {
        ordenes.forEach(orden => {
            html += `<div class="orden-card"><div class="orden-header"><span class="orden-numero">Orden #${orden.numero}</span><span class="badge badge-${getEstadoClass(orden.estado)}">${orden.estado}</span></div><p><strong>Dispositivo:</strong> ${orden.marca} ${orden.modelo} (${orden.tipoDispositivo})</p><p><strong>Problema:</strong> ${orden.problema}</p><p><strong>Fecha:</strong> ${formatearFecha(orden.fechaIngreso)}</p>${orden.presupuesto ? `<p><strong>Presupuesto:</strong> $${orden.presupuesto}</p>` : ''}</div>`;
        });
    }
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;';
    modal.innerHTML = `<div style="background:white;padding:30px;border-radius:15px;max-width:800px;max-height:80vh;overflow-y:auto;position:relative;"><button onclick="this.closest('div').parentElement.remove()" style="position:absolute;top:15px;right:15px;background:#dc3545;color:white;border:none;padding:8px 15px;border-radius:5px;cursor:pointer;">✕</button>${html}</div>`;
    document.body.appendChild(modal);
}

// ÓRDENES
let repuestosOrdenTemp = [];

function toggleGarantia() {
    const radioConGarantia = document.querySelector('input[name="tipoGarantia"][value="con"]');
    const campoGarantia = document.getElementById('campoGarantia');
    if (radioConGarantia && radioConGarantia.checked) {
        campoGarantia.style.display = 'grid';
    } else {
        campoGarantia.style.display = 'none';
    }
}

// CLIENTE RÁPIDO DESDE ÓRDENES
function mostrarFormClienteRapido() {
    document.getElementById('formClienteRapido').style.display = 'block';
    document.getElementById('clienteRapidoNombre').value = '';
    document.getElementById('clienteRapidoApellido').value = '';
    document.getElementById('clienteRapidoCelular').value = '';
    document.getElementById('clienteRapidoEmail').value = '';
    document.getElementById('clienteRapidoNombre').focus();
}

function cancelarClienteRapido() {
    document.getElementById('formClienteRapido').style.display = 'none';
}

async function guardarClienteRapido() {
    const nombre = document.getElementById('clienteRapidoNombre').value.trim();
    const apellido = document.getElementById('clienteRapidoApellido').value.trim();
    const celular = document.getElementById('clienteRapidoCelular').value.trim();
    const email = document.getElementById('clienteRapidoEmail').value.trim();
    
    if (!nombre || !apellido || !celular) {
        alert('Por favor completa los campos obligatorios (Nombre, Apellido y Celular)');
        return;
    }
    
    const clientes = Storage.get('clientes');
    const nuevoCliente = {
        id: Storage.getNextId('clientes'),
        nombre: nombre,
        apellido: apellido,
        celular: celular,
        email: email,
        direccion: '',
        fechaRegistro: new Date().toISOString()
    };
    
    clientes.push(nuevoCliente);
    await Storage.saveAndSync('clientes', clientes);
    
    // Recargar el select de clientes
    cargarClientesSelect();
    
    // Seleccionar automáticamente el nuevo cliente
    document.getElementById('ordenCliente').value = nuevoCliente.id;
    
    // Ocultar el formulario
    cancelarClienteRapido();
    
    alert(`✅ Cliente "${nombre} ${apellido}" agregado exitosamente`);
}

// Función para crear o obtener cliente final
async function obtenerClienteFinal() {
    let clientes = Storage.get('clientes');
    
    // Buscar si ya existe un cliente final
    let clienteFinal = clientes.find(c => 
        c.nombre === 'Cliente' && c.apellido === 'Final' && c.celular === '0000000000'
    );
    
    // Si no existe, crearlo
    if (!clienteFinal) {
        clienteFinal = {
            id: Storage.getNextId('clientes'),
            nombre: 'Cliente',
            apellido: 'Final',
            celular: '0000000000',
            email: '',
            direccion: '',
            fechaRegistro: new Date().toISOString()
        };
        clientes.push(clienteFinal);
        await Storage.saveAndSync('clientes', clientes);
    }
    
    return clienteFinal;
}

// Función para crear orden con cliente final directamente
async function crearOrdenClienteFinal() {
    if (!confirm('¿Deseas crear una orden para "Cliente Final"?\n\nEsto guardará una orden básica con datos mínimos.')) {
        return;
    }
    
    // Obtener o crear el cliente final
    const clienteFinal = await obtenerClienteFinal();
    
    // Crear la orden con datos mínimos
    const ordenes = Storage.get('ordenes');
    const orden = {
        id: Storage.getNextId('ordenes'),
        numero: generarNumeroOrden(),
        clienteId: clienteFinal.id,
        tipoDispositivo: 'Celular',
        marca: 'N/A',
        modelo: 'N/A',
        imei: '',
        problema: 'Cliente Final',
        accesorios: '',
        estado: 'Recibido',
        presupuesto: 0,
        costoPiezas: 0,
        anticipo: 0,
        tieneGarantia: false,
        garantia: 0,
        fechaIngreso: new Date().toISOString().split('T')[0],
        fechaEstimada: '',
        tecnico: '',
        notas: 'Orden para cliente final',
        repuestos: [],
        fechaCreacion: new Date().toISOString(),
        fechaEntrega: null,
        historialPagos: [],
        cobrado: false
    };
    
    ordenes.push(orden);
    await Storage.saveAndSync('ordenes', ordenes);
    
    alert(`✅ Orden #${orden.numero} creada exitosamente para Cliente Final`);
    
    // Recargar la vista de órdenes
    cargarOrdenes();
}

function mostrarFormOrden() {
    document.getElementById('formOrden').style.display = 'block';
    document.getElementById('ordenForm').reset();
    document.getElementById('ordenId').value = '';
    
    // Limpiar el input de búsqueda de cliente si existe
    const inputBusquedaCliente = document.getElementById('ordenClienteBusqueda');
    if (inputBusquedaCliente) {
        inputBusquedaCliente.value = '';
    }
    
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('ordenFechaIngreso').value = hoy;
    document.querySelector('input[name="tipoGarantia"][value="con"]').checked = true;
    toggleGarantia();
    cargarClientesSelect();
    cargarTiendasSelect();
    repuestosOrdenTemp = [];
    actualizarRepuestosSeleccionados();
    
    // Reset del checklist
    document.querySelectorAll('input[name="seccionInspeccion"]').forEach(radio => radio.checked = false);
    document.querySelectorAll('input[name="piezasProbadas"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="equipoApagado"]').forEach(cb => cb.checked = false);
    document.getElementById('seccionEncendidos').style.display = 'none';
    document.getElementById('seccionApagados').style.display = 'none';
    
    // Cargar inventario con un pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
        cargarInventarioSelect();
    }, 100);
    // Agregar formateo automático a campos de dinero
    agregarFormateoMoneda();
    
    // Validar si cliente es requerido
    validarClienteRequerido();
}

function validarClienteRequerido() {
    const tiendaSeleccionada = document.getElementById('ordenTienda').value;
    const clienteSelect = document.getElementById('ordenCliente');
    const labelCliente = document.getElementById('labelCliente');
    
    if (tiendaSeleccionada) {
        // Si hay tienda seleccionada, cliente NO es requerido
        clienteSelect.removeAttribute('required');
        labelCliente.innerHTML = 'Cliente (Opcional)';
        labelCliente.style.color = '#666';
    } else {
        // Si NO hay tienda, cliente ES requerido
        clienteSelect.setAttribute('required', 'required');
        labelCliente.innerHTML = 'Cliente *';
        labelCliente.style.color = 'inherit';
    }
}

function agregarFormateoMoneda() {
    const presupuestoInput = document.getElementById('ordenPresupuesto');
    const anticipoInput = document.getElementById('ordenAnticipo');
    const costoPiezasInput = document.getElementById('ordenCostoPiezas');
    
    [presupuestoInput, anticipoInput, costoPiezasInput].forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value) {
                const numero = limpiarNumero(this.value);
                this.value = formatearMoneda(numero);
            }
        });
        
        input.addEventListener('focus', function() {
            // Al enfocar, quitar el formato para editar fácilmente
            if (this.value) {
                const numero = limpiarNumero(this.value);
                this.value = numero.toString().replace('.', ',');
            }
        });
    });
}

function formatearMoneda(numero) {
    if (!numero || numero === 0) return '';
    
    // Separar parte entera de decimal
    const partes = numero.toString().split('.');
    const parteEntera = partes[0];
    const parteDecimal = partes[1];
    
    // Formatear parte entera con puntos como separadores de miles
    const enteraFormateada = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // Si tiene decimales, agregarlos con coma
    if (parteDecimal && parseInt(parteDecimal) > 0) {
        return `${enteraFormateada},${parteDecimal}`;
    }
    
    return enteraFormateada;
}

function cargarInventarioSelect() {
    const inventario = Storage.get('repuestos');
    const select = document.getElementById('selectRepuesto');
    
    if (!select) {
        console.error('No se encontró el elemento selectRepuesto');
        return;
    }
    
    console.log('Cargando inventario, total items:', inventario.length);
    select.innerHTML = '<option value="">-- Seleccionar repuesto --</option>';
    
    if (inventario.length === 0) {
        const option = document.createElement('option');
        option.disabled = true;
        option.textContent = 'No hay repuestos en el inventario';
        select.appendChild(option);
        return;
    }
    
    // Agrupar por categorías
    const categorias = {};
    inventario.forEach(item => {
        const categoria = item.categoria || 'Sin Categoría';
        if (!categorias[categoria]) {
            categorias[categoria] = [];
        }
        categorias[categoria].push(item);
    });
    
    // Ordenar categorías alfabéticamente
    const categoriasOrdenadas = Object.keys(categorias).sort();
    
    // Crear opciones agrupadas por categoría
    categoriasOrdenadas.forEach(categoria => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = categoria;
        
        categorias[categoria].forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.nombre} | Stock: ${item.stock} | $${item.precioVenta.toFixed(2)}`;
            if (item.stock <= 0) {
                option.disabled = true;
                option.textContent += ' (Sin stock)';
                option.style.color = '#999';
            }
            optgroup.appendChild(option);
        });
        
        select.appendChild(optgroup);
    });
    
    console.log('Inventario cargado exitosamente');
}

function agregarRepuestoOrden() {
    const selectRepuesto = document.getElementById('selectRepuesto');
    const cantidad = parseInt(document.getElementById('cantidadRepuesto').value) || 1;
    const repuestoId = parseInt(selectRepuesto.value);
    
    if (!repuestoId) {
        alert('Por favor selecciona un repuesto');
        return;
    }
    
    const inventario = Storage.get('repuestos');
    const repuesto = inventario.find(p => p.id === repuestoId);
    
    if (!repuesto) {
        alert('Repuesto no encontrado');
        return;
    }
    
    if (cantidad > repuesto.stock) {
        alert(`Solo hay ${repuesto.stock} unidades disponibles en stock`);
        return;
    }
    
    // Verificar si ya existe este repuesto
    const existente = repuestosOrdenTemp.find(p => p.id === repuestoId);
    if (existente) {
        const nuevaCantidad = existente.cantidad + cantidad;
        if (nuevaCantidad > repuesto.stock) {
            alert(`Solo hay ${repuesto.stock} unidades disponibles en stock`);
            return;
        }
        existente.cantidad = nuevaCantidad;
    } else {
        repuestosOrdenTemp.push({
            id: repuestoId,
            nombre: repuesto.nombre,
            cantidad: cantidad,
            precio: repuesto.precioVenta
        });
    }
    
    actualizarRepuestosSeleccionados();
    document.getElementById('cantidadRepuesto').value = 1;
    selectRepuesto.value = '';
}

function eliminarRepuestoOrden(index) {
    repuestosOrdenTemp.splice(index, 1);
    actualizarRepuestosSeleccionados();
}

function actualizarRepuestosSeleccionados() {
    const container = document.getElementById('repuestosSeleccionados');
    if (repuestosOrdenTemp.length === 0) {
        container.innerHTML = '<p style="color: #999; font-style: italic;">No se han agregado repuestos</p>';
        return;
    }
    
    let total = 0;
    let html = '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr><th style="text-align: left; padding: 5px;">Repuesto</th><th style="text-align: center; padding: 5px;">Cantidad</th><th style="text-align: right; padding: 5px;">Precio Unit.</th><th style="text-align: right; padding: 5px;">Subtotal</th><th style="text-align: center; padding: 5px;">Acción</th></tr></thead>';
    html += '<tbody>';
    
    repuestosOrdenTemp.forEach((repuesto, index) => {
        const subtotal = repuesto.cantidad * repuesto.precio;
        total += subtotal;
        html += `<tr style="border-top: 1px solid #dee2e6;">
            <td style="padding: 8px;">${repuesto.nombre}</td>
            <td style="text-align: center; padding: 8px;">${repuesto.cantidad}</td>
            <td style="text-align: right; padding: 8px;">$${repuesto.precio.toFixed(2)}</td>
            <td style="text-align: right; padding: 8px;"><strong>$${subtotal.toFixed(2)}</strong></td>
            <td style="text-align: center; padding: 8px;"><button type="button" class="btn-danger" style="padding: 4px 8px; font-size: 12px;" onclick="eliminarRepuestoOrden(${index})">Eliminar</button></td>
        </tr>`;
    });
    
    html += '</tbody>';
    html += `<tfoot><tr style="border-top: 2px solid #333; font-weight: bold;"><td colspan="3" style="padding: 8px; text-align: right;">Total Repuestos:</td><td style="text-align: right; padding: 8px;">$${total.toFixed(2)}</td><td></td></tr></tfoot>`;
    html += '</table></div>';
    
    container.innerHTML = html;
}

function cancelarFormOrden() {
    document.getElementById('formOrden').style.display = 'none';
    document.getElementById('ordenForm').reset();
}

function cargarClientesSelect() {
    const clientes = Storage.get('clientes');
    // Ordenar clientes alfabéticamente por nombre y apellido
    const clientesOrdenados = [...clientes].sort((a, b) => {
        const nombreA = `${a.nombre} ${a.apellido}`.toLowerCase();
        const nombreB = `${b.nombre} ${b.apellido}`.toLowerCase();
        return nombreA.localeCompare(nombreB, 'es');
    });
    
    // Para el input de búsqueda (nuevo sistema)
    const inputBusqueda = document.getElementById('ordenClienteBusqueda');
    if (inputBusqueda) {
        // Inicializar el dropdown con todos los clientes
        mostrarDropdownClientesOrden(clientesOrdenados);
    }
    
    // Mantener compatibilidad con el select antiguo si existe
    const select = document.getElementById('ordenCliente');
    if (select && select.tagName === 'SELECT') {
        select.innerHTML = '<option value="">Seleccionar cliente...</option>';
        clientesOrdenados.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = `${cliente.nombre} ${cliente.apellido} - ${cliente.celular}`;
            select.appendChild(option);
        });
    }
}

function cargarTiendasSelect() {
    const tiendas = Storage.get('tiendas');
    // Ordenar tiendas alfabéticamente por nombre
    const tiendasOrdenadas = [...tiendas].sort((a, b) => 
        a.nombre.toLowerCase().localeCompare(b.nombre.toLowerCase(), 'es')
    );
    const select = document.getElementById('ordenTienda');
    select.innerHTML = '<option value="">Sin tienda</option>';
    tiendasOrdenadas.forEach(tienda => {
        const option = document.createElement('option');
        option.value = tienda.id;
        option.textContent = tienda.nombre;
        select.appendChild(option);
    });
}

function limpiarNumero(valor) {
    if (!valor) return 0;
    let limpio = valor.toString().trim();
    
    // Eliminar espacios
    limpio = limpio.replace(/\s/g, '');
    
    // Si tiene punto y coma, determinar cuál es el separador decimal
    // En formato español: 2.500,50 -> punto es miles, coma es decimal
    // En formato inglés: 2,500.50 -> coma es miles, punto es decimal
    if (limpio.includes('.') && limpio.includes(',')) {
        const ultimoPunto = limpio.lastIndexOf('.');
        const ultimaComa = limpio.lastIndexOf(',');
        
        if (ultimaComa > ultimoPunto) {
            // Formato español: 2.500,50
            limpio = limpio.replace(/\./g, '').replace(',', '.');
        } else {
            // Formato inglés: 2,500.50
            limpio = limpio.replace(/,/g, '');
        }
    } else if (limpio.includes('.')) {
        // Solo tiene puntos
        const partes = limpio.split('.');
        if (partes.length > 2) {
            // Múltiples puntos: 2.500.000 -> todos son separadores de miles
            limpio = limpio.replace(/\./g, '');
        } else if (partes.length === 2) {
            // Un solo punto: verificar si es separador de miles o decimal
            if (partes[1].length === 3 && /^\d+$/.test(partes[1])) {
                // 2.500 -> separador de miles
                limpio = limpio.replace(/\./g, '');
            }
            // Si tiene 1, 2 o más de 3 dígitos después del punto, es decimal
        }
    } else if (limpio.includes(',')) {
        // Solo tiene comas: reemplazar por puntos (formato español)
        limpio = limpio.replace(/,/g, '.');
        const partes = limpio.split('.');
        if (partes.length > 2) {
            limpio = partes.slice(0, -1).join('') + '.' + partes[partes.length - 1];
        }
    }
    
    // Eliminar cualquier carácter que no sea número o punto
    limpio = limpio.replace(/[^0-9.]/g, '');
    return parseFloat(limpio) || 0;
}

document.getElementById('ordenForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Formulario enviado!');
    
    const ordenes = Storage.get('ordenes');
    const id = document.getElementById('ordenId').value;
    
    const tieneGarantia = document.querySelector('input[name="tipoGarantia"]:checked').value === 'con';
    const anticipo = limpiarNumero(document.getElementById('ordenAnticipo').value);
    
    // Obtener las selecciones del checklist
    const inspeccion = obtenerSeleccionesChecklist();
    
    const orden = {
        id: id ? parseInt(id) : Storage.getNextId('ordenes'),
        numero: id ? ordenes.find(o => o.id === parseInt(id)).numero : generarNumeroOrden(),
        tiendaId: document.getElementById('ordenTienda').value || null,
        clienteId: parseInt(document.getElementById('ordenCliente').value),
        tipoDispositivo: document.getElementById('ordenTipoDispositivo').value,
        marca: document.getElementById('ordenMarca').value,
        modelo: document.getElementById('ordenModelo').value,
        imei: document.getElementById('ordenIMEI').value,
        problema: document.getElementById('ordenProblema').value,
        accesorios: document.getElementById('ordenAccesorios').value,
        estado: document.getElementById('ordenEstado').value,
        presupuesto: limpiarNumero(document.getElementById('ordenPresupuesto').value),
        costoPiezas: limpiarNumero(document.getElementById('ordenCostoPiezas').value),
        anticipo: anticipo,
        tieneGarantia: tieneGarantia,
        garantia: tieneGarantia ? parseInt(document.getElementById('ordenGarantia').value) || 30 : 0,
        fechaIngreso: document.getElementById('ordenFechaIngreso').value,
        fechaEstimada: document.getElementById('ordenFechaEstimada').value,
        tecnico: document.getElementById('ordenTecnico').value,
        notas: document.getElementById('ordenNotas').value,
        repuestos: [...repuestosOrdenTemp],
        inspeccion: inspeccion,
        fechaCreacion: id ? ordenes.find(o => o.id === parseInt(id)).fechaCreacion : new Date().toISOString(),
        fechaEntrega: null,
        cobrado: false
    };
    
    // Registrar anticipo en el historial de pagos si es una orden nueva y tiene anticipo
    if (!id && anticipo > 0) {
        orden.historialPagos = [{
            monto: anticipo,
            fecha: new Date().toISOString(),
            tipo: 'Anticipo inicial'
        }];
    } else if (id) {
        // Si es edición, mantener el historial existente
        const ordenAnterior = ordenes.find(o => o.id === parseInt(id));
        orden.historialPagos = ordenAnterior.historialPagos || [];
    }
    
    console.log('Orden a guardar:', orden);
    
    if (id) {
        const index = ordenes.findIndex(o => o.id === parseInt(id));
        // Si es edición, restaurar repuestos anteriores al inventario
        const ordenAnterior = ordenes[index];
        if (ordenAnterior.repuestos && ordenAnterior.repuestos.length > 0) {
            let inventario = Storage.get('repuestos');
            ordenAnterior.repuestos.forEach(repuesto => {
                const itemInventario = inventario.find(i => i.id === repuesto.id);
                if (itemInventario) {
                    itemInventario.stock += repuesto.cantidad;
                }
            });
            await Storage.saveAndSync('repuestos', inventario);
        }
        ordenes[index] = orden;
    } else {
        ordenes.push(orden);
    }
    
    // Restar repuestos del inventario
    if (repuestosOrdenTemp.length > 0) {
        let inventario = Storage.get('repuestos');
        repuestosOrdenTemp.forEach(repuesto => {
            const itemInventario = inventario.find(i => i.id === repuesto.id);
            if (itemInventario) {
                itemInventario.stock -= repuesto.cantidad;
            }
        });
        await Storage.saveAndSync('repuestos', inventario);
    }
    
    await Storage.saveAndSync('ordenes', ordenes);
    console.log('Orden guardada, total ordenes:', ordenes.length);
    
    cancelarFormOrden();
    cargarOrdenes();
    
    if (!id && confirm('Orden guardada exitosamente. ¿Deseas imprimir el recibo de ingreso?')) {
        imprimirRecibo(orden.id);
    } else if (!id) {
        alert('Orden guardada exitosamente');
    }
});

function generarNumeroOrden() {
    const ordenes = Storage.get('ordenes');
    const año = new Date().getFullYear();
    const cantidad = ordenes.filter(o => o.numero && o.numero.startsWith(año.toString())).length + 1;
    return `${año}${String(cantidad).padStart(4, '0')}`;
}

function generarHtmlInspeccion(orden) {
    if (!orden.inspeccion || !orden.inspeccion.seccion || orden.inspeccion.items.length === 0) {
        return '';
    }
    
    const { seccion, items } = orden.inspeccion;
    let titulo = '';
    let bg = '';
    let borderColor = '';
    
    if (seccion === 'equipos-encendidos') {
        titulo = '🔥 Piezas Probadas (Equipo Encendido)';
        bg = '#fff3e0';
        borderColor = '#ff6f00';
    } else if (seccion === 'equipos-apagados') {
        titulo = '⚫ Características del Equipo Apagado';
        bg = '#f3e5f5';
        borderColor = '#6a1b9a';
    }
    
    let itemsHtml = '<ul style="margin: 5px 0 0 20px; padding: 0;">';
    items.forEach(item => {
        itemsHtml += `<li>✓ ${item}</li>`;
    });
    itemsHtml += '</ul>';
    
    return `<div style="background: ${bg}; padding: 10px; border-radius: 5px; margin-top: 10px; border-left: 4px solid ${borderColor};"><strong>${titulo}</strong>${itemsHtml}</div>`;
}

function cargarOrdenes() {
    cargarClientesSelect();
    cargarTiendasSelect();
    filtrarOrdenes();
}

function filtrarOrdenes() {
    let ordenes = Storage.get('ordenes');
    const tiendas = Storage.get('tiendas');
    const clientes = Storage.get('clientes');
    const filtroEstado = document.getElementById('filtroEstado').value;
    if (filtroEstado) {
        ordenes = ordenes.filter(o => o.estado === filtroEstado);
    }
    const container = document.getElementById('listaOrdenes');
    if (ordenes.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No hay órdenes registradas</h3><p>Crea una nueva orden para comenzar</p></div>';
        return;
    }
    ordenes.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
    let html = '';
    ordenes.forEach(orden => {
        const cliente = clientes.find(c => c.id === orden.clienteId);
        const tienda = orden.tiendaId ? tiendas.find(t => t.id === orden.tiendaId) : null;
        // Si tiene tienda asignada, mostrar el nombre de la tienda; si no, mostrar el cliente
        const clienteNombre = tienda ? tienda.nombre : (cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente no encontrado');
        const tiendaInfo = tienda ? `<div class="info-item"><span class="info-label">Tienda:</span> ${tienda.nombre}</div>` : '';
        const saldo = (orden.presupuesto || 0) - (orden.anticipo || 0);
        
        // Generar HTML de repuestos si existen
        let repuestosHtml = '';
        if (orden.repuestos && orden.repuestos.length > 0) {
            repuestosHtml = '<div style="background: #f0f8ff; padding: 10px; border-radius: 5px; margin-top: 10px;"><strong>🔧 Repuestos utilizados:</strong><ul style="margin: 5px 0 0 20px; padding: 0;">';
            orden.repuestos.forEach(repuesto => {
                repuestosHtml += `<li>${repuesto.nombre} - Cantidad: ${repuesto.cantidad} - $${(repuesto.precio * repuesto.cantidad).toFixed(2)}</li>`;
            });
            repuestosHtml += '</ul></div>';
        }
        
        // Generar HTML de garantía
        let garantiaHtml = '';
        if (orden.tieneGarantia !== false && orden.garantia > 0) {
            garantiaHtml = `<div style="background: #d4edda; padding: 10px; border-radius: 5px; margin-top: 10px; border-left: 4px solid #28a745;"><strong>✅ Garantía:</strong> ${orden.garantia} días desde la entrega</div>`;
        } else {
            garantiaHtml = `<div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 10px; border-left: 4px solid #ffc107;"><strong>⚠️ Sin garantía</strong></div>`;
        }
        
        // Generar HTML de inspección
        let inspeccionHtml = generarHtmlInspeccion(orden);
        
        html += `<div class="orden-card"><div class="orden-header"><span class="orden-numero">Orden #${orden.numero}</span><span class="badge badge-${getEstadoClass(orden.estado)}">${orden.estado}</span></div><div class="orden-info"><div class="info-item"><span class="info-label">Cliente:</span> ${clienteNombre}</div>${tiendaInfo}<div class="info-item"><span class="info-label">Dispositivo:</span> ${orden.marca} ${orden.modelo}</div><div class="info-item"><span class="info-label">Tipo:</span> ${orden.tipoDispositivo}</div><div class="info-item"><span class="info-label">Fecha Ingreso:</span> ${formatearFecha(orden.fechaIngreso)}</div>${orden.presupuesto ? `<div class="info-item"><span class="info-label">Presupuesto:</span> $${orden.presupuesto.toFixed(2)}</div><div class="info-item"><span class="info-label">Anticipo:</span> $${orden.anticipo.toFixed(2)}</div><div class="info-item"><span class="info-label">Saldo:</span> <strong>$${saldo.toFixed(2)}</strong></div>` : ''}${orden.tecnico ? `<div class="info-item"><span class="info-label">Técnico:</span> ${orden.tecnico}</div>` : ''}</div><p><strong>Problema:</strong> ${orden.problema}</p>${orden.notas ? `<p><strong>Notas:</strong> ${orden.notas}</p>` : ''}${repuestosHtml}${inspeccionHtml}${garantiaHtml}<div style="margin-top: 15px;"><button class="btn-success" onclick="editarOrden(${orden.id})">Editar</button><button class="btn-secondary" onclick="cambiarEstadoOrden(${orden.id})">Cambiar Estado</button>${orden.estado !== 'Entregado' && orden.estado !== 'Cancelado' ? `<button class="btn-primary" onclick="abrirModalArticulos(${orden.id})" style="background: #ff9800;">🔧 + Artículos</button>` : ''}<button class="btn-primary" onclick="imprimirRecibo(${orden.id})">📄 Imprimir</button><button class="btn-primary" onclick="enviarWhatsApp(${orden.id})" style="background: #25d366;">📱 WhatsApp</button>${saldo > 0 ? `<button class="btn-primary" onclick="registrarPago(${orden.id})">💰 Pagar</button>` : ''}<button class="btn-danger" onclick="eliminarOrden(${orden.id})">Eliminar</button></div></div>`;
    });
    container.innerHTML = html;
}

function getEstadoClass(estado) {
    const map = {'Recibido': 'recibido','En Diagnóstico': 'diagnostico','Esperando Repuestos': 'repuestos','En Reparación': 'reparacion','Listo para Entrega': 'listo','Entregado': 'entregado','Cancelado': 'cancelado'};
    return map[estado] || 'recibido';
}

function editarOrden(id) {
    const ordenes = Storage.get('ordenes');
    const orden = ordenes.find(o => o.id === id);
    document.getElementById('ordenId').value = orden.id;
    document.getElementById('ordenTienda').value = orden.tiendaId || '';
    document.getElementById('ordenCliente').value = orden.clienteId;
    
    // Si existe el input de búsqueda, llenar también el nombre del cliente
    const inputBusquedaCliente = document.getElementById('ordenClienteBusqueda');
    if (inputBusquedaCliente && orden.clienteId) {
        const clientes = Storage.get('clientes');
        const cliente = clientes.find(c => c.id === orden.clienteId);
        if (cliente) {
            inputBusquedaCliente.value = `${cliente.nombre} ${cliente.apellido}`;
        }
    }
    
    document.getElementById('ordenTipoDispositivo').value = orden.tipoDispositivo;
    document.getElementById('ordenMarca').value = orden.marca;
    document.getElementById('ordenModelo').value = orden.modelo;
    document.getElementById('ordenIMEI').value = orden.imei;
    document.getElementById('ordenProblema').value = orden.problema;
    document.getElementById('ordenAccesorios').value = orden.accesorios;
    document.getElementById('ordenEstado').value = orden.estado;
    document.getElementById('ordenPresupuesto').value = orden.presupuesto;
    document.getElementById('ordenAnticipo').value = orden.anticipo || 0;
    const radioValue = orden.tieneGarantia !== false ? 'con' : 'sin';
    document.querySelector(`input[name="tipoGarantia"][value="${radioValue}"]`).checked = true;
    document.getElementById('ordenGarantia').value = orden.garantia || 30;
    toggleGarantia();
    document.getElementById('ordenFechaIngreso').value = orden.fechaIngreso;
    document.getElementById('ordenFechaEstimada').value = orden.fechaEstimada;
    document.getElementById('ordenTecnico').value = orden.tecnico;
    document.getElementById('ordenNotas').value = orden.notas;
    
    // Cargar repuestos de la orden
    cargarInventarioSelect();
    repuestosOrdenTemp = orden.repuestos ? [...orden.repuestos] : [];
    actualizarRepuestosSeleccionados();
    
    // Cargar checklist de inspección
    cargarChecklistEnFormulario(orden);
    
    // Validar si cliente es requerido
    validarClienteRequerido();
    
    document.getElementById('formOrden').style.display = 'block';
}

async function cambiarEstadoOrden(id) {
    const ordenes = Storage.get('ordenes');
    const orden = ordenes.find(o => o.id === id);
    const nuevoEstado = prompt(`Estado actual: ${orden.estado}\n\nIngresa el nuevo estado:\n1. Recibido\n2. En Diagnóstico\n3. Esperando Repuestos\n4. En Reparación\n5. Listo para Entrega\n6. Entregado\n7. Cancelado`);
    const estados = ['Recibido', 'En Diagnóstico', 'Esperando Repuestos', 'En Reparación', 'Listo para Entrega', 'Entregado', 'Cancelado'];
    const index = parseInt(nuevoEstado) - 1;
    if (index >= 0 && index < estados.length) {
        orden.estado = estados[index];
        if (estados[index] === 'Entregado') {
            orden.fechaEntrega = new Date().toISOString();
            
            // Si hay saldo pendiente, solicitar pago final
            const saldo = (orden.presupuesto || 0) - (orden.anticipo || 0);
            if (saldo > 0) {
                if (confirm(`Saldo pendiente: $${formatearMonto(saldo)}\n\n¿Deseas registrar el pago final ahora?`)) {
                    // Solicitar método de pago
                    const metodoPago = prompt(`Selecciona el método de pago:\n1. Efectivo\n2. Transferencia\n3. Tarjeta de Crédito/Débito\n\nIngresa el número (1, 2 o 3):`);
                    const metodos = {
                        '1': { nombre: 'Efectivo', comision: 0 },
                        '2': { nombre: 'Transferencia', comision: 0.015 }, // 1.5% comisión
                        '3': { nombre: 'Tarjeta', comision: 0.03 } // 3% comisión
                    };
                    
                    if (metodos[metodoPago]) {
                        const metodoSeleccionado = metodos[metodoPago];
                        const comision = saldo * metodoSeleccionado.comision;
                        const montoNeto = saldo - comision;
                        
                        orden.anticipo = orden.presupuesto; // Marca como pagado completo
                        
                        // Registrar el pago en el historial
                        if (!orden.historialPagos) {
                            orden.historialPagos = [];
                        }
                        orden.historialPagos.push({
                            monto: saldo,
                            montoNeto: montoNeto,
                            comision: comision,
                            metodoPago: metodoSeleccionado.nombre,
                            fecha: new Date().toISOString(),
                            tipo: 'Pago Final'
                        });
                        
                        let mensajePago = `✅ Orden entregada y pago registrado!\nMétodo: ${metodoSeleccionado.nombre}\nMonto: $${formatearMonto(saldo)}`;
                        if (comision > 0) {
                            mensajePago += `\nComisión: $${formatearMonto(comision)} (${(metodoSeleccionado.comision * 100)}%)\nMonto neto: $${formatearMonto(montoNeto)}`;
                        }
                        alert(mensajePago);
                    }
                }
            }
        }
        await Storage.saveAndSync('ordenes', ordenes);
        cargarOrdenes();
    }
}

async function eliminarOrden(id) {
    if (!confirm('¿Estás seguro de eliminar esta orden?')) return;
    let ordenes = Storage.get('ordenes');
    ordenes = ordenes.filter(o => o.id !== id);
    await Storage.saveAndSync('ordenes', ordenes);
    cargarOrdenes();
}

// PAGOS
function cargarPagos() {
    const ordenes = Storage.get('ordenes');
    const clientes = Storage.get('clientes');
    let totalCobrado = 0;
    let porCobrar = 0;
    let cobradoHoy = 0;
    let dineroEfectivo = 0;
    let dineroBanco = 0; // Transferencias + Tarjetas
    let comisionesTotales = 0;
    const hoy = new Date().toISOString().split('T')[0];
    const ordenesPendientes = [];
    
    ordenes.forEach(orden => {
        const presupuesto = orden.presupuesto || 0;
        const anticipo = orden.anticipo || 0;
        const saldo = presupuesto - anticipo;
        totalCobrado += anticipo;
        if (orden.estado !== 'Cancelado' && orden.estado !== 'Entregado') {
            if (saldo > 0) {
                porCobrar += saldo;
                ordenesPendientes.push({ orden, saldo, cliente: clientes.find(c => c.id === orden.clienteId) });
            } else if (presupuesto > 0) {
                totalCobrado += presupuesto;
            }
        }
        
        // Calcular pagos realizados hoy y por método de pago
        if (orden.historialPagos && orden.historialPagos.length > 0) {
            orden.historialPagos.forEach(pago => {
                const metodoPago = pago.metodoPago || 'Efectivo';
                const comision = pago.comision || 0;
                
                if (metodoPago === 'Efectivo') {
                    dineroEfectivo += pago.monto;
                } else {
                    dineroBanco += (pago.montoNeto || pago.monto);
                    comisionesTotales += comision;
                }
                
                if (pago.fecha && pago.fecha.split('T')[0] === hoy) {
                    cobradoHoy += pago.monto;
                }
            });
        } else if (orden.fechaCreacion && orden.fechaCreacion.split('T')[0] === hoy && anticipo > 0) {
            // Fallback: si no hay historial, usar la fecha de creación (órdenes antiguas)
            cobradoHoy += anticipo;
            dineroEfectivo += anticipo; // Asumir efectivo para órdenes antiguas
        }
    });
    
    document.getElementById('totalCobrado').textContent = `$${formatearMonto(totalCobrado)}`;
    document.getElementById('porCobrar').textContent = `$${formatearMonto(porCobrar)}`;
    document.getElementById('cobradoHoy').textContent = `$${formatearMonto(cobradoHoy)}`;
    
    // Agregar nueva sección de dinero en banco
    const bancoSection = document.getElementById('dineroBanco');
    if (bancoSection) {
        bancoSection.textContent = `$${formatearMonto(dineroBanco)}`;
    }
    
    const container = document.getElementById('listaPagos');
    if (ordenesPendientes.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>¡Todo pagado! 🎉</h3><p>No hay cuentas por cobrar pendientes</p></div>';
        return;
    }
    
    // Mostrar resumen de métodos de pago
    let resumenMetodos = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px; color: white;">
            <h3 style="margin: 0 0 15px 0; text-align: center;">💰 Resumen de Cobros</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px;">
                    <div style="font-size: 0.9em; opacity: 0.9;">💵 Efectivo</div>
                    <div style="font-size: 1.4em; font-weight: bold; margin-top: 5px;">$${formatearMonto(dineroEfectivo)}</div>
                </div>
                <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px;">
                    <div style="font-size: 0.9em; opacity: 0.9;">🏦 Dinero en Banco</div>
                    <div style="font-size: 1.4em; font-weight: bold; margin-top: 5px;">$${formatearMonto(dineroBanco)}</div>
                    <div style="font-size: 0.75em; opacity: 0.8; margin-top: 5px;">(Neto después de comisiones)</div>
                </div>
                <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px;">
                    <div style="font-size: 0.9em; opacity: 0.9;">📊 Comisiones Pagadas</div>
                    <div style="font-size: 1.4em; font-weight: bold; margin-top: 5px;">$${formatearMonto(comisionesTotales)}</div>
                </div>
            </div>
        </div>
    `;
    
    let html = resumenMetodos + '<h3 style="margin: 20px 0;">Cuentas por Cobrar</h3>';
    ordenesPendientes.forEach(({ orden, saldo, cliente }) => {
        const clienteNombre = cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente no encontrado';
        html += `<div class="orden-card"><div class="orden-header"><span class="orden-numero">Orden #${orden.numero}</span><span class="badge badge-${getEstadoClass(orden.estado)}">${orden.estado}</span></div><div class="orden-info"><div class="info-item"><span class="info-label">Cliente:</span> ${clienteNombre}</div><div class="info-item"><span class="info-label">Dispositivo:</span> ${orden.marca} ${orden.modelo}</div><div class="info-item"><span class="info-label">Total:</span> $${orden.presupuesto.toFixed(2)}</div><div class="info-item"><span class="info-label">Anticipo:</span> $${orden.anticipo.toFixed(2)}</div><div class="info-item"><span class="info-label">Saldo:</span> <strong style="color: #f5576c;">$${saldo.toFixed(2)}</strong></div></div><button class="btn-primary" onclick="registrarPago(${orden.id})">💰 Registrar Pago</button></div>`;
    });
    container.innerHTML = html;
}

async function registrarPago(ordenId) {
    const ordenes = Storage.get('ordenes');
    const orden = ordenes.find(o => o.id === ordenId);
    const saldo = (orden.presupuesto || 0) - (orden.anticipo || 0);
    const monto = prompt(`Orden #${orden.numero}\nSaldo pendiente: $${saldo.toFixed(2)}\n\n¿Cuánto deseas registrar como pago?`);
    if (monto && !isNaN(monto) && parseFloat(monto) > 0) {
        const pago = parseFloat(monto);
        if (pago > saldo) {
            alert('El monto ingresado es mayor al saldo pendiente');
            return;
        }
        
        // Solicitar método de pago
        const metodoPago = prompt(`Selecciona el método de pago:\n1. Efectivo\n2. Transferencia\n3. Tarjeta de Crédito/Débito\n\nIngresa el número (1, 2 o 3):`);
        const metodos = {
            '1': { nombre: 'Efectivo', comision: 0 },
            '2': { nombre: 'Transferencia', comision: 0 },
            '3': { nombre: 'Tarjeta', comision: 0 }
        };
        
        if (!metodos[metodoPago]) {
            alert('Método de pago no válido');
            return;
        }
        
        const metodoSeleccionado = metodos[metodoPago];
        const comision = pago * metodoSeleccionado.comision;
        const montoNeto = pago - comision;
        
        orden.anticipo = (orden.anticipo || 0) + pago;
        
        // Registrar el pago en el historial con fecha actual y método de pago
        if (!orden.historialPagos) {
            orden.historialPagos = [];
        }
        orden.historialPagos.push({
            monto: pago,
            montoNeto: montoNeto,
            comision: comision,
            metodoPago: metodoSeleccionado.nombre,
            fecha: new Date().toISOString(),
            tipo: 'Pago'
        });
        
        await Storage.saveAndSync('ordenes', ordenes);
        
        let mensajePago = `Pago registrado exitosamente!\nMétodo: ${metodoSeleccionado.nombre}\nMonto: $${formatearMonto(pago)}`;
        if (comision > 0) {
            mensajePago += `\nComisión: $${formatearMonto(comision)} (${(metodoSeleccionado.comision * 100)}%)\nMonto neto: $${formatearMonto(montoNeto)}`;
        }
        mensajePago += `\nNuevo saldo: $${formatearMonto(saldo - pago)}`;
        
        alert(mensajePago);
        if (confirm('¿Deseas imprimir el recibo de pago?')) {
            imprimirReciboPago(ordenId, pago);
        }
        cargarPagos();
        if (document.getElementById('ordenes').classList.contains('active')) {
            cargarOrdenes();
        }
    }
}

async function imprimirReciboPago(ordenId, montoPago) {
    const ordenes = Storage.get('ordenes');
    const clientes = Storage.get('clientes');
    const orden = ordenes.find(o => o.id === ordenId);
    const cliente = clientes.find(c => c.id === orden.clienteId);
    const saldo = (orden.presupuesto || 0) - (orden.anticipo || 0);
    
    // Obtener configuración del taller
    const config = await obtenerConfiguracionTaller();
    const nombreTaller = config?.nombreTaller || 'TALLER DE REPARACIONES';
    const direccionTaller = config?.direccionTaller || '';
    const telefonoTaller = config?.telefonoTaller || '';
    const emailTaller = config?.emailTaller || '';
    const logoUrl = config?.logoUrl || null;
    
    // Construir HTML del encabezado con logo si existe
    let encabezadoHTML = '<div style="text-align: center; margin-bottom: 20px;">';
    if (logoUrl) {
        encabezadoHTML += `<img src="${logoUrl}" style="max-width: 80px; max-height: 80px; object-fit: contain; margin-bottom: 10px;" alt="Logo">`;
    }
    encabezadoHTML += `<h2 style="margin: 0;">🔧 ${nombreTaller}</h2>`;
    if (direccionTaller) {
        encabezadoHTML += `<p style="margin: 3px 0; font-size: 10px;">${direccionTaller}</p>`;
    }
    if (telefonoTaller) {
        encabezadoHTML += `<p style="margin: 3px 0; font-size: 10px;">Tel: ${telefonoTaller}</p>`;
    }
    if (emailTaller) {
        encabezadoHTML += `<p style="margin: 3px 0; font-size: 10px;">Email: ${emailTaller}</p>`;
    }
    encabezadoHTML += '<p style="margin: 5px 0;">RECIBO DE PAGO</p></div>';
    
    const recibo = `<div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 2px solid #333;">${encabezadoHTML}<hr style="border: 1px solid #333;"><div style="margin: 15px 0;"><p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p><p><strong>Orden:</strong> #${orden.numero}</p><p><strong>Cliente:</strong> ${cliente.nombre} ${cliente.apellido}</p><p><strong>Celular:</strong> ${cliente.celular}</p></div><hr style="border: 1px dashed #666;"><div style="margin: 15px 0;"><p><strong>Dispositivo:</strong> ${orden.marca} ${orden.modelo}</p><p><strong>Total de la reparación:</strong> $${orden.presupuesto.toFixed(2)}</p><p><strong>Pagos anteriores:</strong> $${(orden.anticipo - montoPago).toFixed(2)}</p><p><strong>Pago actual:</strong> <span style="font-size: 1.2em; color: green;">$${montoPago.toFixed(2)}</span></p><p><strong>Saldo pendiente:</strong> <span style="font-size: 1.2em;">$${saldo.toFixed(2)}</span></p></div><hr style="border: 1px solid #333;"><div style="margin-top: 30px; text-align: center;"><p style="margin: 30px 0 5px;">_____________________</p><p style="margin: 0;">Firma del Cliente</p></div><div style="margin-top: 20px; text-align: center; font-size: 0.9em;"><p>¡Gracias por su confianza!</p></div></div>`;
    const ventana = window.open('', '', 'width=800,height=600');
    ventana.document.write('<html><head><title>Recibo de Pago</title></head><body>');
    ventana.document.write(recibo);
    ventana.document.write('</body></html>');
    ventana.document.close();
    ventana.print();
}

// INVENTARIO
function mostrarFormRepuesto() {
    document.getElementById('formRepuesto').style.display = 'block';
    document.getElementById('repuestoForm').reset();
    document.getElementById('repuestoId').value = '';
}
function cancelarFormRepuesto() {
    document.getElementById('formRepuesto').style.display = 'none';
    document.getElementById('repuestoForm').reset();
    cerrarModalCategoria();
}

// === FUNCIONES PARA AGREGAR NUEVAS CATEGORÍAS ===

// Obtener todas las categorías disponibles
function obtenerCategorias() {
    const categoriasLocal = JSON.parse(localStorage.getItem('categorias') || '[]');
    return categoriasLocal.length > 0 ? categoriasLocal : [
        'Pantallas', 'Baterías', 'Cámaras', 'Conectores', 
        'Altavoces', 'Botones', 'Carcasas', 'Otro'
    ];
}

// Mostrar modal para agregar nueva categoría
function mostrarAgregarCategoria() {
    const modal = document.getElementById('modalNuevaCategoria');
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    document.getElementById('nuevaCategoriaInput').value = '';
    document.getElementById('nuevaCategoriaInput').focus();
}

// Cerrar modal de categoría
function cerrarModalCategoria() {
    document.getElementById('modalNuevaCategoria').style.display = 'none';
    document.getElementById('nuevaCategoriaInput').value = '';
}

// Agregar nueva categoría
function agregarNuevaCategoria() {
    const nombreCategoria = document.getElementById('nuevaCategoriaInput').value.trim();
    
    if (!nombreCategoria) {
        alert('⚠️ Por favor ingresa el nombre de la categoría');
        return;
    }
    
    if (nombreCategoria.length < 2) {
        alert('⚠️ El nombre debe tener al menos 2 caracteres');
        return;
    }
    
    const categorias = obtenerCategorias();
    
    // Verificar si la categoría ya existe
    if (categorias.find(c => c.toLowerCase() === nombreCategoria.toLowerCase())) {
        alert('⚠️ Esta categoría ya existe');
        return;
    }
    
    // Agregar nueva categoría
    categorias.push(nombreCategoria);
    localStorage.setItem('categorias', JSON.stringify(categorias));
    
    // Actualizar los selects de categoría
    actualizarSelectsCategorias();
    
    // Seleccionar automáticamente la nueva categoría
    document.getElementById('repuestoCategoria').value = nombreCategoria;
    
    mostrarNotificacion(`✅ Categoría "${nombreCategoria}" agregada correctamente`, 'success');
    
    cerrarModalCategoria();
}

// Actualizar todos los selects de categoría en la página
function actualizarSelectsCategorias() {
    const categorias = obtenerCategorias();
    const selects = document.querySelectorAll('#repuestoCategoria, #filtroCategoria');
    
    selects.forEach(select => {
        const valorActual = select.value;
        
        // Limpiar opciones excepto la primera
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Agregar todas las categorías
        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            select.appendChild(option);
        });
        
        // Restaurar valor anterior si existe
        if (categorias.includes(valorActual)) {
            select.value = valorActual;
        }
    });
}

// Inicializar selects de categoría cuando carga la página
document.addEventListener('DOMContentLoaded', () => {
    actualizarSelectsCategorias();
});

// Cerrar modal al presionar Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('modalNuevaCategoria');
        if (modal && modal.style.display === 'flex') {
            cerrarModalCategoria();
        }
    }
});

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
    const modal = document.getElementById('modalNuevaCategoria');
    if (modal && e.target === modal) {
        cerrarModalCategoria();
    }
});

document.getElementById('repuestoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const repuestos = Storage.get('repuestos');
    const id = document.getElementById('repuestoId').value;
    
    // Generar código SKU automático si no hay uno o es nuevo repuesto
    let codigoSKU = document.getElementById('repuestoCodigo').value;
    if (!id && !codigoSKU) {
        // Generar SKU secuencial: SKU-0001, SKU-0002, etc.
        const ultimoNumero = repuestos.length > 0 
            ? Math.max(...repuestos.map(r => {
                const match = r.codigo?.match(/SKU-(\d+)/);
                return match ? parseInt(match[1]) : 0;
            }))
            : 0;
        codigoSKU = `SKU-${String(ultimoNumero + 1).padStart(4, '0')}`;
    } else if (id && !codigoSKU) {
        // Si está editando y no tiene código, mantener el anterior o generar uno
        const repuestoAnterior = repuestos.find(r => r.id === parseInt(id));
        codigoSKU = repuestoAnterior?.codigo || `SKU-${String(repuestos.length + 1).padStart(4, '0')}`;
    }
    
    const repuesto = {
        id: id ? parseInt(id) : Storage.getNextId('repuestos'),
        nombre: document.getElementById('repuestoNombre').value,
        categoria: document.getElementById('repuestoCategoria').value,
        compatibilidad: document.getElementById('repuestoCompatibilidad').value,
        codigo: codigoSKU,
        stock: parseInt(document.getElementById('repuestoStock').value),
        stockMinimo: parseInt(document.getElementById('repuestoStockMinimo').value) || 5,
        precioCompra: parseFloat(document.getElementById('repuestoPrecioCompra').value) || 0,
        precioVenta: parseFloat(document.getElementById('repuestoPrecioVenta').value),
        ubicacion: document.getElementById('repuestoUbicacion').value,
        suplidor: document.getElementById('repuestoSuplidor').value || '',
        fechaRegistro: id ? repuestos.find(r => r.id === parseInt(id)).fechaRegistro : new Date().toISOString()
    };
    if (id) {
        const index = repuestos.findIndex(r => r.id === parseInt(id));
        repuestos[index] = repuesto;
    } else {
        repuestos.push(repuesto);
    }
    await Storage.saveAndSync('repuestos', repuestos);
    cancelarFormRepuesto();
    filtrarInventario();
    alert(`Repuesto guardado exitosamente\nCódigo SKU: ${codigoSKU}`);
});

function filtrarInventario() {
    let repuestos = Storage.get('repuestos');
    const totalRepuestos = repuestos.length;
    const filtroCategoria = document.getElementById('filtroCategoria')?.value || '';
    const filtroStock = document.getElementById('filtroStock')?.value || '';
    const inputBusqueda = document.getElementById('busquedaInventario');
    const busqueda = inputBusqueda ? inputBusqueda.value.toLowerCase().trim() : '';
    
    console.log('=== FILTRAR INVENTARIO ===');
    console.log('Total repuestos:', totalRepuestos);
    console.log('Búsqueda:', busqueda);
    console.log('Filtro categoría:', filtroCategoria);
    console.log('Filtro stock:', filtroStock);
    
    // Filtro de búsqueda por texto
    if (busqueda) {
        repuestos = repuestos.filter(r => {
            const nombre = (r.nombre || '').toLowerCase();
            const codigo = (r.codigo || '').toLowerCase();
            const compatibilidad = (r.compatibilidad || '').toLowerCase();
            const categoria = (r.categoria || '').toLowerCase();
            const ubicacion = (r.ubicacion || '').toLowerCase();
            const suplidor = (r.suplidor || '').toLowerCase();
            
            return nombre.includes(busqueda) ||
                   codigo.includes(busqueda) ||
                   compatibilidad.includes(busqueda) ||
                   categoria.includes(busqueda) ||
                   ubicacion.includes(busqueda) ||
                   suplidor.includes(busqueda);
        });
        console.log('Después de búsqueda:', repuestos.length);
    }
    
    if (filtroCategoria) {
        repuestos = repuestos.filter(r => r.categoria === filtroCategoria);
        console.log('Después de categoría:', repuestos.length);
    }
    if (filtroStock === 'bajo') {
        repuestos = repuestos.filter(r => r.stock <= r.stockMinimo && r.stock > 0);
    } else if (filtroStock === 'agotado') {
        repuestos = repuestos.filter(r => r.stock === 0);
    }
    
    const container = document.getElementById('listaInventario');
    if (!container) {
        console.error('No se encontró el contenedor listaInventario');
        return;
    }
    
    if (repuestos.length === 0) {
        if (totalRepuestos === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No hay repuestos registrados</h3><p>Agrega tu primer repuesto al inventario</p></div>';
        } else {
            container.innerHTML = `<div class="empty-state"><h3>No se encontraron resultados</h3><p>No hay repuestos que coincidan con: "${busqueda || 'los filtros seleccionados'}"</p></div>`;
        }
        return;
    }
    
    console.log('Renderizando', repuestos.length, 'repuestos');
    let html = '<table><thead><tr><th>Nombre</th><th>Categoría</th><th>Código/SKU</th><th>Stock</th><th>Precio Compra</th><th>Precio Venta</th><th>Ubicación</th><th>Suplidor</th><th>Acciones</th></tr></thead><tbody>';
    repuestos.forEach(repuesto => {
        const alertaStock = repuesto.stock <= repuesto.stockMinimo ? 'style="background: #ffebee;"' : '';
        const estadoStock = repuesto.stock === 0 ? '❌ Agotado' : repuesto.stock <= repuesto.stockMinimo ? '⚠️ Stock bajo' : '✅';
        html += `<tr ${alertaStock}><td>${repuesto.nombre}${repuesto.compatibilidad ? `<br><small>${repuesto.compatibilidad}</small>` : ''}</td><td>${repuesto.categoria}</td><td>${repuesto.codigo || '-'}</td><td><strong>${repuesto.stock}</strong> ${estadoStock}</td><td>$${repuesto.precioCompra.toFixed(2)}</td><td>$${repuesto.precioVenta.toFixed(2)}</td><td>${repuesto.ubicacion || '-'}</td><td>${repuesto.suplidor || '-'}</td><td><button class="btn-success" onclick="editarRepuesto(${repuesto.id})">Editar</button><button class="btn-secondary" onclick="ajustarStock(${repuesto.id})">Stock</button><button class="btn-danger" onclick="eliminarRepuesto(${repuesto.id})">Eliminar</button></td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
    console.log('Tabla renderizada exitosamente');
}

function editarRepuesto(id) {
    const repuestos = Storage.get('repuestos');
    const repuesto = repuestos.find(r => r.id === id);
    document.getElementById('repuestoId').value = repuesto.id;
    document.getElementById('repuestoNombre').value = repuesto.nombre;
    document.getElementById('repuestoCategoria').value = repuesto.categoria;
    document.getElementById('repuestoCompatibilidad').value = repuesto.compatibilidad;
    document.getElementById('repuestoCodigo').value = repuesto.codigo;
    document.getElementById('repuestoStock').value = repuesto.stock;
    document.getElementById('repuestoStockMinimo').value = repuesto.stockMinimo;
    document.getElementById('repuestoPrecioCompra').value = repuesto.precioCompra;
    document.getElementById('repuestoPrecioVenta').value = repuesto.precioVenta;
    document.getElementById('repuestoUbicacion').value = repuesto.ubicacion;
    document.getElementById('repuestoSuplidor').value = repuesto.suplidor || '';
    document.getElementById('formRepuesto').style.display = 'block';
}

async function ajustarStock(id) {
    const repuestos = Storage.get('repuestos');
    const repuesto = repuestos.find(r => r.id === id);
    const accion = prompt(`Stock actual: ${repuesto.stock}\n\n1. Agregar stock\n2. Reducir stock\n3. Establecer cantidad exacta\n\n¿Qué deseas hacer?`);
    if (!accion) return;
    const cantidad = prompt('Ingresa la cantidad:');
    if (!cantidad || isNaN(cantidad)) return;
    const num = parseInt(cantidad);
    if (accion === '1') {
        repuesto.stock += num;
    } else if (accion === '2') {
        repuesto.stock = Math.max(0, repuesto.stock - num);
    } else if (accion === '3') {
        repuesto.stock = Math.max(0, num);
    }
    await Storage.saveAndSync('repuestos', repuestos);
    filtrarInventario();
}

async function eliminarRepuesto(id) {
    if (!confirm('¿Estás seguro de eliminar este repuesto?')) return;
    let repuestos = Storage.get('repuestos');
    repuestos = repuestos.filter(r => r.id !== id);
    await Storage.saveAndSync('repuestos', repuestos);
    filtrarInventario();
}

// REPORTES
function cambiarTipoReporte() {
    const periodo = document.getElementById('periodoReporte').value;
    const rangoFechas = document.getElementById('rangoFechas');
    
    if (periodo === 'personalizado') {
        rangoFechas.style.display = 'flex';
        // Establecer fechas por defecto (última semana)
        const hoy = new Date();
        const hace7dias = new Date();
        hace7dias.setDate(hace7dias.getDate() - 7);
        
        document.getElementById('fechaFin').valueAsDate = hoy;
        document.getElementById('fechaInicio').valueAsDate = hace7dias;
    } else {
        rangoFechas.style.display = 'none';
        generarReportes();
    }
}

function generarReportes() {
    const periodo = document.getElementById('periodoReporte').value;
    const ordenes = Storage.get('ordenes');
    const clientes = Storage.get('clientes');
    const ahora = new Date();
    let fechaInicio;
    let fechaFin = new Date();
    
    switch(periodo) {
        case 'hoy':
            fechaInicio = new Date(ahora);
            fechaInicio.setHours(0, 0, 0, 0);
            fechaFin.setHours(23, 59, 59, 999);
            break;
        case 'semana':
            // Calcular el inicio de la semana actual (lunes)
            fechaInicio = new Date(ahora);
            const diaSemana = fechaInicio.getDay();
            const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
            fechaInicio.setDate(fechaInicio.getDate() + diasHastaLunes);
            fechaInicio.setHours(0, 0, 0, 0);
            break;
        case 'mes':
            fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
            fechaInicio.setHours(0, 0, 0, 0);
            break;
        case 'año':
            fechaInicio = new Date(ahora.getFullYear(), 0, 1);
            fechaInicio.setHours(0, 0, 0, 0);
            break;
        case 'personalizado':
            const fechaInicioInput = document.getElementById('fechaInicio').value;
            const fechaFinInput = document.getElementById('fechaFin').value;
            
            if (!fechaInicioInput || !fechaFinInput) {
                alert('❌ Por favor selecciona ambas fechas');
                return;
            }
            
            // Crear fechas a partir del input (formato YYYY-MM-DD)
            // Agregar el tiempo para evitar problemas de zona horaria
            fechaInicio = new Date(fechaInicioInput + 'T00:00:00');
            fechaFin = new Date(fechaFinInput + 'T23:59:59');
            break;
        default:
            fechaInicio = new Date(0);
    }
    
    const ordenesFiltradas = ordenes.filter(o => {
        // Usar fechaEntrega si existe (fecha en que se marcó como entregado)
        // Si no existe, usar fechaCreacion (órdenes antiguas)
        const fechaOrden = new Date(o.fechaEntrega || o.fechaCreacion);
        
        // Normalizar la fecha de la orden al inicio del día para comparación exacta
        const fechaOrdenNormalizada = new Date(fechaOrden.getFullYear(), fechaOrden.getMonth(), fechaOrden.getDate());
        const fechaInicioNormalizada = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
        const fechaFinNormalizada = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate());
        
        return fechaOrdenNormalizada >= fechaInicioNormalizada && 
               fechaOrdenNormalizada <= fechaFinNormalizada && 
               o.estado === 'Entregado';
    });
    let ingresosTotales = 0;
    ordenesFiltradas.forEach(orden => {
        ingresosTotales += orden.presupuesto || 0;
    });
    const promedioPorOrden = ordenesFiltradas.length > 0 ? ingresosTotales / ordenesFiltradas.length : 0;
    
    // Calcular dinero en efectivo vs banco y comisiones
    let dineroEfectivo = 0;
    let dineroBanco = 0;
    let comisionesTotales = 0;
    
    ordenesFiltradas.forEach(orden => {
        if (orden.historialPagos && orden.historialPagos.length > 0) {
            orden.historialPagos.forEach(pago => {
                const metodoPago = pago.metodoPago || 'Efectivo';
                const comision = pago.comision || 0;
                
                if (metodoPago === 'Efectivo') {
                    dineroEfectivo += pago.monto;
                } else {
                    dineroBanco += (pago.montoNeto || pago.monto);
                    comisionesTotales += comision;
                }
            });
        } else {
            // Fallback para órdenes sin historial: asumir efectivo
            dineroEfectivo += (orden.anticipo || 0);
        }
    });
    
    // Calcular ganancia neta para las tarjetas superiores (restando comisiones y gastos)
    let gananciaNetaTotal = 0;
    ordenesFiltradas.forEach(orden => {
        const presupuesto = orden.presupuesto || 0;
        const costoPiezas = orden.costoPiezas || 0;
        
        let costoRepuestosOrden = 0;
        if (orden.repuestos && orden.repuestos.length > 0) {
            orden.repuestos.forEach(repuesto => {
                costoRepuestosOrden += (repuesto.precio * repuesto.cantidad);
            });
        }
        
        // Calcular comisiones de esta orden
        let comisionesOrden = 0;
        if (orden.historialPagos && orden.historialPagos.length > 0) {
            orden.historialPagos.forEach(pago => {
                comisionesOrden += (pago.comision || 0);
            });
        }
        
        gananciaNetaTotal += (presupuesto - costoPiezas - costoRepuestosOrden - comisionesOrden);
    });
    
    // Agregar ganancias de órdenes de tienda cobradas
    const allOrdenes = Storage.get('ordenes') || [];
    allOrdenes.forEach(orden => {
        // Si la orden es de tienda, está en "Listo para Entrega" o "Entregado", y está marcada como cobrada
        if (orden.tiendaId && (orden.estado === 'Listo para Entrega' || orden.estado === 'Entregado') && orden.cobrado) {
            const fechaOrden = new Date(orden.fechaCreacion);
            const fechaOrdenNormalizada = new Date(fechaOrden.getFullYear(), fechaOrden.getMonth(), fechaOrden.getDate());
            const fechaInicioNormalizada = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
            const fechaFinNormalizada = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate());
            
            if (fechaOrdenNormalizada >= fechaInicioNormalizada && fechaOrdenNormalizada <= fechaFinNormalizada) {
                const presupuesto = parseFloat(orden.presupuesto) || 0;
                const costoPiezas = parseFloat(orden.costoPiezas) || 0;
                
                let costoRepuestosOrden = 0;
                if (orden.repuestos && orden.repuestos.length > 0) {
                    orden.repuestos.forEach(repuesto => {
                        costoRepuestosOrden += (repuesto.precio * repuesto.cantidad);
                    });
                }
                
                // Calcular comisiones
                let comisionesOrden = 0;
                if (orden.historialPagos && orden.historialPagos.length > 0) {
                    orden.historialPagos.forEach(pago => {
                        comisionesOrden += (pago.comision || 0);
                    });
                }
                
                gananciaNetaTotal += (presupuesto - costoPiezas - costoRepuestosOrden - comisionesOrden);
            }
        }
    });
    
    // Calcular gastos del período
    const gastos = Storage.get('gastos') || [];
    let gastosDelPeriodo = 0;
    
    console.log('🔍 Calculando gastos del período...');
    console.log('Total de gastos en localStorage:', gastos.length);
    console.log('Período filtrado:', fechaInicio.toISOString().split('T')[0], 'a', fechaFin.toISOString().split('T')[0]);
    
    gastos.forEach(gasto => {
        const fechaGasto = new Date(gasto.fecha + 'T00:00:00'); // Asegurar formato correcto
        const fechaGastoNormalizada = new Date(fechaGasto.getFullYear(), fechaGasto.getMonth(), fechaGasto.getDate());
        const fechaInicioNormalizada = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
        const fechaFinNormalizada = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate());
        
        if (fechaGastoNormalizada >= fechaInicioNormalizada && fechaGastoNormalizada <= fechaFinNormalizada) {
            const montoGasto = parseFloat(gasto.monto) || 0;
            gastosDelPeriodo += montoGasto;
            console.log(`✅ Gasto incluido: ${gasto.descripcion} - $${montoGasto} (${gasto.fecha})`);
        }
    });
    
    console.log('💸 Total gastos del período:', gastosDelPeriodo);
    
    // Restar gastos de la ganancia neta
    gananciaNetaTotal -= gastosDelPeriodo;
    
    console.log('📊 Ganancia Neta Total (con gastos restados):', gananciaNetaTotal);
    
    document.getElementById('reporteIngresos').textContent = `$${formatearMonto(ingresosTotales)}`;
    document.getElementById('reporteCompletadas').textContent = ordenesFiltradas.length;
    document.getElementById('reportePromedio').textContent = `$${formatearMonto(promedioPorOrden)}`;
    document.getElementById('reporteGananciaNeta').textContent = `$${formatearMonto(gananciaNetaTotal)}`;
    const dispositivos = {};
    ordenesFiltradas.forEach(orden => {
        const key = `${orden.marca} ${orden.modelo}`;
        dispositivos[key] = (dispositivos[key] || 0) + 1;
    });
    const topDispositivos = Object.entries(dispositivos).sort((a, b) => b[1] - a[1]).slice(0, 5);
    let htmlDispositivos = '<table><thead><tr><th>Dispositivo</th><th>Cantidad</th></tr></thead><tbody>';
    if (topDispositivos.length > 0) {
        topDispositivos.forEach(([dispositivo, cantidad]) => {
            htmlDispositivos += `<tr><td>${dispositivo}</td><td><strong>${cantidad}</strong></td></tr>`;
        });
    } else {
        htmlDispositivos += '<tr><td colspan="2">No hay datos disponibles</td></tr>';
    }
    htmlDispositivos += '</tbody></table>';
    document.getElementById('topDispositivos').innerHTML = htmlDispositivos;
    
    // Desglose de ganancias
    let gananciaReal = 0;
    let costosTotalesPiezas = 0;
    let costosTotalesRepuestos = 0;
    let anticiposTotales = 0;
    let comisionesTotalesReporte = 0;
    let ingresosTiendasCobradas = 0;
    
    ordenesFiltradas.forEach(orden => {
        const presupuesto = orden.presupuesto || 0;
        const costoPiezas = orden.costoPiezas || 0;
        
        // Calcular costo de repuestos del inventario
        let costoRepuestosOrden = 0;
        if (orden.repuestos && orden.repuestos.length > 0) {
            orden.repuestos.forEach(repuesto => {
                costoRepuestosOrden += (repuesto.precio * repuesto.cantidad);
            });
        }
        
        // Calcular comisiones bancarias de esta orden
        let comisionesOrden = 0;
        if (orden.historialPagos && orden.historialPagos.length > 0) {
            orden.historialPagos.forEach(pago => {
                comisionesOrden += (pago.comision || 0);
            });
        }
        
        costosTotalesPiezas += costoPiezas;
        costosTotalesRepuestos += costoRepuestosOrden;
        comisionesTotalesReporte += comisionesOrden;
        anticiposTotales += orden.anticipo || 0;
    });
    
    // Agregar ingresos y costos de órdenes de tienda cobradas
    allOrdenes.forEach(orden => {
        if (orden.tiendaId && (orden.estado === 'Listo para Entrega' || orden.estado === 'Entregado') && orden.cobrado) {
            const fechaOrden = new Date(orden.fechaCreacion);
            const fechaOrdenNormalizada = new Date(fechaOrden.getFullYear(), fechaOrden.getMonth(), fechaOrden.getDate());
            const fechaInicioNormalizada = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
            const fechaFinNormalizada = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate());
            
            if (fechaOrdenNormalizada >= fechaInicioNormalizada && fechaOrdenNormalizada <= fechaFinNormalizada) {
                const presupuesto = parseFloat(orden.presupuesto) || 0;
                const costoPiezas = parseFloat(orden.costoPiezas) || 0;
                
                let costoRepuestosOrden = 0;
                if (orden.repuestos && orden.repuestos.length > 0) {
                    orden.repuestos.forEach(repuesto => {
                        costoRepuestosOrden += (repuesto.precio * repuesto.cantidad);
                    });
                }
                
                let comisionesOrden = 0;
                if (orden.historialPagos && orden.historialPagos.length > 0) {
                    orden.historialPagos.forEach(pago => {
                        comisionesOrden += (pago.comision || 0);
                    });
                }
                
                ingresosTiendasCobradas += presupuesto;
                costosTotalesPiezas += costoPiezas;
                costosTotalesRepuestos += costoRepuestosOrden;
                comisionesTotalesReporte += comisionesOrden;
            }
        }
    });
    
    // Sumar ingresos de tiendas cobradas al total
    const ingresosTotalesConTiendas = ingresosTotales + ingresosTiendasCobradas;
    
    // Usar el mismo valor de gastos calculado anteriormente
    const gastosTotalesReporte = gastosDelPeriodo;
    
    // Ganancia Real = Presupuesto - (Costo Piezas + Costo Repuestos + Comisiones + Gastos)
    gananciaReal = ingresosTotalesConTiendas - costosTotalesPiezas - costosTotalesRepuestos - comisionesTotalesReporte - gastosTotalesReporte;
    
    console.log('📈 Desglose de Ganancia Real:');
    console.log('  Ingresos (clientes):', ingresosTotales);
    console.log('  Ingresos (tiendas cobradas):', ingresosTiendasCobradas);
    console.log('  Ingresos Totales:', ingresosTotalesConTiendas);
    console.log('  - Costos Piezas:', costosTotalesPiezas);
    console.log('  - Costos Repuestos:', costosTotalesRepuestos);
    console.log('  - Comisiones:', comisionesTotalesReporte);
    console.log('  - Gastos:', gastosTotalesReporte);
    console.log('  = Ganancia Real:', gananciaReal);
    
    const porcentajeGanancia = ingresosTotalesConTiendas > 0 ? (gananciaReal / ingresosTotalesConTiendas * 100) : 0;
    const porcentajeCostosPiezas = ingresosTotalesConTiendas > 0 ? (costosTotalesPiezas / ingresosTotalesConTiendas * 100) : 0;
    const porcentajeCostosRepuestos = ingresosTotalesConTiendas > 0 ? (costosTotalesRepuestos / ingresosTotalesConTiendas * 100) : 0;
    const porcentajeComisiones = ingresosTotalesConTiendas > 0 ? (comisionesTotalesReporte / ingresosTotalesConTiendas * 100) : 0;
    const porcentajeGastos = ingresosTotalesConTiendas > 0 ? (gastosTotalesReporte / ingresosTotalesConTiendas * 100) : 0;
    
    let htmlGanancias = '<table><thead><tr><th>Concepto</th><th>Monto</th><th>Porcentaje</th></tr></thead><tbody>';
    htmlGanancias += `<tr style="background: #c8e6c9; font-weight: bold;"><td><strong>💰 TOTAL COBRADO</strong></td><td><strong>$${formatearMonto(ingresosTotalesConTiendas)}</strong></td><td>100%</td></tr>`;
    if (ingresosTiendasCobradas > 0) {
        htmlGanancias += `<tr style="background: #e3f2fd;"><td><strong>🏪 Ingresos Tiendas (Cobradas)</strong></td><td><strong>$${formatearMonto(ingresosTiendasCobradas)}</strong></td><td>${(ingresosTiendasCobradas / ingresosTotalesConTiendas * 100).toFixed(1)}%</td></tr>`;
    }
    htmlGanancias += `<tr style="background: #ffebee;"><td><strong>🔧 Costos Piezas Externas</strong></td><td><strong>-$${formatearMonto(costosTotalesPiezas)}</strong></td><td>-${porcentajeCostosPiezas.toFixed(1)}%</td></tr>`;
    htmlGanancias += `<tr style="background: #fce4ec;"><td><strong>📦 Costos Repuestos</strong></td><td><strong>-$${formatearMonto(costosTotalesRepuestos)}</strong></td><td>-${porcentajeCostosRepuestos.toFixed(1)}%</td></tr>`;
    htmlGanancias += `<tr style="background: #fff3e0;"><td><strong>🏦 Comisiones Bancarias</strong></td><td><strong>-$${formatearMonto(comisionesTotalesReporte)}</strong></td><td>-${porcentajeComisiones.toFixed(1)}%</td></tr>`;
    htmlGanancias += `<tr style="background: #ffe0e0;"><td><strong>💸 Gastos de Utilería</strong></td><td><strong>-$${formatearMonto(gastosTotalesReporte)}</strong></td><td>-${porcentajeGastos.toFixed(1)}%</td></tr>`;
    htmlGanancias += `<tr style="background: #e8f5e9; font-weight: bold; font-size: 1.1em;"><td><strong>✅ GANANCIA NETA</strong></td><td><strong>$${formatearMonto(gananciaReal)}</strong></td><td>${porcentajeGanancia.toFixed(1)}%</td></tr>`;
    htmlGanancias += `<tr style="background: #fff9c4;"><td><strong>💵 Anticipos Recibidos</strong></td><td><strong>$${formatearMonto(anticiposTotales)}</strong></td><td>${ingresosTotales > 0 ? (anticiposTotales / ingresosTotales * 100).toFixed(1) : 0}%</td></tr>`;
    htmlGanancias += '</tbody></table>';
    document.getElementById('desgloseganancias').innerHTML = htmlGanancias;
    
    // Nuevo: Desglose de métodos de pago (Efectivo vs Banco)
    const porcentajeEfectivo = ingresosTotales > 0 ? (dineroEfectivo / ingresosTotales * 100) : 0;
    const porcentajeBanco = ingresosTotales > 0 ? (dineroBanco / ingresosTotales * 100) : 0;
    
    let htmlMetodosPago = '<h3 style="margin: 30px 0 15px 0; color: #333;">💳 Métodos de Pago Recibidos</h3>';
    htmlMetodosPago += '<table><thead><tr><th>Método de Pago</th><th>Monto</th><th>Porcentaje</th></tr></thead><tbody>';
    htmlMetodosPago += `<tr style="background: #c8e6c9;"><td><strong>💵 Efectivo</strong></td><td><strong>$${formatearMonto(dineroEfectivo)}</strong></td><td>${porcentajeEfectivo.toFixed(1)}%</td></tr>`;
    htmlMetodosPago += `<tr style="background: #b3e5fc;"><td><strong>🏦 Dinero en Banco</strong></td><td><strong>$${formatearMonto(dineroBanco)}</strong></td><td>${porcentajeBanco.toFixed(1)}%</td></tr>`;
    htmlMetodosPago += `<tr style="background: #ffebee;"><td><strong>📉 Comisiones Pagadas</strong></td><td><strong>-$${formatearMonto(comisionesTotales)}</strong></td><td>-${porcentajeComisiones.toFixed(1)}%</td></tr>`;
    htmlMetodosPago += `<tr style="background: #e8eaf6; font-weight: bold;"><td><strong>💰 Total Cobrado Bruto</strong></td><td><strong>$${formatearMonto(dineroEfectivo + dineroBanco + comisionesTotales)}</strong></td><td>100%</td></tr>`;
    htmlMetodosPago += '</tbody></table>';
    
    // Insertar después del desglose de ganancias
    const desgloseElement = document.getElementById('desgloseganancias');
    if (desgloseElement && desgloseElement.nextElementSibling) {
        desgloseElement.insertAdjacentHTML('afterend', htmlMetodosPago);
    } else if (desgloseElement) {
        desgloseElement.insertAdjacentHTML('afterend', htmlMetodosPago);
    }
    
    // Resumen de Ingresos sin inversiones
    const saldosPendientes = ingresosTotales - anticiposTotales;
    const porcentajeSaldo = ingresosTotales > 0 ? (saldosPendientes / ingresosTotales * 100) : 0;
    const porcentajeAnticipos = ingresosTotales > 0 ? (anticiposTotales / ingresosTotales * 100) : 0;
    
    let htmlIngresos = '<table><thead><tr><th>Concepto</th><th>Monto</th><th>Porcentaje</th></tr></thead><tbody>';
    htmlIngresos += `<tr style="background: #e3f2fd;"><td><strong>💰 Total Cobrado</strong></td><td><strong>$${formatearMonto(ingresosTotales)}</strong></td><td>100%</td></tr>`;
    htmlIngresos += `<tr style="background: #c8e6c9;"><td><strong>✅ Anticipos Recibidos</strong></td><td><strong>$${formatearMonto(anticiposTotales)}</strong></td><td>${porcentajeAnticipos.toFixed(1)}%</td></tr>`;
    htmlIngresos += `<tr style="background: #fff9c4;"><td><strong>⏳ Saldo Pendiente</strong></td><td><strong>$${formatearMonto(saldosPendientes)}</strong></td><td>${porcentajeSaldo.toFixed(1)}%</td></tr>`;
    htmlIngresos += `<tr style="background: #f3e5f5;"><td><strong>📊 Promedio por Orden</strong></td><td><strong>$${formatearMonto(promedioPorOrden)}</strong></td><td>-</td></tr>`;
    htmlIngresos += `<tr style="background: #e8eaf6;"><td><strong>📦 Órdenes Completadas</strong></td><td><strong>${ordenesFiltradas.length}</strong></td><td>-</td></tr>`;
    htmlIngresos += '</tbody></table>';
    document.getElementById('resumenIngresos').innerHTML = htmlIngresos;
    
    const clientesReparaciones = {};
    ordenesFiltradas.forEach(orden => {
        clientesReparaciones[orden.clienteId] = (clientesReparaciones[orden.clienteId] || 0) + 1;
    });
    const topClientes = Object.entries(clientesReparaciones).sort((a, b) => b[1] - a[1]).slice(0, 5);
    let htmlClientes = '<table><thead><tr><th>Cliente</th><th>Reparaciones</th></tr></thead><tbody>';
    if (topClientes.length > 0) {
        topClientes.forEach(([clienteId, cantidad]) => {
            const cliente = clientes.find(c => c.id === parseInt(clienteId));
            if (cliente) {
                htmlClientes += `<tr><td>${cliente.nombre} ${cliente.apellido}</td><td><strong>${cantidad}</strong></td></tr>`;
            }
        });
    } else {
        htmlClientes += '<tr><td colspan="2">No hay datos disponibles</td></tr>';
    }
    htmlClientes += '</tbody></table>';
    document.getElementById('topClientes').innerHTML = htmlClientes;
}

function exportarDatos() {
    const datos = {
        clientes: Storage.get('clientes'),
        ordenes: Storage.get('ordenes'),
        repuestos: Storage.get('repuestos'),
        fechaExportacion: new Date().toISOString()
    };
    const dataStr = JSON.stringify(datos, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-taller-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    alert('Datos exportados exitosamente');
}

function imprimirReporte() {
    window.print();
}

// Exportar funciones de reportes
window.cambiarTipoReporte = cambiarTipoReporte;
window.generarReportes = generarReportes;

// IMPRESIÓN
async function enviarWhatsApp(ordenId) {
    const ordenes = Storage.get('ordenes');
    const clientes = Storage.get('clientes');
    const orden = ordenes.find(o => o.id === ordenId);
    const cliente = clientes.find(c => c.id === orden.clienteId);
    
    // Generar PDF y obtener el blob
    const pdfBlob = await generarPDFFacturaBlob(orden, cliente);
    const mensaje = `Hola ${cliente.nombre}, adjunto encontrarás la factura de tu orden #${orden.numero}. ¡Gracias por tu confianza!`;
    const nombreArchivo = `Orden_${orden.numero}_${cliente.nombre}_${cliente.apellido}.pdf`;
    
    // Intentar usar Web Share API (funciona en Safari iOS/macOS)
    if (navigator.share && navigator.canShare) {
        try {
            const file = new File([pdfBlob], nombreArchivo, { type: 'application/pdf' });
            
            // Verificar si se puede compartir el archivo
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Orden #${orden.numero}`,
                    text: mensaje,
                    files: [file]
                });
                return;
            }
        } catch (error) {
            console.log('Web Share API no disponible o cancelado:', error);
        }
    }
    
    // Fallback: descargar PDF y abrir WhatsApp
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfBlob);
    link.download = nombreArchivo;
    link.click();
    URL.revokeObjectURL(link.href);
    
    setTimeout(() => {
        const urlWhatsApp = `https://wa.me/${cliente.celular.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(mensaje)}`;
        window.open(urlWhatsApp, '_blank');
        alert('PDF descargado. Por favor, adjunta el archivo desde tus descargas en WhatsApp.');
    }, 500);
}

function generarPDFFacturaBlob(orden, cliente) {
    return new Promise(async (resolve) => {
        console.log('📄 Generando PDF de factura...');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Obtener configuración del taller
        console.log('🔍 Obteniendo configuración del taller...');
        const config = await obtenerConfiguracionTaller();
        console.log('📦 Configuración obtenida:', config);
        
        const nombreTaller = config?.nombreTaller || 'TALLER DE REPARACIONES';
        const direccionTaller = config?.direccionTaller || '';
        const telefonoTaller = config?.telefonoTaller || '';
        const emailTaller = config?.emailTaller || '';
        const politicasTexto = config?.politicasTaller || 'Luego de su equipo ser arreglado tiene un plazo de 15 días para retirarlo. Si pasa de un mes pasa al taller de repuesto si no está pago.';
        const logoUrl = config?.logoUrl || null;
        
        console.log('✏️ Datos para PDF:', { nombreTaller, direccionTaller, telefonoTaller, emailTaller, tienelogo: !!logoUrl });
        
        const saldo = (orden.presupuesto || 0) - (orden.anticipo || 0);
        const garantiaTexto = orden.tieneGarantia !== false ? `${orden.garantia} días` : 'Sin garantía';
        
        // Configuración de fuente y estilos
        let y = 15;
    
    // Logo (si existe)
    if (logoUrl) {
        try {
            console.log('🖼️ Agregando logo al PDF...');
            doc.addImage(logoUrl, 'JPEG', 15, y, 30, 30);
            y += 5;
        } catch (error) {
            console.log('❌ No se pudo agregar el logo:', error);
        }
    }
    
    // Encabezado
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(nombreTaller, 105, logoUrl ? y + 8 : y, { align: 'center' });
    y += logoUrl ? 13 : 7;
    
    // Información de contacto del taller
    if (direccionTaller || telefonoTaller || emailTaller) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (direccionTaller) {
            doc.text(direccionTaller, 105, y, { align: 'center' });
            y += 4;
        }
        if (telefonoTaller) {
            doc.text(`Tel: ${telefonoTaller}`, 105, y, { align: 'center' });
            y += 4;
        }
        if (emailTaller) {
            doc.text(`Email: ${emailTaller}`, 105, y, { align: 'center' });
            y += 4;
        }
        y += 2;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDEN DE SERVICIO', 105, y, { align: 'center' });
    y += 10;
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(15, y, 195, y);
    y += 8;
    
    // Información de orden
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Orden: #${orden.numero}`, 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${formatearFecha(orden.fechaIngreso)}`, 120, y);
    y += 6;
    if (orden.fechaEstimada) {
        doc.text(`Entrega estimada: ${formatearFecha(orden.fechaEstimada)}`, 15, y);
        y += 6;
    }
    y += 3;
    
    // DATOS DEL CLIENTE
    doc.setLineWidth(0.2);
    doc.line(15, y, 195, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 15, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${cliente.nombre} ${cliente.apellido}`, 15, y);
    y += 5;
    doc.text(`Celular: ${cliente.celular}`, 15, y);
    y += 5;
    if (cliente.email) {
        doc.text(`Email: ${cliente.email}`, 15, y);
        y += 5;
    }
    y += 3;
    
    // DATOS DEL EQUIPO
    doc.setLineWidth(0.2);
    doc.line(15, y, 195, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL EQUIPO', 15, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Tipo: ${orden.tipoDispositivo}`, 15, y);
    y += 5;
    doc.text(`Marca: ${orden.marca}`, 15, y);
    doc.text(`Modelo: ${orden.modelo}`, 120, y);
    y += 5;
    if (orden.imei) {
        doc.text(`IMEI/Serie: ${orden.imei}`, 15, y);
        y += 5;
    }
    if (orden.accesorios) {
        doc.text(`Accesorios: ${orden.accesorios}`, 15, y);
        y += 5;
    }
    y += 3;
    
    // PROBLEMA REPORTADO
    doc.setLineWidth(0.2);
    doc.line(15, y, 195, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('PROBLEMA REPORTADO', 15, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    const problemaLines = doc.splitTextToSize(orden.problema, 175);
    doc.text(problemaLines, 15, y);
    y += problemaLines.length * 5 + 3;
    
    // INSPECCIÓN DEL EQUIPO (si existe)
    if (orden.inspeccion && orden.inspeccion.seccion && orden.inspeccion.items && orden.inspeccion.items.length > 0) {
        doc.setLineWidth(0.2);
        doc.line(15, y, 195, y);
        y += 6;
        doc.setFont('helvetica', 'bold');
        const tituloInspeccion = orden.inspeccion.seccion === 'equipos-encendidos' 
            ? '🔥 PIEZAS PROBADAS (EQUIPO ENCENDIDO)' 
            : '⚫ CARACTERÍSTICAS DEL EQUIPO APAGADO';
        doc.text(tituloInspeccion, 15, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        orden.inspeccion.items.forEach(item => {
            doc.text(`✓ ${item}`, 20, y);
            y += 5;
        });
        doc.setFontSize(10);
        y += 2;
    }
    
    // NOTAS (si existen)
    if (orden.notas) {
        doc.setLineWidth(0.2);
        doc.line(15, y, 195, y);
        y += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('NOTAS', 15, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        const notasLines = doc.splitTextToSize(orden.notas, 175);
        doc.text(notasLines, 15, y);
        y += notasLines.length * 5 + 3;
    }
    
    // INFORMACIÓN DE PAGO
    doc.setLineWidth(0.5);
    doc.line(15, y, 195, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('INFORMACIÓN DE PAGO', 15, y);
    y += 7;
    doc.setFontSize(10);
    
    if (orden.presupuesto) {
        doc.setFont('helvetica', 'normal');
        doc.text(`Presupuesto:`, 15, y);
        doc.setFont('helvetica', 'bold');
        doc.text(`$${orden.presupuesto.toFixed(2)}`, 60, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Anticipo:`, 15, y);
        doc.text(`$${(orden.anticipo || 0).toFixed(2)}`, 60, y);
        y += 6;
        
        doc.text(`Saldo:`, 15, y);
        doc.setFont('helvetica', 'bold');
        doc.text(`$${saldo.toFixed(2)}`, 60, y);
        y += 6;
    } else {
        doc.setFont('helvetica', 'italic');
        doc.text('Presupuesto pendiente', 15, y);
        y += 6;
    }
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Garantía: ${garantiaTexto}`, 15, y);
    y += 10;
    
    // POLÍTICAS DEL TALLER (personalizadas)
    doc.setFillColor(255, 243, 205);
    const politicasLines = doc.splitTextToSize(politicasTexto, 170);
    const boxHeight = 10 + (politicasLines.length * 4);
    doc.rect(15, y, 180, boxHeight, 'F');
    doc.setLineWidth(0.3);
    doc.setDrawColor(255, 193, 7);
    doc.rect(15, y, 180, boxHeight);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('POLÍTICAS DEL TALLER', 105, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(politicasLines, 105, y, { align: 'center' });
    y += boxHeight - 5;
    
    // Firma del cliente
    y += 10;
    doc.setFontSize(10);
    doc.line(15, y, 85, y);
    y += 5;
    doc.text('Firma del Cliente', 15, y);
    
    // Estado y agradecimiento
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.text(`Estado: ${orden.estado}`, 105, y, { align: 'center' });
    y += 6;
    doc.setFont('helvetica', 'italic');
    doc.text('¡Gracias por su confianza!', 105, y, { align: 'center' });
    
    // Retornar el PDF como Blob
    const pdfBlob = doc.output('blob');
    resolve(pdfBlob);
    });
}

// Variable global para almacenar temporalmente el ID de la orden a imprimir
// Variable global para almacenar temporalmente el ID de la orden a imprimir
let ordenIdTemporal = null;

// Función principal que abre el modal de selección
function imprimirRecibo(ordenId) {
    console.log('📝 imprimirRecibo llamado con ID:', ordenId, 'Tipo:', typeof ordenId);
    
    if (!ordenId) {
        alert('Error: ID de orden inválido');
        console.error('❌ ordenId es undefined o null');
        return;
    }
    
    ordenIdTemporal = ordenId;
    console.log('✅ ordenIdTemporal guardado:', ordenIdTemporal);
    document.getElementById('modalSeleccionImpresion').style.display = 'block';
}

// Función para cerrar el modal de selección
function cerrarModalSeleccionImpresion() {
    document.getElementById('modalSeleccionImpresion').style.display = 'none';
    ordenIdTemporal = null;
}

// Función para imprimir la factura completa (80mm)
async function imprimirFacturaCompleta() {
    console.log('🗄️ imprimirFacturaCompleta llamada, ordenIdTemporal:', ordenIdTemporal);
    
    if (!ordenIdTemporal) {
        alert('Error: No se ha seleccionado ninguna orden');
        cerrarModalSeleccionImpresion();
        return;
    }
    
    // Guardar el ID localmente ANTES de cerrar el modal
    const ordenId = ordenIdTemporal;
    cerrarModalSeleccionImpresion();
    
    console.log('✅ ID de orden capturado:', ordenId);
    
    // Intentar cargar datos actualizados desde Firebase (sin sobrescribir si falla)
    const usuario = firebase.auth().currentUser;
    if (usuario) {
        try {
            const ordenesFirebase = await Storage.loadFromFirebase(usuario.uid, 'ordenes');
            const clientesFirebase = await Storage.loadFromFirebase(usuario.uid, 'clientes');
            
            // Solo actualizar si se cargaron datos
            if (ordenesFirebase && ordenesFirebase.length > 0) {
                Storage.set('ordenes', ordenesFirebase);
            }
            if (clientesFirebase && clientesFirebase.length > 0) {
                Storage.set('clientes', clientesFirebase);
            }
        } catch (error) {
            console.warn('⚠️ No se pudieron cargar datos desde Firebase, usando datos locales:', error);
        }
    }
    
    const ordenes = Storage.get('ordenes');
    const clientes = Storage.get('clientes');
    
    console.log('🔍 Buscando orden:', ordenId, 'Tipo:', typeof ordenId);
    console.log('📋 Órdenes disponibles:', ordenes.map(o => ({id: o.id, tipo: typeof o.id, numero: o.numero})));
    
    // Convertir ordenId a número si es string
    const ordenIdNumero = typeof ordenId === 'string' ? parseInt(ordenId) : ordenId;
    const orden = ordenes.find(o => o.id === ordenIdNumero);
    
    if (!orden) {
        console.error('❌ Orden no encontrada. ID buscado:', ordenIdNumero);
        alert('Error: No se encontró la orden. Por favor, recarga la página e intenta nuevamente.');
        return;
    }
    
    const cliente = clientes.find(c => c.id === orden.clienteId);
    
    // Obtener configuración del taller
    const config = await obtenerConfiguracionTaller();
    const nombreTaller = config?.nombreTaller || 'TALLER DE REPARACIONES';
    const direccionTaller = config?.direccionTaller || '';
    const telefonoTaller = config?.telefonoTaller || '';
    const emailTaller = config?.emailTaller || '';
    const politicasTexto = config?.politicasTaller || 'Luego de su equipo ser arreglado tiene un plazo de 15 días para retirarlo. Si pasa de un mes pasa al taller de repuesto si no está pago.';
    const logoUrl = config?.logoUrl || null;
    
    // Construir HTML del encabezado con logo si existe
    let encabezadoHTML = '<div style="text-align: center; margin-bottom: 8px;">';
    if (logoUrl) {
        encabezadoHTML += `<img src="${logoUrl}" style="max-width: 60px; max-height: 60px; object-fit: contain; margin-bottom: 5px;" alt="Logo">`;
    }
    encabezadoHTML += `<div style="font-size: 14px; font-weight: bold; margin: 2px 0;">${nombreTaller}</div>`;
    if (direccionTaller) {
        encabezadoHTML += `<div style="font-size: 9px; margin: 1px 0;">${direccionTaller}</div>`;
    }
    if (telefonoTaller) {
        encabezadoHTML += `<div style="font-size: 9px; margin: 1px 0;">Tel: ${telefonoTaller}</div>`;
    }
    if (emailTaller) {
        encabezadoHTML += `<div style="font-size: 9px; margin: 1px 0;">${emailTaller}</div>`;
    }
    encabezadoHTML += '<div style="font-size: 11px; margin-top: 5px; font-weight: bold;">ORDEN DE SERVICIO</div></div>';
    
    const recibo = `
    <div style="font-family: 'Courier New', monospace; width: 4in; font-size: 11px; padding: 0.2in; margin: 0;">
        ${encabezadoHTML}
        <div style="border-top: 2px solid #000; border-bottom: 1px solid #000; padding: 5px 0; margin: 8px 0;">
            <div><strong>Orden:</strong> #${orden.numero}</div>
            <div><strong>Fecha:</strong> ${formatearFecha(orden.fechaIngreso)}</div>
            ${orden.fechaEstimada ? `<div><strong>Entrega:</strong> ${formatearFecha(orden.fechaEstimada)}</div>` : ''}
        </div>
        
        <div style="margin: 8px 0; padding: 5px 0; border-bottom: 1px dashed #666;">
            <div style="font-weight: bold; margin-bottom: 3px;">DATOS DEL CLIENTE</div>
            <div><strong>Nombre:</strong> ${cliente.nombre} ${cliente.apellido}</div>
            <div><strong>Celular:</strong> ${cliente.celular}</div>
            ${cliente.email ? `<div><strong>Email:</strong> ${cliente.email}</div>` : ''}
        </div>
        
        <div style="margin: 8px 0; padding: 5px 0; border-bottom: 1px dashed #666;">
            <div style="font-weight: bold; margin-bottom: 3px;">DATOS DEL EQUIPO</div>
            <div><strong>Tipo:</strong> ${orden.tipoDispositivo}</div>
            <div><strong>Marca:</strong> ${orden.marca}</div>
            <div><strong>Modelo:</strong> ${orden.modelo}</div>
            ${orden.imei ? `<div><strong>IMEI/Serie:</strong> ${orden.imei}</div>` : ''}
            ${orden.accesorios ? `<div><strong>Accesorios:</strong> ${orden.accesorios}</div>` : ''}
        </div>
        
        <div style="margin: 8px 0; padding: 5px 0; border-bottom: 1px dashed #666;">
            <div style="font-weight: bold; margin-bottom: 3px;">PROBLEMA REPORTADO</div>
            <div style="line-height: 1.4;">${orden.problema}</div>
        </div>
        
        ${orden.inspeccion && orden.inspeccion.seccion && orden.inspeccion.items && orden.inspeccion.items.length > 0 ? `
        <div style="margin: 8px 0; padding: 5px 0; border-bottom: 1px dashed #666;">
            <div style="font-weight: bold; margin-bottom: 3px;">${orden.inspeccion.seccion === 'equipos-encendidos' ? 'PIEZAS PROBADAS' : '⚫ CARACTERÍSTICAS EQUIPO'}</div>
            ${orden.inspeccion.items.map(item => `
            <div style="margin: 2px 0; font-size: 10px;">
                ✓ ${item}
            </div>`).join('')}
        </div>` : ''}
        
        ${orden.notas ? `
        <div style="margin: 8px 0; padding: 5px 0; border-bottom: 1px dashed #666;">
            <div style="font-weight: bold; margin-bottom: 3px;">NOTAS</div>
            <div style="line-height: 1.4;">${orden.notas}</div>
        </div>` : ''}
        
        ${orden.repuestos && orden.repuestos.length > 0 ? `
        <div style="margin: 8px 0; padding: 5px 0; border-bottom: 1px dashed #666;">
            <div style="font-weight: bold; margin-bottom: 3px;">🔧 ARTÍCULOS/REPUESTOS</div>
            ${orden.repuestos.map(r => `
            <div style="margin: 2px 0; font-size: 10px;">
                • ${r.nombre} - Cant: ${r.cantidad} - $${(r.precio * r.cantidad).toFixed(2)}
            </div>`).join('')}
        </div>` : ''}
        
        <div style="margin: 8px 0; padding: 8px 0; border-top: 2px solid #000; border-bottom: 2px solid #000;">
            ${orden.presupuesto ? `
            <div style="margin: 3px 0;"><strong>Presupuesto:</strong> <span style="font-size: 14px; font-weight: bold;">$${orden.presupuesto.toFixed(2)}</span></div>
            <div style="margin: 3px 0;"><strong>Anticipo:</strong> $${(orden.anticipo || 0).toFixed(2)}</div>
            <div style="margin: 3px 0;"><strong>Saldo:</strong> <span style="font-size: 13px; font-weight: bold;">$${((orden.presupuesto || 0) - (orden.anticipo || 0)).toFixed(2)}</span></div>
            ` : '<div style="font-style: italic;">Presupuesto pendiente</div>'}
            ${orden.tieneGarantia !== false ? `<div style="margin: 5px 0;"><strong>Garantía:</strong> ${orden.garantia} días</div>` : '<div style="margin: 5px 0;"><strong>Garantía:</strong> Sin garantía</div>'}
        </div>
        
        <div style="margin: 8px 0; padding: 5px; background-color: #f0f0f0; border: 1px solid #999; font-size: 9px; line-height: 1.3;">
            <div style="font-weight: bold; text-align: center; margin-bottom: 3px;">⚠️ POLÍTICAS DEL TALLER</div>
            <div>${politicasTexto}</div>
        </div>
        
        <div style="margin-top: 15px; text-align: center;">
            <div style="margin: 10px 0;">_____________________</div>
            <div style="font-size: 10px;">Firma del Cliente</div>
        </div>
        
        <div style="margin-top: 15px; text-align: center; border-top: 1px dashed #666; padding-top: 8px;">
            <div><strong>Estado:</strong> ${orden.estado}</div>
            <div style="margin-top: 5px; font-size: 10px;">¡Gracias por su confianza!</div>
        </div>
    </div>`;
    
    // 1. Imprimir FACTURA (optimizada para impresora térmica 80mm)
    const ventana = window.open('', '', 'width=400,height=600');
    ventana.document.write(`
        <html>
        <head>
            <title>Orden de Servicio #${orden.numero}</title>
            <style>
                @media print {
                    @page {
                        size: 4in 6in;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                }
                body {
                    margin: 0;
                    padding: 0;
                }
            </style>
        </head>
        <body>
            ${recibo}
        </body>
        </html>
    `);
    ventana.document.close();
    ventana.print();
}

// Función para imprimir solo el ticket pequeño (58mm)
async function imprimirSoloTicket() {
    console.log('🏷️ imprimirSoloTicket llamada, ordenIdTemporal:', ordenIdTemporal);
    
    if (!ordenIdTemporal) {
        alert('Error: No se ha seleccionado ninguna orden');
        cerrarModalSeleccionImpresion();
        return;
    }
    
    // Guardar el ID localmente ANTES de cerrar el modal
    const ordenId = ordenIdTemporal;
    cerrarModalSeleccionImpresion();
    
    console.log('✅ ID de orden capturado:', ordenId);
    
    // Intentar cargar datos actualizados desde Firebase (sin sobrescribir si falla)
    const usuario = firebase.auth().currentUser;
    if (usuario) {
        try {
            const ordenesFirebase = await Storage.loadFromFirebase(usuario.uid, 'ordenes');
            const clientesFirebase = await Storage.loadFromFirebase(usuario.uid, 'clientes');
            
            // Solo actualizar si se cargaron datos
            if (ordenesFirebase && ordenesFirebase.length > 0) {
                Storage.set('ordenes', ordenesFirebase);
            }
            if (clientesFirebase && clientesFirebase.length > 0) {
                Storage.set('clientes', clientesFirebase);
            }
        } catch (error) {
            console.warn('⚠️ No se pudieron cargar datos desde Firebase, usando datos locales:', error);
        }
    }
    
    const ordenes = Storage.get('ordenes');
    const clientes = Storage.get('clientes');
    
    console.log('🔍 Buscando orden:', ordenId, 'Tipo:', typeof ordenId);
    console.log('📋 Órdenes disponibles:', ordenes.map(o => ({id: o.id, tipo: typeof o.id, numero: o.numero})));
    
    // Convertir ordenId a número si es string
    const ordenIdNumero = typeof ordenId === 'string' ? parseInt(ordenId) : ordenId;
    const orden = ordenes.find(o => o.id === ordenIdNumero);
    
    if (!orden) {
        console.error('❌ Orden no encontrada. ID buscado:', ordenIdNumero);
        alert('Error: No se encontró la orden. Por favor, recarga la página e intenta nuevamente.');
        return;
    }
    
    const cliente = clientes.find(c => c.id === orden.clienteId);
    
    // Obtener configuración del taller
    const config = await obtenerConfiguracionTaller();
    const nombreTaller = config?.nombreTaller || 'TALLER DE REPARACIONES';
    
    imprimirTicketPequeno(orden, cliente, nombreTaller);
}

// Nueva función para imprimir ticket pequeño para impresora de códigos/etiquetas
function imprimirTicketPequeno(orden, cliente, nombreTaller) {
    // Ticket pequeño optimizado para impresoras de etiquetas (58mm o 80mm)
    const ticket = `
    <div style="font-family: 'Courier New', monospace; width: 4in; font-size: 12px; padding: 0.2in; margin: 0;">
        <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 5mm; margin-bottom: 5mm;">
            <div style="font-size: 14px; font-weight: bold;">${nombreTaller}</div>
            <div style="font-size: 10px; margin-top: 2mm;">TICKET DE IDENTIFICACIÓN</div>
        </div>
        
        <div style="margin: 5mm 0; border: 2px solid #000; padding: 5mm; background: #f0f0f0;">
            <div style="font-size: 18px; font-weight: bold; text-align: center; letter-spacing: 1px;">
                ORDEN #${orden.numero}
            </div>
        </div>
        
        <div style="margin: 5mm 0; line-height: 1.8;">
            <div style="border-bottom: 1px dashed #666; padding: 3mm 0;">
                <strong>CLIENTE:</strong><br>
                ${cliente.nombre} ${cliente.apellido}
            </div>
            
            <div style="padding: 3mm 0;">
                <strong>PROBLEMA:</strong><br>
                ${orden.problema}
            </div>
        </div>
    </div>`;
    
    // Abrir ventana para ticket pequeño
    const ventanaTicket = window.open('', '', 'width=400,height=600');
    ventanaTicket.document.write(`
        <html>
        <head>
            <title>Ticket - Orden #${orden.numero}</title>
            <style>
                @media print {
                    @page {
                        size: 4in 6in;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                }
                body {
                    margin: 0;
                    padding: 0;
                }
            </style>
        </head>
        <body>
            ${ticket}
        </body>
        </html>
    `);
    ventanaTicket.document.close();
    
    // Imprimir automáticamente después de cargar
    setTimeout(() => {
        ventanaTicket.print();
    }, 500);
}

// DASHBOARD
function actualizarDashboard() {
    // Asegurar que los datos más recientes estén cargados
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
        // Intentar refrescar datos de Firebase en background (sin bloquear la UI)
        console.log('🔄 Refrescando datos en background...');
        cargarDatosUsuario(usuario).catch(error => {
            console.warn('⚠️ No se pudo refrescar datos:', error.message);
        });
    }
    
    const clientes = Storage.get('clientes');
    const ordenes = Storage.get('ordenes');
    document.getElementById('totalClientes').textContent = clientes.length;
    const ordenesActivas = ordenes.filter(o => o.estado !== 'Entregado' && o.estado !== 'Cancelado');
    document.getElementById('ordenesActivas').textContent = ordenesActivas.length;
    const enReparacion = ordenes.filter(o => o.estado === 'En Reparación').length;
    document.getElementById('enReparacion').textContent = enReparacion;
    const listas = ordenes.filter(o => o.estado === 'Listo para Entrega').length;
    document.getElementById('listasEntrega').textContent = listas;
    // Filtrar solo órdenes activas (excluir entregadas y canceladas) y ordenar por fecha
    const ordenesRecientes = ordenes
        .filter(o => o.estado !== 'Entregado' && o.estado !== 'Cancelado')
        .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
        .slice(0, 5);
    const container = document.getElementById('ordenesRecientes');
    if (ordenesRecientes.length === 0) {
        container.innerHTML = '<p>No hay órdenes registradas</p>';
        return;
    }
    let html = '';
    ordenesRecientes.forEach(orden => {
        const cliente = clientes.find(c => c.id === orden.clienteId);
        const tiendas = Storage.get('tiendas');
        const tienda = orden.tiendaId ? tiendas.find(t => t.id === orden.tiendaId) : null;
        // Si tiene tienda asignada, mostrar el nombre de la tienda; si no, mostrar el cliente
        const clienteNombre = tienda ? tienda.nombre : (cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente no encontrado');
        html += `<div class="orden-card"><div class="orden-header"><span class="orden-numero">Orden #${orden.numero}</span><span class="badge badge-${getEstadoClass(orden.estado)}">${orden.estado}</span></div><p><strong>Cliente:</strong> ${clienteNombre}</p><p><strong>Dispositivo:</strong> ${orden.marca} ${orden.modelo}</p></div>`;
    });
    container.innerHTML = html;
}

// BÚSQUEDA
function buscar() {
    const termino = document.getElementById('busqueda').value.toLowerCase();
    const clientes = Storage.get('clientes');
    const ordenes = Storage.get('ordenes');
    if (!termino) {
        alert('Ingresa un término de búsqueda');
        return;
    }
    const resultados = {clientes: [],ordenes: []};
    resultados.clientes = clientes.filter(c => c.nombre.toLowerCase().includes(termino) || c.apellido.toLowerCase().includes(termino) || c.celular.includes(termino) || (c.email && c.email.toLowerCase().includes(termino)));
    resultados.ordenes = ordenes.filter(o => o.numero.toLowerCase().includes(termino) || o.marca.toLowerCase().includes(termino) || o.modelo.toLowerCase().includes(termino) || o.problema.toLowerCase().includes(termino) || (o.imei && o.imei.toLowerCase().includes(termino)));
    mostrarResultados(resultados);
}

function mostrarResultados(resultados) {
    const container = document.getElementById('resultadosBusqueda');
    const clientes = Storage.get('clientes');
    let html = '';
    if (resultados.clientes.length > 0) {
        html += '<h3>Clientes Encontrados</h3>';
        resultados.clientes.forEach(cliente => {
            html += `<div class="orden-card"><h4>${cliente.nombre} ${cliente.apellido}</h4><p><strong>Celular:</strong> ${cliente.celular}</p><p><strong>Email:</strong> ${cliente.email || '-'}</p><button class="btn-secondary" onclick="verHistorialCliente(${cliente.id})">Ver Historial</button></div>`;
        });
    }
    if (resultados.ordenes.length > 0) {
        html += '<h3>Órdenes Encontradas</h3>';
        const tiendas = Storage.get('tiendas');
        resultados.ordenes.forEach(orden => {
            const cliente = clientes.find(c => c.id === orden.clienteId);
            const tienda = orden.tiendaId ? tiendas.find(t => t.id === orden.tiendaId) : null;
            // Si tiene tienda asignada, mostrar el nombre de la tienda; si no, mostrar el cliente
            const clienteNombre = tienda ? tienda.nombre : (cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente no encontrado');
            html += `<div class="orden-card"><div class="orden-header"><span class="orden-numero">Orden #${orden.numero}</span><span class="badge badge-${getEstadoClass(orden.estado)}">${orden.estado}</span></div><p><strong>Cliente:</strong> ${clienteNombre}</p><p><strong>Dispositivo:</strong> ${orden.marca} ${orden.modelo}</p><p><strong>Problema:</strong> ${orden.problema}</p><button class="btn-success" onclick="editarOrden(${orden.id})">Editar</button><button class="btn-primary" onclick="imprimirRecibo(${orden.id})">Imprimir</button></div>`;
        });
    }
    if (resultados.clientes.length === 0 && resultados.ordenes.length === 0) {
        html = '<div class="empty-state"><h3>No se encontraron resultados</h3><p>Intenta con otro término de búsqueda</p></div>';
    }
    container.innerHTML = html;
}

document.getElementById('busqueda').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscar();
});

// Inicializar
actualizarDashboard();

// === EXPORTAR FUNCIONES RESTANTES AL SCOPE GLOBAL ===
// Las funciones principales ya fueron exportadas después de su definición
// Aquí exportamos las funciones de UI que se definen más adelante
window.mostrarFormCliente = mostrarFormCliente;
window.cancelarFormCliente = cancelarFormCliente;
window.mostrarFormOrden = mostrarFormOrden;
window.cancelarFormOrden = cancelarFormOrden;
window.mostrarFormClienteRapido = mostrarFormClienteRapido;
window.cancelarClienteRapido = cancelarClienteRapido;
window.guardarClienteRapido = guardarClienteRapido;
window.crearOrdenClienteFinal = crearOrdenClienteFinal;
window.agregarRepuestoOrden = agregarRepuestoOrden;
window.mostrarFormRepuesto = mostrarFormRepuesto;
window.cancelarFormRepuesto = cancelarFormRepuesto;
window.mostrarAgregarCategoria = mostrarAgregarCategoria;
window.cerrarModalCategoria = cerrarModalCategoria;
window.agregarNuevaCategoria = agregarNuevaCategoria;
window.obtenerCategorias = obtenerCategorias;
window.filtrarInventario = filtrarInventario;
window.filtrarClientes = filtrarClientes;
window.limpiarBusquedaClientes = limpiarBusquedaClientes;
window.filtrarClientesOrden = filtrarClientesOrden;
window.seleccionarClienteOrden = seleccionarClienteOrden;
window.mostrarDropdownClientesOrden = mostrarDropdownClientesOrden;
window.exportarDatos = exportarDatos;
window.imprimirReporte = imprimirReporte;
window.buscar = buscar;
window.imprimirRecibo = imprimirRecibo;
window.imprimirFacturaCompleta = imprimirFacturaCompleta;
window.imprimirSoloTicket = imprimirSoloTicket;
window.cerrarModalSeleccionImpresion = cerrarModalSeleccionImpresion;
window.editarOrden = editarOrden;
window.cambiarEstadoOrden = cambiarEstadoOrden;
window.eliminarOrden = eliminarOrden;
window.registrarPago = registrarPago;
window.enviarWhatsApp = enviarWhatsApp;

// === CONFIGURACIÓN DEL TALLER ===
let configuracionTallerCache = null;

// Variable global para almacenar el logo en base64 temporalmente
let logoBase64Temporal = null;

// Función para previsualizar el logo antes de guardar
function previsualizarLogo(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
        mostrarNotificacion('El archivo es muy grande. Máximo 2MB', 'error');
        event.target.value = '';
        return;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        mostrarNotificacion('Solo se permiten archivos de imagen', 'error');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('logoPreview');
        const img = new Image();
        img.onload = function() {
            // Redimensionar si es necesario (máximo 400px de ancho)
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxWidth = 400;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convertir a base64 con calidad optimizada
            logoBase64Temporal = canvas.toDataURL('image/jpeg', 0.8);
            
            // Mostrar preview
            preview.innerHTML = `<img src="${logoBase64Temporal}" style="width: 100%; height: 100%; object-fit: contain;" alt="Logo">`;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Función para cargar la configuración del taller
async function cargarConfiguracion() {
    try {
        console.log('🔧 Iniciando carga de configuración...');
        
        const usuarioActual = obtenerUsuarioActual();
        if (!usuarioActual) {
            console.log('⚠️ No hay usuario autenticado');
            return;
        }
        
        console.log('👤 Usuario actual:', usuarioActual);

        // Verificar que los elementos del formulario existan
        const nombreInput = document.getElementById('nombreTaller');
        if (!nombreInput) {
            console.error('❌ No se encontró el formulario de configuración. Verificando DOM...');
            setTimeout(() => cargarConfiguracion(), 500);
            return;
        }

        // Intentar cargar desde Firebase primero
        if (typeof db !== 'undefined' && db) {
            try {
                console.log('🔍 Intentando cargar desde Firebase...');
                const docRef = db.collection('configuraciones').doc(usuarioActual);
                const doc = await docRef.get();
                
                if (doc.exists) {
                    const config = doc.data();
                    configuracionTallerCache = config;
                    console.log('📦 Config encontrada en Firebase:', config);
                    
                    // Llenar el formulario
                    document.getElementById('nombreTaller').value = config.nombreTaller || '';
                    document.getElementById('direccionTaller').value = config.direccionTaller || '';
                    document.getElementById('telefonoTaller').value = config.telefonoTaller || '';
                    document.getElementById('emailTaller').value = config.emailTaller || '';
                    document.getElementById('politicasTaller').value = config.politicasTaller || '';
                    
                    // Cargar logo si existe
                    if (config.logoUrl) {
                        const preview = document.getElementById('logoPreview');
                        preview.innerHTML = `<img src="${config.logoUrl}" style="width: 100%; height: 100%; object-fit: contain;" alt="Logo">`;
                        logoBase64Temporal = config.logoUrl;
                    }
                    
                    console.log('✅ Configuración cargada desde Firebase');
                    mostrarNotificacion('Configuración cargada correctamente', 'success');
                    return;
                }
            } catch (error) {
                console.log('⚠️ No se pudo cargar desde Firebase:', error.code);
                console.log('💡 Trabajando en modo local con localStorage');
                // Si es error de permisos, mostrar mensaje informativo
                if (error.code === 'permission-denied') {
                    console.warn('🔒 Firebase requiere configuración de reglas. Ver FIRESTORE-RULES-CONFIGURACION.txt');
                    console.info('📝 Por ahora, la configuración se guardará solo localmente');
                }
            }
        }
        
        // Cargar desde localStorage como respaldo
        const configLocal = localStorage.getItem(`configuracion_${usuarioActual}`);
        if (configLocal) {
            const config = JSON.parse(configLocal);
            configuracionTallerCache = config;
            console.log('📦 Config encontrada en localStorage:', config);
            
            document.getElementById('nombreTaller').value = config.nombreTaller || '';
            document.getElementById('direccionTaller').value = config.direccionTaller || '';
            document.getElementById('telefonoTaller').value = config.telefonoTaller || '';
            document.getElementById('emailTaller').value = config.emailTaller || '';
            document.getElementById('politicasTaller').value = config.politicasTaller || '';
            
            if (config.logoUrl) {
                const preview = document.getElementById('logoPreview');
                preview.innerHTML = `<img src="${config.logoUrl}" style="width: 100%; height: 100%; object-fit: contain;" alt="Logo">`;
                logoBase64Temporal = config.logoUrl;
            }
            
            console.log('✅ Configuración cargada desde localStorage');
        } else {
            console.log('ℹ️ No hay configuración guardada, formulario vacío');
        }
    } catch (error) {
        console.error('❌ Error al cargar configuración:', error);
        mostrarNotificacion('Error al cargar la configuración', 'error');
    }
}

// Función para obtener el usuario actual
function obtenerUsuarioActual() {
    // Primero intentar con Firebase Auth
    if (typeof auth !== 'undefined' && auth && auth.currentUser) {
        console.log('👤 Usuario de Firebase Auth:', auth.currentUser.uid);
        return auth.currentUser.uid;
    }
    
    // Luego con el usuario de localStorage
    const usuario = localStorage.getItem('usuarioActual');
    if (usuario) {
        console.log('👤 Usuario de localStorage:', usuario);
        return usuario;
    }
    
    // Como último recurso, usar el nombre de usuario del login
    const sesion = localStorage.getItem('sesionActiva');
    if (sesion === 'true') {
        // Buscar el último usuario que inició sesión
        const ultimoUsuario = localStorage.getItem('ultimoUsuarioLogin');
        if (ultimoUsuario) {
            console.log('👤 Último usuario login:', ultimoUsuario);
            return ultimoUsuario;
        }
    }
    
    console.warn('⚠️ No se pudo obtener el usuario actual');
    return null;
}

// Función para guardar la configuración
async function guardarConfiguracion(event) {
    if (event) event.preventDefault();
    
    console.log('💾 Iniciando guardado de configuración...');
    
    const usuarioActual = obtenerUsuarioActual();
    console.log('👤 Usuario actual:', usuarioActual);
    
    if (!usuarioActual) {
        mostrarNotificacion('No hay usuario autenticado', 'error');
        return;
    }
    
    const config = {
        nombreTaller: document.getElementById('nombreTaller').value,
        direccionTaller: document.getElementById('direccionTaller').value,
        telefonoTaller: document.getElementById('telefonoTaller').value,
        emailTaller: document.getElementById('emailTaller').value,
        politicasTaller: document.getElementById('politicasTaller').value,
        logoUrl: logoBase64Temporal || configuracionTallerCache?.logoUrl || null,
        fechaActualizacion: new Date().toISOString()
    };
    
    console.log('📝 Datos a guardar:', {
        nombreTaller: config.nombreTaller,
        direccionTaller: config.direccionTaller,
        tieneLogo: !!config.logoUrl
    });
    
    try {
        let guardadoEnFirebase = false;
        
        // Guardar en Firebase
        console.log('🔥 Verificando Firebase...');
        console.log('db disponible:', typeof db !== 'undefined' && db);
        console.log('auth.currentUser:', auth?.currentUser?.uid);
        
        if (typeof db !== 'undefined' && db) {
            try {
                console.log('📤 Intentando guardar en Firebase colección: configuraciones, documento:', usuarioActual);
                await db.collection('configuraciones').doc(usuarioActual).set(config, { merge: true });
                console.log('✅ Configuración guardada exitosamente en Firebase');
                guardadoEnFirebase = true;
            } catch (error) {
                console.error('❌ Error al guardar en Firebase:', error);
                console.error('Código de error:', error.code);
                console.error('Mensaje:', error.message);
                if (error.code === 'permission-denied') {
                    console.warn('🔒 Firebase requiere configuración de reglas. Ver FIRESTORE-RULES-CONFIGURACION.txt');
                    console.warn('📋 Reglas sugeridas: allow read, write: if request.auth != null;');
                }
                console.info('💾 Guardando solo en localStorage...');
            }
        } else {
            console.warn('⚠️ Firebase no está disponible');
        }
        
        // Guardar en localStorage como respaldo
        console.log('💾 Guardando en localStorage con clave:', `configuracion_${usuarioActual}`);
        localStorage.setItem(`configuracion_${usuarioActual}`, JSON.stringify(config));
        configuracionTallerCache = config;
        console.log('✅ Guardado en localStorage completado');
        
        const mensajeExito = guardadoEnFirebase 
            ? '✅ Configuración guardada y sincronizada en la nube'
            : '✅ Configuración guardada localmente (Firebase no disponible)';
        
        console.log('📢 Mensaje de éxito:', mensajeExito);
        mostrarNotificacion(mensajeExito, 'success');
        
        // Mostrar mensaje de éxito en el formulario
        const mensaje = document.getElementById('configuracionMensaje');
        mensaje.style.display = 'block';
        mensaje.style.background = '#d4edda';
        mensaje.style.color = '#155724';
        mensaje.style.border = '1px solid #c3e6cb';
        mensaje.textContent = '✅ Tu configuración se ha guardado correctamente y estará disponible en todos tus dispositivos.';
        
        setTimeout(() => {
            mensaje.style.display = 'none';
        }, 5000);
        
    } catch (error) {
        console.error('Error al guardar configuración:', error);
        mostrarNotificacion('Error al guardar la configuración', 'error');
        
        const mensaje = document.getElementById('configuracionMensaje');
        mensaje.style.display = 'block';
        mensaje.style.background = '#f8d7da';
        mensaje.style.color = '#721c24';
        mensaje.style.border = '1px solid #f5c6cb';
        mensaje.textContent = '❌ Error al guardar la configuración. Por favor, intenta nuevamente.';
    }
}

// Función para obtener la configuración (usada por otras funciones)
async function obtenerConfiguracionTaller() {
    if (configuracionTallerCache) {
        return configuracionTallerCache;
    }
    
    const usuarioActual = obtenerUsuarioActual();
    if (!usuarioActual) return null;
    
    // Intentar cargar desde Firebase
    if (typeof db !== 'undefined' && db) {
        try {
            const docRef = db.collection('configuraciones').doc(usuarioActual);
            const doc = await docRef.get();
            
            if (doc.exists) {
                configuracionTallerCache = doc.data();
                return configuracionTallerCache;
            }
        } catch (error) {
            console.log('Error al cargar desde Firebase:', error);
        }
    }
    
    // Cargar desde localStorage
    const configLocal = localStorage.getItem(`configuracion_${usuarioActual}`);
    if (configLocal) {
        configuracionTallerCache = JSON.parse(configLocal);
        return configuracionTallerCache;
    }
    
    return null;
}

// Función auxiliar para mostrar secciones (usada desde el botón del header)
window.mostrarSeccion = function(seccionId) {
    console.log('🔄 Mostrando sección:', seccionId);
    
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const seccion = document.getElementById(seccionId);
    if (seccion) {
        seccion.classList.add('active');
        console.log('✅ Sección activada:', seccionId);
    } else {
        console.error('❌ No se encontró la sección:', seccionId);
    }
    
    const btn = document.querySelector(`[data-section="${seccionId}"]`);
    if (btn) {
        btn.classList.add('active');
    }
    
    // Cargar datos específicos de la sección
    if (seccionId === 'configuracion') {
        console.log('🔧 Cargando configuración...');
        cargarConfiguracion();
    }
    if (seccionId === 'dashboard') actualizarDashboard();
    if (seccionId === 'clientes') cargarClientes();
    if (seccionId === 'ordenes') cargarOrdenes();
    if (seccionId === 'pagos') cargarPagos();
    if (seccionId === 'inventario') filtrarInventario();
    if (seccionId === 'reportes') generarReportes();
    if (seccionId === 'gastos') cargarGastos();
};

// ============================================
// GASTOS DE UTILERÍA
// ============================================

function cargarGastos() {
    const gastos = Storage.get('gastos') || [];
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInicioMes = new Date();
    fechaInicioMes.setDate(1);
    fechaInicioMes.setHours(0, 0, 0, 0);
    
    // Establecer fecha de hoy por defecto en el formulario
    document.getElementById('gastoFecha').value = hoy;
    
    // Calcular totales
    let totalGastos = 0;
    let gastosMes = 0;
    let gastosHoy = 0;
    
    gastos.forEach(gasto => {
        const fechaGasto = new Date(gasto.fecha);
        const monto = parseFloat(gasto.monto) || 0;
        totalGastos += monto;
        
        if (fechaGasto >= fechaInicioMes) {
            gastosMes += monto;
        }
        
        if (gasto.fecha === hoy) {
            gastosHoy += monto;
        }
    });
    
    document.getElementById('totalGastos').textContent = `$${formatearMonto(totalGastos)}`;
    document.getElementById('gastosMes').textContent = `$${formatearMonto(gastosMes)}`;
    document.getElementById('gastosHoy').textContent = `$${formatearMonto(gastosHoy)}`;
    
    filtrarGastos();
}

function filtrarGastos() {
    const gastos = Storage.get('gastos') || [];
    const periodo = document.getElementById('filtroGastosPeriodo').value;
    const categoria = document.getElementById('filtroGastosCategoria').value;
    
    let gastosFiltrados = gastos.filter(gasto => {
        // Filtrar por categoría
        if (categoria !== 'todos' && gasto.categoria !== categoria) {
            return false;
        }
        
        // Filtrar por período
        if (periodo === 'todos') {
            return true;
        }
        
        const fechaGasto = new Date(gasto.fecha);
        const ahora = new Date();
        
        switch(periodo) {
            case 'hoy':
                return gasto.fecha === ahora.toISOString().split('T')[0];
            case 'semana':
                const inicioSemana = new Date(ahora);
                const diaSemana = inicioSemana.getDay();
                const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
                inicioSemana.setDate(inicioSemana.getDate() + diasHastaLunes);
                inicioSemana.setHours(0, 0, 0, 0);
                return fechaGasto >= inicioSemana;
            case 'mes':
                return fechaGasto.getMonth() === ahora.getMonth() && 
                       fechaGasto.getFullYear() === ahora.getFullYear();
            case 'año':
                return fechaGasto.getFullYear() === ahora.getFullYear();
            default:
                return true;
        }
    });
    
    // Ordenar por fecha descendente (más recientes primero)
    gastosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    const container = document.getElementById('listaGastos');
    
    if (gastosFiltrados.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>📭 No hay gastos registrados</h3><p>Los gastos que registres aparecerán aquí</p></div>';
        return;
    }
    
    let html = '<table><thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Monto</th><th>Acciones</th></tr></thead><tbody>';
    
    gastosFiltrados.forEach(gasto => {
        const iconosCategoria = {
            'Herramientas': '🔧',
            'Material de Oficina': '📄',
            'Servicios': '💡',
            'Transporte': '🚗',
            'Alquiler': '🏠',
            'Publicidad': '📢',
            'Mantenimiento': '🔨',
            'Otros': '📦'
        };
        
        const icono = iconosCategoria[gasto.categoria] || '📦';
        const fechaFormateada = formatearFecha(gasto.fecha);
        
        html += `
            <tr>
                <td>${fechaFormateada}</td>
                <td style="max-width: 300px;">${gasto.descripcion}</td>
                <td>${icono} ${gasto.categoria}</td>
                <td style="font-weight: bold; color: #ef4444;">$${formatearMonto(gasto.monto)}</td>
                <td>
                    <button class="btn-secondary" onclick="editarGasto(${gasto.id})" style="padding: 5px 10px; font-size: 12px;">✏️ Editar</button>
                    <button class="btn-danger" onclick="eliminarGasto(${gasto.id})" style="padding: 5px 10px; font-size: 12px;">🗑️ Eliminar</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

async function guardarGasto(event) {
    event.preventDefault();
    
    const gastoId = document.getElementById('gastoId') ? document.getElementById('gastoId').value : null;
    const gastos = Storage.get('gastos') || [];
    
    const gasto = {
        id: gastoId ? parseInt(gastoId) : Date.now(),
        monto: parseFloat(document.getElementById('gastoMonto').value),
        fecha: document.getElementById('gastoFecha').value,
        descripcion: document.getElementById('gastoDescripcion').value.trim(),
        categoria: document.getElementById('gastoCategoria').value,
        fechaRegistro: new Date().toISOString()
    };
    
    if (gastoId) {
        // Editar gasto existente
        const index = gastos.findIndex(g => g.id === parseInt(gastoId));
        if (index !== -1) {
            gastos[index] = gasto;
        }
    } else {
        // Nuevo gasto
        gastos.push(gasto);
    }
    
    await Storage.saveAndSync('gastos', gastos);
    mostrarNotificacion(gastoId ? 'Gasto actualizado exitosamente' : 'Gasto registrado exitosamente', 'success');
    limpiarFormGasto();
    cargarGastos();
}

function limpiarFormGasto() {
    document.getElementById('gastoForm').reset();
    document.getElementById('gastoFecha').value = new Date().toISOString().split('T')[0];
    
    // Remover campo oculto de ID si existe
    const gastoIdField = document.getElementById('gastoId');
    if (gastoIdField) {
        gastoIdField.remove();
    }
}

function editarGasto(id) {
    const gastos = Storage.get('gastos') || [];
    const gasto = gastos.find(g => g.id === id);
    
    if (!gasto) {
        mostrarNotificacion('Gasto no encontrado', 'error');
        return;
    }
    
    // Llenar el formulario con los datos del gasto
    document.getElementById('gastoMonto').value = gasto.monto;
    document.getElementById('gastoFecha').value = gasto.fecha;
    document.getElementById('gastoDescripcion').value = gasto.descripcion;
    document.getElementById('gastoCategoria').value = gasto.categoria;
    
    // Agregar campo oculto con el ID
    let gastoIdField = document.getElementById('gastoId');
    if (!gastoIdField) {
        gastoIdField = document.createElement('input');
        gastoIdField.type = 'hidden';
        gastoIdField.id = 'gastoId';
        document.getElementById('gastoForm').appendChild(gastoIdField);
    }
    gastoIdField.value = id;
    
    // Scroll al formulario
    document.getElementById('gastoForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    mostrarNotificacion('Editando gasto - Modifica los campos y guarda', 'info');
}

async function eliminarGasto(id) {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;
    
    let gastos = Storage.get('gastos') || [];
    gastos = gastos.filter(g => g.id !== id);
    
    await Storage.saveAndSync('gastos', gastos);
    mostrarNotificacion('Gasto eliminado exitosamente', 'success');
    cargarGastos();
}

// Exponer funciones al scope global
window.previsualizarLogo = previsualizarLogo;
window.cargarConfiguracion = cargarConfiguracion;
window.guardarConfiguracion = guardarConfiguracion;
window.obtenerConfiguracionTaller = obtenerConfiguracionTaller;
window.cargarGastos = cargarGastos;
window.filtrarGastos = filtrarGastos;
window.guardarGasto = guardarGasto;
window.limpiarFormGasto = limpiarFormGasto;
window.editarGasto = editarGasto;
window.eliminarGasto = eliminarGasto;

// ============================================
// AGREGAR ARTÍCULOS A ORDEN EXISTENTE
// ============================================

let ordenActualArticulos = null;
let articulosTemporales = [];

// Abrir el modal para agregar artículos a una orden
function abrirModalArticulos(ordenId) {
    const ordenes = Storage.get('ordenes');
    const orden = ordenes.find(o => o.id === ordenId);
    
    if (!orden) {
        alert('Orden no encontrada');
        return;
    }
    
    if (orden.estado === 'Entregado' || orden.estado === 'Cancelado') {
        alert('No se pueden agregar artículos a una orden entregada o cancelada');
        return;
    }
    
    ordenActualArticulos = orden;
    articulosTemporales = orden.repuestos ? [...orden.repuestos] : [];
    
    // Mostrar información de la orden
    const clientes = Storage.get('clientes');
    const tiendas = Storage.get('tiendas');
    const cliente = clientes.find(c => c.id === orden.clienteId);
    const tienda = orden.tiendaId ? tiendas.find(t => t.id === orden.tiendaId) : null;
    // Si tiene tienda asignada, mostrar el nombre de la tienda; si no, mostrar el cliente
    const clienteNombre = tienda ? tienda.nombre : (cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente no encontrado');
    
    document.getElementById('infoOrdenArticulos').innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
            <div><strong>Orden:</strong> #${orden.numero}</div>
            <div><strong>Cliente:</strong> ${clienteNombre}</div>
            <div><strong>Dispositivo:</strong> ${orden.marca} ${orden.modelo}</div>
            <div><strong>Estado:</strong> <span style="color: #2196F3; font-weight: bold;">${orden.estado}</span></div>
        </div>
    `;
    
    // Mostrar artículos actuales
    actualizarArticulosActualesOrden();
    
    // Limpiar campos
    document.getElementById('nombreArticuloModal').value = '';
    document.getElementById('cantidadArticuloModal').value = 1;
    document.getElementById('precioArticuloModal').value = '';
    
    // Mostrar el modal
    document.getElementById('modalAgregarArticulos').style.display = 'block';
}

// Agregar artículo al temporal
function agregarArticuloModal() {
    const nombre = document.getElementById('nombreArticuloModal').value.trim();
    const cantidad = parseInt(document.getElementById('cantidadArticuloModal').value) || 1;
    const precio = parseFloat(document.getElementById('precioArticuloModal').value) || 0;
    
    if (!nombre) {
        alert('Por favor ingresa la descripción del artículo/servicio');
        return;
    }
    
    if (precio <= 0) {
        alert('Por favor ingresa un precio válido');
        return;
    }
    
    if (cantidad <= 0) {
        alert('Por favor ingresa una cantidad válida');
        return;
    }
    
    // Agregar artículo personalizado
    articulosTemporales.push({
        id: null, // null indica que es un artículo personalizado, no del inventario
        nombre: nombre,
        cantidad: cantidad,
        precio: precio,
        esPersonalizado: true // Flag para identificar artículos personalizados
    });
    
    actualizarArticulosActualesOrden();
    
    // Limpiar campos
    document.getElementById('nombreArticuloModal').value = '';
    document.getElementById('cantidadArticuloModal').value = 1;
    document.getElementById('precioArticuloModal').value = '';
    
    // Enfocar el campo de nombre para agregar más rápido
    document.getElementById('nombreArticuloModal').focus();
}

// Eliminar artículo temporal
function eliminarArticuloModal(index) {
    articulosTemporales.splice(index, 1);
    actualizarArticulosActualesOrden();
}

// Actualizar la vista de artículos actuales
function actualizarArticulosActualesOrden() {
    const container = document.getElementById('articulosActualesOrden');
    
    if (articulosTemporales.length === 0) {
        container.innerHTML = '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; color: #999; font-style: italic;">No hay artículos agregados a esta orden</div>';
        return;
    }
    
    let total = 0;
    let html = '<div style="background: #fff; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">';
    html += '<div style="background: #f8f9fa; padding: 12px; border-bottom: 2px solid #dee2e6;"><strong>🔧 Artículos en esta orden:</strong></div>';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr style="background: #f8f9fa; border-bottom: 1px solid #dee2e6;"><th style="text-align: left; padding: 10px;">Repuesto</th><th style="text-align: center; padding: 10px;">Cantidad</th><th style="text-align: right; padding: 10px;">Precio Unit.</th><th style="text-align: right; padding: 10px;">Subtotal</th><th style="text-align: center; padding: 10px;">Acción</th></tr></thead>';
    html += '<tbody>';
    
    articulosTemporales.forEach((repuesto, index) => {
        const subtotal = repuesto.cantidad * repuesto.precio;
        total += subtotal;
        html += `<tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 12px;">${repuesto.nombre}</td>
            <td style="text-align: center; padding: 12px; font-weight: bold;">${repuesto.cantidad}</td>
            <td style="text-align: right; padding: 12px;">$${repuesto.precio.toFixed(2)}</td>
            <td style="text-align: right; padding: 12px; font-weight: bold;">$${subtotal.toFixed(2)}</td>
            <td style="text-align: center; padding: 12px;">
                <button onclick="eliminarArticuloModal(${index})" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-size: 12px;">🗑️ Quitar</button>
            </td>
        </tr>`;
    });
    
    html += '</tbody>';
    html += `<tfoot><tr style="background: #f8f9fa; font-weight: bold; border-top: 2px solid #dee2e6;"><td colspan="3" style="text-align: right; padding: 12px;">TOTAL REPUESTOS:</td><td style="text-align: right; padding: 12px; font-size: 16px; color: #28a745;">$${total.toFixed(2)}</td><td></td></tr></tfoot>`;
    html += '</table>';
    html += '</div>';
    
    container.innerHTML = html;
}

// Guardar los artículos en la orden
async function guardarArticulosOrden() {
    if (!ordenActualArticulos) return;
    
    if (!confirm('¿Deseas guardar los artículos agregados a esta orden?\n\nEsto actualizará el presupuesto de la orden.')) {
        return;
    }
    
    const ordenes = Storage.get('ordenes');
    const ordenIndex = ordenes.findIndex(o => o.id === ordenActualArticulos.id);
    
    if (ordenIndex === -1) {
        alert('Error: Orden no encontrada');
        return;
    }
    
    // Obtener los artículos originales de la orden
    const articulosOriginales = ordenActualArticulos.repuestos || [];
    
    // Restaurar al inventario solo los artículos que eran del inventario (no personalizados)
    let inventario = Storage.get('repuestos');
    articulosOriginales.forEach(repuesto => {
        // Solo restaurar si NO es personalizado (tiene id del inventario)
        if (repuesto.id && !repuesto.esPersonalizado) {
            const itemInventario = inventario.find(i => i.id === repuesto.id);
            if (itemInventario) {
                itemInventario.stock += repuesto.cantidad;
            }
        }
    });
    
    // Descontar del inventario solo los artículos nuevos que vengan del inventario
    articulosTemporales.forEach(repuesto => {
        // Solo descontar si NO es personalizado (tiene id del inventario)
        if (repuesto.id && !repuesto.esPersonalizado) {
            const itemInventario = inventario.find(i => i.id === repuesto.id);
            if (itemInventario) {
                itemInventario.stock -= repuesto.cantidad;
                if (itemInventario.stock < 0) {
                    itemInventario.stock = 0;
                }
            }
        }
    });
    
    // Calcular el costo total de los artículos
    const costoArticulos = articulosTemporales.reduce((total, articulo) => {
        return total + (articulo.precio * articulo.cantidad);
    }, 0);
    
    // Actualizar la orden con los nuevos artículos y presupuesto
    ordenes[ordenIndex].repuestos = [...articulosTemporales];
    
    // Sumar el costo de los artículos al presupuesto existente (solo los nuevos)
    const costoArticulosOriginales = articulosOriginales.reduce((total, articulo) => {
        return total + (articulo.precio * articulo.cantidad);
    }, 0);
    
    const diferenciaCosto = costoArticulos - costoArticulosOriginales;
    ordenes[ordenIndex].presupuesto = (ordenes[ordenIndex].presupuesto || 0) + diferenciaCosto;
    
    // Guardar cambios
    await Storage.saveAndSync('repuestos', inventario);
    await Storage.saveAndSync('ordenes', ordenes);
    
    alert(`✅ Artículos agregados exitosamente\n\nNuevo presupuesto: $${ordenes[ordenIndex].presupuesto.toFixed(2)}\nCosto de artículos: $${costoArticulos.toFixed(2)}`);
    
    cerrarModalArticulos();
    cargarOrdenes();
}

// ===== FUNCIONES PARA CHECKLIST DE INSPECCIÓN =====

function cambiarSeccionInspeccion() {
    const seccion = document.querySelector('input[name="seccionInspeccion"]:checked').value;
    
    // Ocultar todas las secciones
    document.getElementById('seccionEncendidos').style.display = 'none';
    document.getElementById('seccionApagados').style.display = 'none';
    
    // Limpiar checkboxes de la otra sección
    document.querySelectorAll('input[name="piezasProbadas"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="equipoApagado"]').forEach(cb => cb.checked = false);
    
    // Mostrar la sección seleccionada
    if (seccion === 'equipos-encendidos') {
        document.getElementById('seccionEncendidos').style.display = 'block';
    } else if (seccion === 'equipos-apagados') {
        document.getElementById('seccionApagados').style.display = 'block';
    }
}

function obtenerSeleccionesChecklist() {
    const seccion = document.querySelector('input[name="seccionInspeccion"]:checked');
    
    if (!seccion) {
        return {
            seccion: null,
            items: []
        };
    }
    
    const tipoSeccion = seccion.value;
    let items = [];
    
    if (tipoSeccion === 'equipos-encendidos') {
        items = Array.from(document.querySelectorAll('input[name="piezasProbadas"]:checked'))
            .map(cb => cb.value);
    } else if (tipoSeccion === 'equipos-apagados') {
        items = Array.from(document.querySelectorAll('input[name="equipoApagado"]:checked'))
            .map(cb => cb.value);
    }
    
    return {
        seccion: tipoSeccion,
        items: items
    };
}

function cargarChecklistEnFormulario(orden) {
    if (!orden.inspeccion) return;
    
    const { seccion, items } = orden.inspeccion;
    
    if (!seccion) return;
    
    // Seleccionar la sección
    document.querySelector(`input[name="seccionInspeccion"][value="${seccion}"]`).checked = true;
    cambiarSeccionInspeccion();
    
    // Marcar los items
    if (seccion === 'equipos-encendidos') {
        items.forEach(item => {
            const checkbox = document.querySelector(`input[name="piezasProbadas"][value="${item}"]`);
            if (checkbox) checkbox.checked = true;
        });
    } else if (seccion === 'equipos-apagados') {
        items.forEach(item => {
            const checkbox = document.querySelector(`input[name="equipoApagado"][value="${item}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
}

// Cerrar el modal
function cerrarModalArticulos() {
    document.getElementById('modalAgregarArticulos').style.display = 'none';
    ordenActualArticulos = null;
    articulosTemporales = [];
}

// Exponer funciones del modal de artículos
window.abrirModalArticulos = abrirModalArticulos;
window.cerrarModalArticulos = cerrarModalArticulos;
window.agregarArticuloModal = agregarArticuloModal;
window.eliminarArticuloModal = eliminarArticuloModal;
window.guardarArticulosOrden = guardarArticulosOrden;

// Exponer funciones del checklist
window.cambiarSeccionInspeccion = cambiarSeccionInspeccion;
window.obtenerSeleccionesChecklist = obtenerSeleccionesChecklist;
window.cargarChecklistEnFormulario = cargarChecklistEnFormulario;

// === GESTIÓN DE TIENDAS ===

function cargarTiendas() {
    return Storage.get('tiendas');
}

function mostrarFormTienda() {
    document.getElementById('formTienda').style.display = 'block';
    document.getElementById('tiendaForm').reset();
    document.getElementById('tiendaForm').dataset.id = '';
}

function cancelarFormTienda() {
    document.getElementById('formTienda').style.display = 'none';
    document.getElementById('tiendaForm').reset();
    document.getElementById('tiendaForm').dataset.id = '';
}

function guardarTienda(event) {
    event.preventDefault();
    
    let tiendas = Storage.get('tiendas');
    
    const tiendaId = document.getElementById('tiendaForm').dataset.id;
    const tienda = {
        id: tiendaId || 'tienda_' + Date.now(),
        nombre: document.getElementById('tiendaNombre').value,
        contacto: document.getElementById('tiendaContacto').value,
        telefono: document.getElementById('tiendaTelefono').value,
        email: document.getElementById('tiendaEmail').value,
        direccion: document.getElementById('tiendaDireccion').value,
        fechaCreacion: tiendaId ? tiendas.find(t => t.id === tiendaId).fechaCreacion : new Date().toISOString()
    };
    
    if (tiendaId) {
        const index = tiendas.findIndex(t => t.id === tiendaId);
        if (index !== -1) {
            tiendas[index] = tienda;
        }
    } else {
        tiendas.push(tienda);
    }
    
    Storage.saveAndSync('tiendas', tiendas);
    cancelarFormTienda();
    mostrarTiendas();
}

async function editarTienda(tiendaId) {
    const tiendas = Storage.get('tiendas');
    const tienda = tiendas.find(t => t.id === tiendaId);
    
    if (tienda) {
        document.getElementById('tiendaNombre').value = tienda.nombre;
        document.getElementById('tiendaContacto').value = tienda.contacto || '';
        document.getElementById('tiendaTelefono').value = tienda.telefono || '';
        document.getElementById('tiendaEmail').value = tienda.email || '';
        document.getElementById('tiendaDireccion').value = tienda.direccion || '';
        document.getElementById('tiendaForm').dataset.id = tiendaId;
        document.getElementById('formTienda').style.display = 'block';
        document.getElementById('tiendaNombre').focus();
    }
}

// Wrapper para editar tienda con manejo de evento
function handleEditarTienda(tiendaId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }
    editarTienda(tiendaId);
    return false;
}

async function eliminarTienda(tiendaId) {
    if (confirm('¿Estás seguro que deseas eliminar esta tienda?')) {
        let tiendas = Storage.get('tiendas');
        tiendas = tiendas.filter(t => t.id !== tiendaId);
        await Storage.saveAndSync('tiendas', tiendas);
        mostrarTiendas();
    }
}

// Wrapper para eliminar tienda con manejo de evento
function handleEliminarTienda(tiendaId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }
    eliminarTienda(tiendaId);
    return false;
}

function calcularDineroTienda(tiendaId) {
    const ordenes = Storage.get('ordenes');
    const ordenesTienda = ordenes.filter(o => o.tiendaId === tiendaId);
    
    return ordenesTienda.reduce((total, orden) => {
        const monto = parseFloat(orden.monto) || 0;
        const pagado = parseFloat(orden.pagado) || 0;
        return total + (monto - pagado);
    }, 0);
}

function obtenerOrdenesTienda(tiendaId) {
    const ordenes = Storage.get('ordenes');
    return ordenes.filter(o => o.tiendaId === tiendaId);
}

function mostrarTiendas() {
    // Restaurar el grid cuando volvemos al listado
    const container = document.getElementById('listaTiendas');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
    container.style.gap = '20px';
    
    const tiendas = Storage.get('tiendas');
    const busqueda = document.getElementById('buscarTienda').value.toLowerCase();
    
    const tiendasFiltradas = tiendas.filter(t => 
        t.nombre.toLowerCase().includes(busqueda)
    );
    
    if (tiendasFiltradas.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">No hay tiendas registradas</div>';
        return;
    }
    
    container.innerHTML = tiendasFiltradas.map(tienda => {
        const dineroTienda = calcularDineroTienda(tienda.id);
        const ordenesCount = obtenerOrdenesTienda(tienda.id).length;
        const ordenesPendientes = obtenerOrdenesTienda(tienda.id).filter(o => {
            const pagado = parseFloat(o.pagado) || 0;
            const monto = parseFloat(o.monto) || 0;
            return pagado < monto;
        }).length;
        
        console.log('🏪 Renderizando tienda:', tienda.id, tienda.nombre);
        
        return `
            <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); cursor: pointer;" data-tienda-id="${tienda.id}">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0; font-size: 18px;">${tienda.nombre}</h3>
                        <p style="margin: 5px 0; font-size: 12px; opacity: 0.8;">${tienda.contacto || 'Sin contacto'}</p>
                    </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.15); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                    <p style="margin: 5px 0; font-size: 13px; opacity: 0.9;">
                        <strong>Dinero Pendiente:</strong>
                    </p>
                    <p style="margin: 5px 0; font-size: 20px; font-weight: bold;">$${formatearMonto(dineroTienda)}</p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
                    <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 5px; text-align: center;">
                        <p style="margin: 0; opacity: 0.8;">Total Órdenes</p>
                        <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">${ordenesCount}</p>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 5px; text-align: center;">
                        <p style="margin: 0; opacity: 0.8;">Pendientes</p>
                        <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">${ordenesPendientes}</p>
                    </div>
                </div>
                
                <p style="margin: 10px 0 0 0; font-size: 11px; opacity: 0.7; color: rgba(255,255,255,0.8);">
                    📞 ${tienda.telefono || 'No registrado'}<br>
                    📍 ${tienda.direccion || 'No registrada'}
                </p>
            </div>
        `;
    }).join('');
    
    // Event listeners para tarjetas
    setTimeout(() => {
        document.querySelectorAll('.stat-card[data-tienda-id]').forEach(card => {
            card.addEventListener('click', (e) => {
                const tiendaId = card.getAttribute('data-tienda-id');
                mostrarModalTienda(tiendaId);
            });
        });
    }, 0);
}

// Función para mostrar modal con opciones
function mostrarModalTienda(tiendaId) {
    const tiendas = Storage.get('tiendas') || [];
    const tienda = tiendas.find(t => t.id === tiendaId);
    
    if (!tienda) return;
    
    // Crear modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
    `;
    
    dialog.innerHTML = `
        <h2 style="margin: 0 0 10px 0; font-size: 24px; color: #333;">${tienda.nombre}</h2>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">
            <strong>Contacto:</strong> ${tienda.contacto || 'No registrado'}<br>
            <strong>Teléfono:</strong> ${tienda.telefono || 'No registrado'}<br>
            <strong>Email:</strong> ${tienda.email || 'No registrado'}<br>
            <strong>Dirección:</strong> ${tienda.direccion || 'No registrada'}
        </p>
        <div style="display: flex; gap: 10px; margin-top: 25px; flex-wrap: wrap;">
            <button onclick="verOrdenesTienda('${tiendaId}'); document.querySelector('[data-modal-backdrop]').remove();" style="flex: 1; padding: 12px; background: #667eea; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; min-width: 120px;">👁️ Ver Órdenes</button>
            <button onclick="generarReporteCuentasPorCobrar('${tiendaId}').catch(e => console.error(e));" style="flex: 1; padding: 12px; background: #ff9800; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; min-width: 120px;">📊 Reporte</button>
            <button onclick="editarTienda('${tiendaId}'); document.querySelector('[data-modal-backdrop]').remove();" style="flex: 1; padding: 12px; background: #4facfe; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; min-width: 120px;">✏️ Editar</button>
            <button onclick="if(confirm('¿Estás seguro de que deseas eliminar esta tienda?')) { eliminarTienda('${tiendaId}'); document.querySelector('[data-modal-backdrop]').remove(); }" style="flex: 1; padding: 12px; background: #ff6b6b; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; min-width: 120px;">🗑️ Eliminar</button>
        </div>
        <button onclick="document.querySelector('[data-modal-backdrop]').remove();" style="width: 100%; padding: 10px; background: #e0e0e0; border: none; border-radius: 6px; color: #333; font-size: 14px; margin-top: 10px; cursor: pointer; transition: all 0.2s;">Cancelar</button>
    `;
    
    modal.appendChild(dialog);
    modal.setAttribute('data-modal-backdrop', 'true');
    
    // Cerrar modal al hacer click fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
}

function filtrarTiendas() {
    mostrarTiendas();
}

function verOrdenesTienda(tiendaId) {
    console.log('🔍 verOrdenesTienda llamada con tiendaId:', tiendaId, 'Tipo:', typeof tiendaId);
    
    // Cambiar el grid a layout normal para la vista de tienda
    const listaTiendas = document.getElementById('listaTiendas');
    listaTiendas.style.display = 'block';
    listaTiendas.style.width = '100%';
    listaTiendas.style.maxWidth = 'none';
    
    // Asegurar que tiendaId es string
    tiendaId = String(tiendaId).trim();
    
    const tiendas = Storage.get('tiendas');
    const ordenes = Storage.get('ordenes');
    const clientes = Storage.get('clientes');
    
    console.log('📍 Tiendas disponibles:', tiendas.map(t => ({id: t.id, nombre: t.nombre})));
    console.log('🔎 Buscando tienda con ID:', tiendaId);
    
    const tienda = tiendas.find(t => String(t.id).trim() === tiendaId);
    console.log('🏪 Tienda encontrada:', tienda);
    
    if (!tienda) {
        alert('❌ Error: Tienda no encontrada. ID buscado: ' + tiendaId);
        document.getElementById('listaTiendas').innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ff0000;">❌ Error: Tienda no encontrada</div>';
        return;
    }
    
    // Mostrar la sección de tiendas
    mostrarSeccion('tiendas');
    
    const ordenesTienda = ordenes.filter(o => String(o.tiendaId).trim() === tiendaId);
    console.log('📦 Órdenes de tienda:', ordenesTienda.length);
    
    // Definir estados disponibles
    const estados = ['Recibido', 'En Diagnóstico', 'Esperando Repuestos', 'En Reparación', 'Listo para Entrega', 'Entregado', 'Cancelado'];
    
    // Separar órdenes por estado
    const ordenesPorEstado = {};
    estados.forEach(estado => {
        ordenesPorEstado[estado] = ordenesTienda.filter(o => o.estado === estado);
    });
    
    // Calcular dinero pendiente total (órdenes en "Listo para Entrega" sin cobrar)
    const ordenesPendienteCobro = ordenesTienda.filter(o => o.estado === 'Listo para Entrega' && !o.cobrado);
    const dineroPendienteTotal = ordenesPendienteCobro.reduce((total, orden) => {
        const monto = parseFloat(orden.presupuesto) || 0;
        return total + monto;
    }, 0);
    
    let html = `
        <div style="background: white; padding: 0; margin: 0; box-sizing: border-box; width: 100%; min-height: 100vh; display: flex; flex-direction: column;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 35px 60px; color: white; display: flex; justify-content: space-between; align-items: flex-start; gap: 50px;">
                <div style="flex: 1;">
                    <h2 style="margin: 0 0 20px 0; color: white; font-size: 42px; font-weight: bold;">${tienda.nombre}</h2>
                    <div style="color: rgba(255,255,255,0.9); font-size: 15px; display: flex; gap: 60px; flex-wrap: wrap;">
                        <span><strong>👤</strong> ${tienda.contacto || 'No registrado'}</span>
                        <span><strong>📞</strong> ${tienda.telefono || 'No registrado'}</span>
                        <span><strong>📍</strong> ${tienda.direccion || 'No registrada'}</span>
                    </div>
                </div>
                <button onclick="mostrarSeccion('tiendas'); mostrarTiendas();" class="btn-secondary" style="padding: 14px 30px; font-size: 16px; height: fit-content; white-space: nowrap;">← Volver</button>
            </div>
            <div style="flex: 1; padding: 50px 60px; box-sizing: border-box; overflow-y: auto; width: 100%; max-width: 100%;">
            
            <!-- Estadísticas -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; margin-bottom: 50px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; color: white; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <p style="margin: 0; font-size: 15px; opacity: 0.9; font-weight: 600;">📦 Total Órdenes</p>
                    <p style="margin: 15px 0 0 0; font-size: 48px; font-weight: bold;">${ordenesTienda.length}</p>
                </div>
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 12px; color: white; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <p style="margin: 0; font-size: 15px; opacity: 0.9; font-weight: 600;">💰 Dinero Pendiente</p>
                    <p style="margin: 15px 0 0 0; font-size: 48px; font-weight: bold;">$${formatearMonto(dineroPendienteTotal)}</p>
                </div>
                <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; border-radius: 12px; color: white; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <p style="margin: 0; font-size: 15px; opacity: 0.9; font-weight: 600;">✅ Pendiente Cobro</p>
                    <p style="margin: 15px 0 0 0; font-size: 48px; font-weight: bold;">$${formatearMonto(dineroPendienteTotal)}</p>
                </div>
                <div style="background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%); padding: 30px; border-radius: 12px; color: white; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <p style="margin: 0; font-size: 15px; opacity: 0.9; font-weight: 600;">📊 Total Órdenes</p>
                    <p style="margin: 15px 0 0 0; font-size: 48px; font-weight: bold;">${ordenesTienda.length}</p>
                </div>
            </div>
    `;
    
    // Función para generar tabla de órdenes
    const generarTablaOrdenes = (ordenesGrupo, titulo) => {
        if (ordenesGrupo.length === 0) {
            return `<p style="text-align: center; color: #999; padding: 20px; background: #f5f5f5; border-radius: 8px;">Sin órdenes en este estado</p>`;
        }
        
        let tabla = `
            <h3 style="margin: 30px 0 20px 0; color: #333; padding-bottom: 18px; border-bottom: 4px solid #667eea; font-size: 24px; font-weight: bold;">
                ${titulo}
            </h3>
            <div style="width: 100%; box-sizing: border-box; margin-bottom: 50px; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; box-sizing: border-box;">
                    <thead>
                        <tr style="background: #f5f5f5; border-bottom: 3px solid #667eea; box-sizing: border-box;">
                            <th style="padding: 14px; text-align: left; border: 1px solid #e0e0e0; font-size: 13px; font-weight: bold; white-space: nowrap; box-sizing: border-box;">#Orden</th>
                            <th style="padding: 14px; text-align: left; border: 1px solid #e0e0e0; font-size: 13px; font-weight: bold; white-space: nowrap; box-sizing: border-box;">Cliente</th>
                            <th style="padding: 14px; text-align: left; border: 1px solid #e0e0e0; font-size: 13px; font-weight: bold; white-space: nowrap; box-sizing: border-box;">Equipo</th>
                            <th style="padding: 14px; text-align: center; border: 1px solid #e0e0e0; font-size: 13px; font-weight: bold; white-space: nowrap; box-sizing: border-box;">Fecha</th>
                            <th style="padding: 14px; text-align: right; border: 1px solid #e0e0e0; font-size: 13px; font-weight: bold; white-space: nowrap; box-sizing: border-box;">Monto</th>
                            <th style="padding: 14px; text-align: center; border: 1px solid #e0e0e0; font-size: 13px; font-weight: bold; white-space: nowrap; box-sizing: border-box;">Estado</th>
                            <th style="padding: 14px; text-align: center; border: 1px solid #e0e0e0; font-size: 13px; font-weight: bold; white-space: nowrap; box-sizing: border-box;">Cambiar</th>
                            <th style="padding: 14px; text-align: center; border: 1px solid #e0e0e0; font-size: 13px; font-weight: bold; white-space: nowrap; box-sizing: border-box;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody style="box-sizing: border-box;">
        `;
        
        ordenesGrupo.forEach((orden, index) => {
            const cliente = clientes.find(c => c.id === orden.clienteId);
            const tienda = orden.tiendaId ? tiendas.find(t => t.id === orden.tiendaId) : null;
            const clienteNombre = tienda ? tienda.nombre : (cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente Final');
            const presupuesto = parseFloat(orden.presupuesto) || 0;
            const pagado = parseFloat(orden.anticipo) || 0;
            const pendiente = presupuesto - pagado;
            
            console.log(`📊 Orden #${orden.id}: estado=${orden.estado}, cobrado=${orden.cobrado}, mostrarBotón=${orden.estado === 'Listo para Entrega' && (orden.cobrado === false || orden.cobrado === undefined)}`);
            const colorPendiente = pendiente > 0 ? '#f44336' : '#4caf50';
            const estadoCobro = orden.cobrado ? '✅ Cobrado' : '⏳ Pendiente';
            const colorEstadoCobro = orden.cobrado ? '#4caf50' : '#ff9800';
            
            tabla += `
                <tr style="border-bottom: 1px solid #e0e0e0; background: ${index % 2 === 0 ? 'white' : '#fafafa'}; box-sizing: border-box; transition: background 0.2s;">
                    <td style="padding: 12px 14px; border: 1px solid #e0e0e0; white-space: nowrap; font-size: 13px; box-sizing: border-box;"><strong>#${orden.numero}</strong></td>
                    <td style="padding: 12px 14px; border: 1px solid #e0e0e0; font-size: 13px; white-space: nowrap; box-sizing: border-box; max-width: 160px; overflow: hidden; text-overflow: ellipsis;">${clienteNombre}</td>
                    <td style="padding: 12px 14px; border: 1px solid #e0e0e0; font-size: 13px; white-space: nowrap; box-sizing: border-box; max-width: 140px; overflow: hidden; text-overflow: ellipsis;">${orden.marca} ${orden.modelo}</td>
                    <td style="padding: 12px 14px; border: 1px solid #e0e0e0; font-size: 13px; white-space: nowrap; text-align: center; box-sizing: border-box;">${new Date(orden.fechaCreacion || new Date()).toLocaleDateString('es-ES', {month: 'short', day: 'numeric'})}</td>
                    <td style="padding: 12px 14px; text-align: right; border: 1px solid #e0e0e0; font-weight: bold; font-size: 13px; white-space: nowrap; box-sizing: border-box;">$${formatearMonto(presupuesto)}</td>
                    <td style="padding: 12px 14px; text-align: center; border: 1px solid #e0e0e0; font-size: 12px; white-space: nowrap; box-sizing: border-box;">
                        <span style="background: ${orden.estado === 'Entregado' ? '#4caf50' : orden.estado === 'Cancelado' ? '#f44336' : '#2196F3'}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold;">${orden.estado.substring(0, 6)}</span>
                    </td>
                    <td style="padding: 10px; text-align: center; border: 1px solid #e0e0e0; box-sizing: border-box;">
                        <select onchange="cambiarEstadoOrdenTienda(${orden.id}, this.value); verOrdenesTienda('${tiendaId}');" style="padding: 6px 5px; font-size: 12px; border-radius: 3px; border: 1px solid #ccc; width: 100%; max-width: 105px;">
                            <option value="">--</option>
                            <option value="Recibido">Recib.</option>
                            <option value="En Diagnóstico">Diagn.</option>
                            <option value="Esperando Repuestos">Repuestos</option>
                            <option value="En Reparación">Repara.</option>
                            <option value="Listo para Entrega">Listo</option>
                            <option value="Entregado">Entreg.</option>
                            <option value="Cancelado">Canc.</option>
                        </select>
                    </td>
                    <td style="padding: 10px; text-align: center; border: 1px solid #e0e0e0; display: flex; gap: 3px; justify-content: center; align-items: center; flex-wrap: nowrap; box-sizing: border-box;">
                        <button onclick="editarOrden(${orden.id}); mostrarSeccion('ordenes');" title="Ver orden" style="padding: 6px 8px; font-size: 14px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; flex-shrink: 0; transition: background 0.2s;">✏️</button>
                        ${orden.estado === 'Listo para Entrega' ? `<button onclick="try { marcarComoCobrado(${orden.id}); } catch(e) { console.error(e); } verOrdenesTienda('${tiendaId}');" title="Cobrar" style="padding: 6px 8px; font-size: 14px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; flex-shrink: 0; transition: background 0.2s;">💰</button>` : ''}
                        ${orden.estado === 'Entregado' ? `<button onclick="imprimirFactura(${orden.id});" title="Imprimir factura" style="padding: 6px 8px; font-size: 14px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer; flex-shrink: 0; transition: background 0.2s;">🖨️</button>` : ''}
                    </td>
                </tr>
            `;
        });
        
        tabla += `
                    </tbody>
                </table>
            </div>
        `;
        
        return tabla;
    };
    
    // Agregar tablas de órdenes por estado
    let tablas = '';
    estados.forEach(estado => {
        const ordenesEstado = ordenesPorEstado[estado];
        if (ordenesEstado && ordenesEstado.length > 0) {
            tablas += generarTablaOrdenes(ordenesEstado, `${estado} (${ordenesEstado.length})`);
        }
    });
    html += tablas || '<div style="text-align: center; padding: 40px; color: #999; background: #f5f5f5; border-radius: 8px;">No hay órdenes registradas para esta tienda</div>';
    
    html += `<div style="margin-top: 30px; text-align: center; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <button onclick="generarReporteCuentasPorCobrar('${tiendaId}').catch(e => console.error(e));" class="btn-primary" style="padding: 12px 24px; background: #ff9800;">📊 Imprimir Reporte de Cuentas</button>
        <button onclick="mostrarSeccion('tiendas'); mostrarTiendas();" class="btn-secondary" style="padding: 12px 24px;">← Volver a Tiendas</button>
    </div></div>`;
    
    document.getElementById('listaTiendas').innerHTML = html;
}

// === SINCRONIZACIÓN EN TIEMPO REAL CON FIREBASE ===
function inicializarSincronizacionTiendas() {
    try {
        const usuario = localStorage.getItem('usuarioActual');
        if (!usuario) return;
        
        // Escuchar cambios en la colección de tiendas
        db.collection('usuarios-data').doc(usuario).collection('tiendas')
            .onSnapshot((snapshot) => {
                const tiendas = [];
                snapshot.forEach(doc => {
                    tiendas.push(doc.data());
                });
                
                // Si hay cambios, actualizar localStorage
                if (tiendas.length > 0) {
                    const tiendas_actual = Storage.get('tiendas') || [];
                    const tiendas_nuevas = JSON.stringify(tiendas);
                    const tiendas_actual_str = JSON.stringify(tiendas_actual);
                    
                    // Solo actualizar si hay cambios
                    if (tiendas_nuevas !== tiendas_actual_str) {
                        localStorage.setItem('tiendas', tiendas_nuevas);
                        console.log('🔄 Tiendas sincronizadas desde Firebase');
                        
                        // Si estamos viendo tiendas, actualizar la vista
                        if (document.getElementById('tiendas') && document.getElementById('tiendas').style.display !== 'none') {
                            mostrarTiendas();
                        }
                    }
                }
            }, (error) => {
                console.error('❌ Error al escuchar tiendas:', error);
            });
    } catch (error) {
        console.error('❌ Error inicializando sincronización:', error);
    }
}

// Inicializar tiendas cuando se carga la sección
window.addEventListener('load', function() {
    // Inicializar sincronización de tiendas en tiempo real con Firebase
    inicializarSincronizacionTiendas();
    
    // Esto se ejecutará cuando el DOM esté listo
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'tiendas' && mutation.target.classList.contains('section')) {
                if (mutation.target.style.display !== 'none') {
                    mostrarTiendas();
                }
            }
        });
    });
});

// Cambiar estado de orden desde vista de tienda
function cambiarEstadoOrdenTienda(ordenId, nuevoEstado) {
    if (!nuevoEstado) return;
    
    console.log('🔄 Cambiando orden:', ordenId, 'a estado:', nuevoEstado);
    
    const ordenes = Storage.get('ordenes');
    const orden = ordenes.find(o => o.id === ordenId);
    
    if (!orden) {
        alert('❌ Orden no encontrada');
        return;
    }
    
    const estadoAnterior = orden.estado;
    orden.estado = nuevoEstado;
    
    // Cuando cambia a "Listo para Entrega", asegurar que cobrado sea false para mostrar botón
    if (nuevoEstado === 'Listo para Entrega') {
        orden.cobrado = false;
    }
    
    // Inicializar el campo cobrado si no existe
    if (orden.cobrado === undefined) {
        orden.cobrado = false;
    }
    
    console.log('✅ Estado:', orden.estado, '| Cobrado:', orden.cobrado);
    
    // Si cambia a "Entregado", realizar los mismos pasos que en la vista de órdenes
    if (nuevoEstado === 'Entregado') {
        orden.fechaEntrega = new Date().toISOString();
        
        // Si hay saldo pendiente, solicitar pago final
        const saldoPendiente = (orden.presupuesto || 0) - (orden.anticipo || 0);
        
        if (saldoPendiente > 0) {
            const metodoPago = prompt(`Orden será entregada.\n\nSaldo Pendiente: $${formatearMonto(saldoPendiente)}\n\nSelecciona método de pago:\n1. Efectivo\n2. Tarjeta Débito\n3. Tarjeta Crédito\n4. Transferencia`);
            const metodos = ['Efectivo', 'Tarjeta Débito', 'Tarjeta Crédito', 'Transferencia'];
            const index = parseInt(metodoPago) - 1;
            
            if (index >= 0 && index < metodos.length) {
                const metodoSeleccionado = { 
                    nombre: metodos[index], 
                    comision: [0, 0.01, 0.02, 0.01][index]
                };
                
                const pago = saldoPendiente;
                const comision = pago * metodoSeleccionado.comision;
                const montoNeto = pago - comision;
                
                if (!orden.historialPagos) orden.historialPagos = [];
                orden.historialPagos.push({
                    monto: pago,
                    montoNeto: montoNeto,
                    comision: comision,
                    metodoPago: metodoSeleccionado.nombre,
                    fecha: new Date().toISOString(),
                    tipo: 'Pago final al entrega'
                });
                
                Storage.saveAndSync('ordenes', ordenes);
                
                let mensajePago = `✅ Orden entregada!\nMétodo: ${metodoSeleccionado.nombre}\nMonto: $${formatearMonto(pago)}`;
                if (comision > 0) {
                    mensajePago += `\nComisión: $${formatearMonto(comision)}\nMonto neto: $${formatearMonto(montoNeto)}`;
                }
                alert(mensajePago);
                return;
            }
        }
    }
    
    Storage.saveAndSync('ordenes', ordenes);
    alert(`✅ Estado actualizado: ${estadoAnterior} → ${nuevoEstado}`);
}

// Marcar orden como cobrada con registro de pago
function marcarComoCobrado(ordenId) {
    console.log('💰 Iniciando función marcarComoCobrado con ordenId:', ordenId);
    
    const ordenes = Storage.get('ordenes');
    const orden = ordenes.find(o => o.id === ordenId);
    
    if (!orden) {
        alert('❌ Orden no encontrada');
        return;
    }
    
    if (orden.estado !== 'Listo para Entrega') {
        alert('❌ La orden debe estar en estado "Listo para Entrega" para cobrar');
        return;
    }
    
    const saldo = (orden.presupuesto || 0) - (orden.anticipo || 0);
    
    if (saldo <= 0) {
        alert('✅ Esta orden ya está completamente pagada');
        orden.cobrado = true;
        Storage.saveAndSync('ordenes', ordenes);
        return;
    }
    
    // Solicitar método de pago
    const metodoPago = prompt(`💰 COBRAR ORDEN\n\nMonto a Cobrar: $${formatearMonto(saldo)}\n\nSelecciona el método de pago:\n1. Efectivo\n2. Transferencia\n3. Tarjeta\n\nIngresa el número (1, 2 o 3):`);
    
    const metodos = {
        '1': { nombre: 'Efectivo', comision: 0 },
        '2': { nombre: 'Transferencia', comision: 0 },
        '3': { nombre: 'Tarjeta', comision: 0 }
    };
    
    if (!metodos[metodoPago]) {
        alert('❌ Método de pago no válido');
        return;
    }
    
    const metodoSeleccionado = metodos[metodoPago];
    const comision = saldo * metodoSeleccionado.comision;
    const montoNeto = saldo - comision;
    
    orden.anticipo = (orden.anticipo || 0) + saldo;
    orden.cobrado = true;
    
    // Registrar el pago en el historial
    if (!orden.historialPagos) {
        orden.historialPagos = [];
    }
    orden.historialPagos.push({
        monto: saldo,
        montoNeto: montoNeto,
        comision: comision,
        metodoPago: metodoSeleccionado.nombre,
        fecha: new Date().toISOString(),
        tipo: 'Pago final desde tienda'
    });
    
    Storage.saveAndSync('ordenes', ordenes);
    
    let mensajePago = `✅ PAGO REGISTRADO EXITOSAMENTE!\n\nMétodo: ${metodoSeleccionado.nombre}\nMonto: $${formatearMonto(saldo)}`;
    if (comision > 0) {
        mensajePago += `\nComisión: $${formatearMonto(comision)}\nMonto neto: $${formatearMonto(montoNeto)}`;
    }
    mensajePago += `\n\n✅ Orden marcada como cobrada`;
    
    alert(mensajePago);
}

// Imprimir factura de orden
function imprimirFactura(ordenId) {
    const ordenes = Storage.get('ordenes');
    const clientes = Storage.get('clientes');
    const tiendas = Storage.get('tiendas');
    
    const orden = ordenes.find(o => o.id === ordenId);
    if (!orden) {
        alert('❌ Orden no encontrada');
        return;
    }
    
    const cliente = clientes.find(c => c.id === orden.clienteId);
    const tienda = orden.tiendaId ? tiendas.find(t => t.id === orden.tiendaId) : null;
    const nombreCliente = tienda ? tienda.nombre : (cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente Final');
    
    const presupuesto = parseFloat(orden.presupuesto) || 0;
    const anticipo = parseFloat(orden.anticipo) || 0;
    const saldo = presupuesto - anticipo;
    
    const fecha = new Date(orden.fechaCreacion).toLocaleDateString('es-ES');
    
    const contenido = `
        <html>
        <head>
            <title>Factura Orden #${orden.numero}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .titulo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                .linea { border-bottom: 2px solid #333; margin: 20px 0; }
                .detalles { margin: 20px 0; }
                .detalles p { margin: 5px 0; }
                .tabla { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .tabla th { background: #f0f0f0; padding: 10px; text-align: left; border: 1px solid #ddd; }
                .tabla td { padding: 10px; border: 1px solid #ddd; }
                .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
                .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="titulo">FACTURA</div>
                <div>Orden #${orden.numero}</div>
            </div>
            
            <div class="linea"></div>
            
            <div class="detalles">
                <p><strong>Cliente:</strong> ${nombreCliente}</p>
                <p><strong>Equipo:</strong> ${orden.marca} ${orden.modelo}</p>
                <p><strong>Fecha:</strong> ${fecha}</p>
                <p><strong>Estado:</strong> ${orden.estado}</p>
            </div>
            
            <div class="linea"></div>
            
            <table class="tabla">
                <tr>
                    <th>Concepto</th>
                    <th style="text-align: right;">Monto</th>
                </tr>
                <tr>
                    <td>Presupuesto Total</td>
                    <td style="text-align: right;">$${formatearMonto(presupuesto)}</td>
                </tr>
                <tr>
                    <td>Anticipo Pagado</td>
                    <td style="text-align: right;">$${formatearMonto(anticipo)}</td>
                </tr>
                <tr style="background: #f0f0f0; font-weight: bold;">
                    <td>Saldo</td>
                    <td style="text-align: right;">$${formatearMonto(saldo)}</td>
                </tr>
            </table>
            
            <div class="total">
                <p>Estado del Pago: ${orden.cobrado ? '✅ PAGADA' : '⏳ PENDIENTE'}</p>
            </div>
            
            <div class="footer">
                <p>Generado el ${new Date().toLocaleString('es-ES')}</p>
            </div>
        </body>
        </html>
    `;
    
    const ventana = window.open('', 'factura', 'width=800,height=600');
    ventana.document.write(contenido);
    ventana.document.close();
    setTimeout(() => ventana.print(), 250);
}

// === REPORTES DE CUENTAS POR COBRAR POR TIENDA ===
// Función para obtener órdenes pendientes de pago de una tienda
async function obtenerOrdenesPendientesTienda(tiendaId) {
    // Sincronizar con Firebase primero para garantizar datos actuales
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
        try {
            const ordenes = await Storage.loadFromFirebase(usuario, 'ordenes');
            Storage.set('ordenes', ordenes);
            console.log('✅ Órdenes sincronizadas desde Firebase');
        } catch (error) {
            console.warn('⚠️ No se pudo sincronizar órdenes, usando caché local:', error);
        }
    }
    
    const ordenes = Storage.get('ordenes') || [];
    return ordenes.filter(o => {
        return String(o.tiendaId).trim() === String(tiendaId).trim() && 
               (o.estado === 'Listo para Entrega' || o.estado === 'Entregado') &&
               ((o.cobrado === false || o.cobrado === undefined) || (parseFloat(o.presupuesto) || 0) > (parseFloat(o.anticipo) || 0));
    });
}

// Función para generar PDF del reporte de cuentas por cobrar
async function generarReporteCuentasPorCobrar(tiendaId) {
    // Mostrar indicador de sincronización
    console.log('🔄 Sincronizando datos con Firebase...');
    mostrarNotificacion('🔄 Sincronizando datos...', 'info');
    
    // Sincronizar tiendas, órdenes y clientes desde Firebase
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
        try {
            const [tiendas, ordenes, clientes] = await Promise.all([
                Storage.loadFromFirebase(usuario, 'tiendas'),
                Storage.loadFromFirebase(usuario, 'ordenes'),
                Storage.loadFromFirebase(usuario, 'clientes')
            ]);
            
            // Actualizar localStorage con datos actuales
            Storage.set('tiendas', tiendas);
            Storage.set('ordenes', ordenes);
            Storage.set('clientes', clientes);
            
            console.log('✅ Datos sincronizados desde Firebase');
        } catch (error) {
            console.warn('⚠️ Algunos datos no se pudieron sincronizar, usando caché local:', error);
        }
    }
    
    const tiendas = Storage.get('tiendas') || [];
    const tienda = tiendas.find(t => String(t.id).trim() === String(tiendaId).trim());
    
    if (!tienda) {
        alert('❌ Tienda no encontrada');
        return;
    }
    
    const ordenesPendientes = await obtenerOrdenesPendientesTienda(tiendaId);
    const clientes = Storage.get('clientes') || [];
    
    // Calcular totales
    let totalPresupuesto = 0;
    let totalAnticipo = 0;
    let totalPendiente = 0;
    
    const detallesOrdenes = ordenesPendientes.map(orden => {
        const presupuesto = parseFloat(orden.presupuesto) || 0;
        const anticipo = parseFloat(orden.anticipo) || 0;
        const pendiente = presupuesto - anticipo;
        const cliente = clientes.find(c => c.id === orden.clienteId);
        const nombreCliente = cliente ? `${cliente.nombre} ${cliente.apellido}` : tienda.nombre;
        
        totalPresupuesto += presupuesto;
        totalAnticipo += anticipo;
        totalPendiente += pendiente;
        
        return {
            numero: orden.numero,
            cliente: nombreCliente,
            equipo: `${orden.marca} ${orden.modelo}`,
            imei: orden.numero || '-',
            fechaIngreso: new Date(orden.fechaCreacion || new Date()).toLocaleDateString('es-ES'),
            estado: orden.estado,
            presupuesto: presupuesto,
            anticipo: anticipo,
            pendiente: pendiente
        };
    });
    
    // Crear documento HTML para imprimir
    const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reporte de Cuentas por Cobrar - ${tienda.nombre}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                html, body {
                    width: 100%;
                    margin: 0;
                    padding: 0;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    background: white;
                    color: #333;
                    line-height: 1.4;
                    font-size: 14px;
                }
                
                .container {
                    width: 100%;
                    max-width: 210mm;
                    margin: 0 auto;
                    background: white;
                    page-break-after: always;
                }
                
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 25px;
                    margin-bottom: 0;
                }
                
                .header h1 {
                    font-size: 22px;
                    margin-bottom: 8px;
                    font-weight: 700;
                }
                
                .header-subtitle {
                    font-size: 14px;
                    opacity: 0.95;
                    margin-bottom: 12px;
                }
                
                .header-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    font-size: 12px;
                    margin-top: 12px;
                }
                
                .header-info div {
                    opacity: 0.95;
                    break-inside: avoid;
                }
                
                .header-info strong {
                    display: block;
                    font-weight: 700;
                    opacity: 1;
                    margin-bottom: 2px;
                }
                
                .content {
                    padding: 20px 25px;
                    background: white;
                }
                
                .stats-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 20px;
                    page-break-inside: avoid;
                }
                
                .stat-box {
                    background: #f0f4f8;
                    padding: 15px;
                    border-radius: 6px;
                    border-left: 4px solid #667eea;
                    page-break-inside: avoid;
                }
                
                .stat-box.warning {
                    border-left-color: #f59e0b;
                    background: #fffbf0;
                }
                
                .stat-box.success {
                    border-left-color: #10b981;
                    background: #f0fdf4;
                }
                
                .stat-label {
                    font-size: 11px;
                    color: #666;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 6px;
                    letter-spacing: 0.5px;
                }
                
                .stat-value {
                    font-size: 18px;
                    font-weight: 700;
                    color: #333;
                }
                
                .table-wrapper {
                    overflow: visible;
                    margin-bottom: 15px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                    page-break-inside: avoid;
                }
                
                table thead {
                    background: #f5f5f5;
                    border-bottom: 2px solid #667eea;
                }
                
                table th {
                    padding: 10px 8px;
                    text-align: left;
                    font-weight: 700;
                    color: #333;
                    font-size: 11px;
                    border-right: 1px solid #e0e0e0;
                }
                
                table th:last-child {
                    border-right: none;
                }
                
                table td {
                    padding: 8px;
                    border-bottom: 1px solid #e0e0e0;
                    font-size: 12px;
                }
                
                table tbody tr:nth-child(even) {
                    background: #fafafa;
                }
                
                table tbody tr:last-child td {
                    border-bottom: none;
                }
                
                .text-right {
                    text-align: right;
                }
                
                .font-bold {
                    font-weight: 700;
                }
                
                .total-row {
                    background: #667eea !important;
                    color: white;
                    font-weight: 700;
                    page-break-inside: avoid;
                }
                
                .total-row td {
                    color: white;
                    border-bottom: none;
                    padding: 10px 8px;
                    font-weight: 700;
                }
                
                .footer {
                    background: #f5f5f5;
                    padding: 15px 25px;
                    text-align: center;
                    font-size: 11px;
                    color: #999;
                    border-top: 1px solid #e0e0e0;
                    page-break-inside: avoid;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 30px;
                    color: #999;
                    background: #f9f9f9;
                    border-radius: 6px;
                    margin-top: 15px;
                    page-break-inside: avoid;
                }
                
                .estado-listo {
                    background: #e3f2fd;
                    color: #1565c0;
                    padding: 2px 5px;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: 700;
                    display: inline-block;
                }
                
                .estado-entregado {
                    background: #e8f5e9;
                    color: #2e7d32;
                    padding: 2px 5px;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: 700;
                    display: inline-block;
                }
                
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    
                    .container {
                        box-shadow: none;
                        page-break-after: always;
                    }
                    
                    table {
                        page-break-inside: auto;
                    }
                    
                    table tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                    
                    .stat-box {
                        page-break-inside: avoid;
                    }
                }
                
                @page {
                    size: A4;
                    margin: 0.5cm;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 REPORTE DE CUENTAS POR COBRAR</h1>
                    <div class="header-subtitle">Órdenes pendientes de pago</div>
                    <div class="header-info">
                        <div>
                            <strong>🏪 Tienda:</strong>
                            ${tienda.nombre}
                        </div>
                        <div>
                            <strong>📞 Contacto:</strong>
                            ${tienda.telefono || 'No registrado'}
                        </div>
                        <div>
                            <strong>📍 Dirección:</strong>
                            ${tienda.direccion || 'No registrada'}
                        </div>
                        <div>
                            <strong>✉️ Email:</strong>
                            ${tienda.email || 'No registrado'}
                        </div>
                    </div>
                </div>
                
                <div class="content">
                    <div class="stats-section">
                        <div class="stat-box">
                            <div class="stat-label">📦 Total Órdenes Pendientes</div>
                            <div class="stat-value">${ordenesPendientes.length}</div>
                        </div>
                        <div class="stat-box warning">
                            <div class="stat-label">💰 Monto Total a Cobrar</div>
                            <div class="stat-value">$${formatearMonto(totalPendiente)}</div>
                        </div>
                    </div>
                    
                    ${ordenesPendientes.length > 0 ? `
                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#Orden</th>
                                        <th>Cliente</th>
                                        <th>Equipo</th>
                                        <th>IMEI</th>
                                        <th>Fecha Ingreso</th>
                                        <th>Estado</th>
                                        <th class="text-right">Presupuesto</th>
                                        <th class="text-right">Anticipo</th>
                                        <th class="text-right">Pendiente</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${detallesOrdenes.map((orden, index) => `
                                        <tr>
                                            <td class="font-bold">#${orden.numero}</td>
                                            <td>${orden.cliente}</td>
                                            <td>${orden.equipo}</td>
                                            <td>${orden.imei}</td>
                                            <td>${orden.fechaIngreso}</td>
                                            <td>
                                                ${orden.estado === 'Listo para Entrega' ? 
                                                    '<span class="estado-listo">Listo</span>' : 
                                                    '<span class="estado-entregado">Entregado</span>'
                                                }
                                            </td>
                                            <td class="text-right">$${formatearMonto(orden.presupuesto)}</td>
                                            <td class="text-right">$${formatearMonto(orden.anticipo)}</td>
                                            <td class="text-right font-bold" style="color: #f59e0b;">$${formatearMonto(orden.pendiente)}</td>
                                        </tr>
                                    `).join('')}
                                    <tr class="total-row">
                                        <td colspan="6" style="text-align: right; padding-right: clamp(0.5rem, 1.5vw, 0.875rem);">TOTAL:</td>
                                        <td class="text-right">$${formatearMonto(totalPresupuesto)}</td>
                                        <td class="text-right">$${formatearMonto(totalAnticipo)}</td>
                                        <td class="text-right">$${formatearMonto(totalPendiente)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                                </tr>
                            </tbody>
                        </table>
                    ` : `
                        <div class="empty-state">
                            <p>✅ ¡Excelente! No hay órdenes pendientes de pago para esta tienda.</p>
                        </div>
                    `}
                </div>
                
                <div class="footer">
                    <p>Reporte generado el ${new Date().toLocaleString('es-ES')}</p>
                    <p>© 2025 Sistema de Taller - Tu Taller</p>
                    <div class="print-info">
                        <p>Imprima este documento y entréguelo a la tienda para su registro.</p>
                    </div>
                </div>
            </div>
            
            <script>
                // Auto-print después de cargar
                window.addEventListener('load', function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                });
            </script>
        </body>
        </html>
    `;
    
    // Crear modal con opciones de imprimir y descargar
    mostrarModalAccionesReporte(html, tienda.nombre);
}

// Función para mostrar modal con opciones de imprimir o descargar
function mostrarModalAccionesReporte(html, nombreTienda) {
    // Crear modal
    const modal = document.createElement('div');
    modal.id = 'modalAccionesReporte';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
        ">
            <h2 style="
                margin: 0 0 20px 0;
                color: #333;
                font-size: 24px;
                font-weight: bold;
            ">📊 Reporte Listo</h2>
            
            <p style="
                margin: 0 0 30px 0;
                color: #666;
                font-size: 16px;
                line-height: 1.5;
            ">
                Reporte de Cuentas por Cobrar<br>
                <strong>${nombreTienda}</strong>
            </p>
            
            <div style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            ">
                <button onclick="imprimirReporte('${nombreTienda}')" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 15px 20px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: transform 0.2s;
                ">
                    🖨️ Imprimir
                </button>
                <button onclick="descargarReportePDF('${nombreTienda}')" style="
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    border: none;
                    padding: 15px 20px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: transform 0.2s;
                ">
                    📥 Descargar
                </button>
            </div>
            
            <button onclick="cerrarModalAccionesReporte()" style="
                margin-top: 15px;
                background: #e0e0e0;
                color: #333;
                border: none;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                width: 100%;
            ">
                ✕ Cerrar
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Almacenar HTML del reporte en variable global para usarlo después
    window.htmlReporteActual = html;
}

// Función para cerrar modal
function cerrarModalAccionesReporte() {
    const modal = document.getElementById('modalAccionesReporte');
    if (modal) {
        modal.remove();
    }
    window.htmlReporteActual = null;
}

// Función para imprimir el reporte
function imprimirReporte(nombreTienda) {
    const html = window.htmlReporteActual;
    if (!html) {
        alert('Error: No hay reporte para imprimir');
        return;
    }
    
    // Cerrar modal
    cerrarModalAccionesReporte();
    
    mostrarNotificacion('🖨️ Abriendo diálogo de impresión...', 'info');
    
    try {
        // Crear blob del HTML
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        // Abrir en nueva ventana
        const ventana = window.open(url, 'reporteCuentasPorCobrar', 'width=1000,height=800');
        
        if (!ventana) {
            mostrarNotificacion('❌ No se pudo abrir la ventana. Verifica bloqueador de pop-ups.', 'error');
            return;
        }
        
        // Esperar a que cargue y luego imprimir
        ventana.addEventListener('load', function() {
            setTimeout(function() {
                ventana.focus();
                ventana.print();
                mostrarNotificacion('✅ Diálogo de impresión abierto', 'success');
            }, 800);
        }, false);
        
    } catch (error) {
        console.error('Error en imprimirReporte:', error);
        mostrarNotificacion('❌ Error al abrir impresión', 'error');
    }
}

// Función para descargar el reporte como PDF
function descargarReportePDF(nombreTienda) {
    const htmlContent = window.htmlReporteActual;
    if (!htmlContent) {
        alert('Error: No hay reporte para descargar');
        return;
    }
    
    cerrarModalAccionesReporte();
    
    mostrarNotificacion('💾 Descargando PDF...', 'info');
    
    try {
        // Crear blob del HTML
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        // Crear elemento link temporal
        const link = document.createElement('a');
        link.href = url;
        
        // Generar nombre del archivo
        const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
        const filename = `Reporte-Cuentas-${nombreTienda}-${fecha}.html`;
        link.download = filename;
        
        // Agregar al documento y hacer click
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Limpiar
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
        
        mostrarNotificacion(`✅ Descargado: ${filename}. Abre en navegador y usa Ctrl+P para guardar como PDF.`, 'success');
        
    } catch (error) {
        console.error('Error en descargarReportePDF:', error);
        mostrarNotificacion('❌ Error al descargar', 'error');
    }
}

// Exponer funciones de tiendas
window.mostrarFormTienda = mostrarFormTienda;
window.cancelarFormTienda = cancelarFormTienda;
window.guardarTienda = guardarTienda;
window.editarTienda = editarTienda;
window.handleEditarTienda = handleEditarTienda;
window.eliminarTienda = eliminarTienda;
window.handleEliminarTienda = handleEliminarTienda;
window.mostrarTiendas = mostrarTiendas;
window.filtrarTiendas = filtrarTiendas;
window.imprimirFactura = imprimirFactura;
window.verOrdenesTienda = verOrdenesTienda;
window.calcularDineroTienda = calcularDineroTienda;
window.validarClienteRequerido = validarClienteRequerido;
window.marcarComoCobrado = marcarComoCobrado;
window.cambiarEstadoOrdenTienda = cambiarEstadoOrdenTienda;
window.generarReporteCuentasPorCobrar = generarReporteCuentasPorCobrar;
window.obtenerOrdenesPendientesTienda = obtenerOrdenesPendientesTienda;
window.mostrarModalAccionesReporte = mostrarModalAccionesReporte;
window.cerrarModalAccionesReporte = cerrarModalAccionesReporte;
window.imprimirReporte = imprimirReporte;
window.descargarReportePDF = descargarReportePDF;
