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

// Exportar funciones básicas inmediatamente
window.verificarSesion = verificarSesion;
window.verificarLicenciaActiva = verificarLicenciaActiva;

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
                // Limpiar datos de cualquier sesión anterior
                Storage.clear();
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
    mostrarInfoLicencia();
    
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
    
    try {
        // Buscar usuario en Firebase Firestore
        const snapshot = await db.collection('usuarios')
            .where('usuario', '==', username)
            .get();
        
        let usuarioEncontrado = null;
        if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();
            // Verificar contraseña
            if (userData.password === password) {
                usuarioEncontrado = userData;
            }
        }
        
        // También permitir credenciales admin por defecto
        const esAdmin = (username === 'admin' && password === 'admin123');
        
        if (usuarioEncontrado || esAdmin) {
            const nombreTaller = usuarioEncontrado ? (usuarioEncontrado.nombreTaller || 'Taller de Reparaciones') : 'Taller de Reparaciones';
            
            // IMPORTANTE: Limpiar datos de cualquier usuario anterior
            console.log('🧹 Limpiando datos de sesión anterior...');
            Storage.clear();
            
            localStorage.setItem('sesionActiva', 'true');
            localStorage.setItem('usuario', username);
            localStorage.setItem('nombreTaller', nombreTaller);
            
            // Cargar datos desde Firebase
            await cargarDatosUsuario(username);
            
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            actualizarDashboard();
        } else {
            alert('❌ Usuario o contraseña incorrectos');
            document.getElementById('loginPassword').value = '';
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alert('❌ Error al verificar credenciales. Por favor intenta de nuevo.');
    }
});

// Función para cargar datos del usuario desde Firebase
async function cargarDatosUsuario(usuario) {
    try {
        console.log('🔄 Cargando datos desde Firebase para:', usuario);
        
        // Cargar clientes, órdenes y repuestos desde Firebase
        const clientes = await Storage.loadFromFirebase(usuario, 'clientes');
        const ordenes = await Storage.loadFromFirebase(usuario, 'ordenes');
        const repuestos = await Storage.loadFromFirebase(usuario, 'repuestos');
        
        // Siempre actualizar localStorage con los datos de Firebase (incluso si están vacíos)
        Storage.set('clientes', clientes);
        Storage.set('ordenes', ordenes);
        Storage.set('repuestos', repuestos);
        
        console.log(`✅ Datos cargados - Clientes: ${clientes.length}, Órdenes: ${ordenes.length}, Repuestos: ${repuestos.length}`);
        
        return true;
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        return false;
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
        
        localStorage.removeItem('licenciaTemporal');
        
        // Iniciar sesión automáticamente
        localStorage.setItem('sesionActiva', 'true');
        localStorage.setItem('usuario', usuario);
        localStorage.setItem('nombreTaller', nombreTaller);
        
        // Ocultar modal y mostrar app
        document.getElementById('modalRegistro').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        alert(`✅ ¡Bienvenido ${nombreTaller}! Tu cuenta ha sido creada exitosamente.`);
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
    
    // Crear un pequeño indicador en la esquina
    const indicador = document.createElement('div');
    indicador.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: #28a745; color: white; padding: 8px 12px; border-radius: 5px; font-size: 12px; z-index: 9999; box-shadow: 0 2px 10px rgba(0,0,0,0.2);';
    
    let texto = `🔐 Licencia: ${licencia.licenseType}`;
    if (licencia.fechaExpiracion) {
        const diasRestantes = Math.ceil((new Date(licencia.fechaExpiracion) - new Date()) / (1000 * 60 * 60 * 24));
        texto += ` (${diasRestantes} días restantes)`;
    }
    
    indicador.textContent = texto;
    indicador.title = `Cliente: ${licencia.clientName}\nEmail: ${licencia.clientEmail}`;
    
    // Solo agregar si no existe
    if (!document.querySelector('#licenseIndicator')) {
        indicador.id = 'licenseIndicator';
        document.body.appendChild(indicador);
    }
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
            repuestos: repuestos
        };
        
        // Crear archivo JSON y descargarlo
        const jsonStr = JSON.stringify(datosExportar, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `datos_${usuario}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(`✅ Datos exportados exitosamente\n\nClientes: ${clientes.length}\nÓrdenes: ${ordenes.length}\nRepuestos: ${repuestos.length}\n\nArchivo: datos_${usuario}_${Date.now()}.json`);
        
    } catch (error) {
        console.error('Error al exportar datos:', error);
        alert('❌ Error al exportar datos');
    }
}

// Exportar funciones inmediatamente
window.cerrarSesion = cerrarSesion;
window.exportarDatos = exportarDatos;

// === DATOS DE DEMOSTRACIÓN ===
function cargarDatosDemo() {
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
    
    // Guardar datos
    Storage.set('clientes', clientesDemo);
    Storage.set('repuestos', repuestosDemo);
    Storage.set('ordenes', ordenesDemo);
    
    alert('✅ Datos de demostración cargados exitosamente!');
    location.reload();
}

// Sistema de almacenamiento con Firebase - Cada usuario tiene su propia base de datos
class Storage {
    static get(key) {
        // Verificar que hay sesión activa antes de acceder a datos
        const sesion = localStorage.getItem('sesionActiva');
        if (sesion !== 'true') {
            console.warn('Intento de acceder a Storage sin autenticación');
            return [];
        }
        
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }
    static set(key, data) {
        // Verificar que hay sesión activa antes de guardar datos
        const sesion = localStorage.getItem('sesionActiva');
        if (sesion !== 'true') {
            console.warn('Intento de guardar en Storage sin autenticación');
            return;
        }
        
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
            if (!usuario) return false;
            
            // Verificar autenticación de Firebase
            if (!auth.currentUser || auth.currentUser.email !== usuario) {
                console.error('Usuario no autenticado en Firebase');
                return false;
            }
            
            // Usar subcollection dentro del documento del usuario
            const userRef = db.collection('usuarios-data').doc(usuario);
            const collectionRef = userRef.collection(key);
            
            // Limpiar colección anterior
            const snapshot = await collectionRef.get();
            const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(deletePromises);
            
            // Crear documento del usuario si no existe
            await userRef.set({ 
                ultimaActualizacion: new Date().toISOString(),
                usuario: usuario 
            }, { merge: true });
            
            // Guardar nuevos datos en la subcollection
            const savePromises = data.map(item => 
                collectionRef.add(item)
            );
            await Promise.all(savePromises);
            
            console.log(`✅ Datos de ${key} sincronizados para usuario: ${usuario}`);
            return true;
        } catch (error) {
            console.error(`Error al sincronizar ${key} con Firebase:`, error);
            return false;
        }
    }
    
    static async loadFromFirebase(usuario, key) {
        try {
            if (!usuario) return [];
            
            // Verificar autenticación de Firebase
            if (!auth.currentUser || auth.currentUser.email !== usuario) {
                console.error('Usuario no autenticado en Firebase');
                return [];
            }
            
            // Cargar desde subcollection del usuario
            const collectionRef = db.collection('usuarios-data').doc(usuario).collection(key);
            const snapshot = await collectionRef.get();
            
            const data = [];
            snapshot.forEach(doc => {
                data.push({ ...doc.data(), firebaseId: doc.id });
            });
            
            console.log(`✅ Cargados ${data.length} registros de ${key} para usuario: ${usuario}`);
            return data;
        } catch (error) {
            console.error(`Error al cargar ${key} desde Firebase:`, error);
            // NO hacer fallback a localStorage para evitar mostrar datos de otro usuario
            return [];
        }
    }
    
    static async saveAndSync(key, data) {
        // Guardar localmente
        this.set(key, data);
        
        // Sincronizar con Firebase si hay usuario activo
        const usuario = localStorage.getItem('usuario');
        if (usuario) {
            await this.syncToFirebase(usuario, key, data);
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
        if (section === 'pagos') cargarPagos();
        if (section === 'inventario') filtrarInventario();
        if (section === 'reportes') generarReportes();
    });
});

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
    Storage.saveAndSync('clientes', clientes);
    
    cancelarFormCliente();
    cargarClientes();
    alert('Cliente guardado exitosamente');
});

function cargarClientes() {
    // Verificar que hay sesión activa
    const sesion = localStorage.getItem('sesionActiva');
    if (sesion !== 'true') {
        console.warn('Intento de cargar datos sin autenticación');
        return;
    }
    
    const clientes = Storage.get('clientes');
    const container = document.getElementById('listaClientes');
    if (clientes.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No hay clientes registrados</h3><p>Agrega tu primer cliente para comenzar</p></div>';
        return;
    }
    let html = '<table><thead><tr><th>#</th><th>Nombre Completo</th><th>Celular</th><th>Email</th><th>Fecha Registro</th><th>Acciones</th></tr></thead><tbody>';
    clientes.forEach(cliente => {
        html += `<tr><td>${cliente.id}</td><td>${cliente.nombre} ${cliente.apellido}</td><td>${cliente.celular}</td><td>${cliente.email || '-'}</td><td>${new Date(cliente.fechaRegistro).toLocaleDateString()}</td><td><button class="btn-success" onclick="editarCliente(${cliente.id})">Editar</button><button class="btn-secondary" onclick="verHistorialCliente(${cliente.id})">Historial</button><button class="btn-danger" onclick="eliminarCliente(${cliente.id})">Eliminar</button></td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

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

function eliminarCliente(id) {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    let clientes = Storage.get('clientes');
    clientes = clientes.filter(c => c.id !== id);
    
    // Guardar y sincronizar con Firebase
    Storage.saveAndSync('clientes', clientes);
    
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
            html += `<div class="orden-card"><div class="orden-header"><span class="orden-numero">Orden #${orden.numero}</span><span class="badge badge-${getEstadoClass(orden.estado)}">${orden.estado}</span></div><p><strong>Dispositivo:</strong> ${orden.marca} ${orden.modelo} (${orden.tipoDispositivo})</p><p><strong>Problema:</strong> ${orden.problema}</p><p><strong>Fecha:</strong> ${new Date(orden.fechaIngreso).toLocaleDateString()}</p>${orden.presupuesto ? `<p><strong>Presupuesto:</strong> $${orden.presupuesto}</p>` : ''}</div>`;
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

function guardarClienteRapido() {
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
    Storage.set('clientes', clientes);
    
    // Recargar el select de clientes
    cargarClientesSelect();
    
    // Seleccionar automáticamente el nuevo cliente
    document.getElementById('ordenCliente').value = nuevoCliente.id;
    
    // Ocultar el formulario
    cancelarClienteRapido();
}

function crearClienteFinal() {
    const clientes = Storage.get('clientes');
    const timestamp = new Date().getTime();
    
    const clienteFinal = {
        id: Storage.getNextId('clientes'),
        nombre: 'Cliente',
        apellido: 'Final',
        celular: `CF-${timestamp}`,
        email: '',
        direccion: '',
        fechaRegistro: new Date().toISOString()
    };
    
    clientes.push(clienteFinal);
    Storage.set('clientes', clientes);
    
    // Recargar el select de clientes
    cargarClientesSelect();
    
    // Seleccionar automáticamente el cliente final
    document.getElementById('ordenCliente').value = clienteFinal.id;
    
    // Ocultar el formulario rápido si estaba abierto
    cancelarClienteRapido();
    
    alert(`✅ Cliente "${nombre} ${apellido}" agregado exitosamente`);
}

function mostrarFormOrden() {
    document.getElementById('formOrden').style.display = 'block';
    document.getElementById('ordenForm').reset();
    document.getElementById('ordenId').value = '';
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('ordenFechaIngreso').value = hoy;
    document.querySelector('input[name="tipoGarantia"][value="con"]').checked = true;
    toggleGarantia();
    cargarClientesSelect();
    repuestosOrdenTemp = [];
    actualizarRepuestosSeleccionados();
    // Cargar inventario con un pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
        cargarInventarioSelect();
    }, 100);
    // Agregar formateo automático a campos de dinero
    agregarFormateoMoneda();
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
    // Verificar que hay sesión activa
    const sesion = localStorage.getItem('sesionActiva');
    if (sesion !== 'true') {
        return;
    }
    
    const clientes = Storage.get('clientes');
    const select = document.getElementById('ordenCliente');
    select.innerHTML = '<option value="">Seleccionar cliente...</option>';
    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = `${cliente.nombre} ${cliente.apellido} - ${cliente.celular}`;
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
    const orden = {
        id: id ? parseInt(id) : Storage.getNextId('ordenes'),
        numero: id ? ordenes.find(o => o.id === parseInt(id)).numero : generarNumeroOrden(),
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
        anticipo: limpiarNumero(document.getElementById('ordenAnticipo').value),
        tieneGarantia: tieneGarantia,
        garantia: tieneGarantia ? parseInt(document.getElementById('ordenGarantia').value) || 30 : 0,
        fechaIngreso: document.getElementById('ordenFechaIngreso').value,
        fechaEstimada: document.getElementById('ordenFechaEstimada').value,
        tecnico: document.getElementById('ordenTecnico').value,
        notas: document.getElementById('ordenNotas').value,
        repuestos: [...repuestosOrdenTemp],
        fechaCreacion: id ? ordenes.find(o => o.id === parseInt(id)).fechaCreacion : new Date().toISOString(),
        fechaEntrega: null
    };
    
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
            Storage.set('repuestos', inventario);
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
        Storage.saveAndSync('repuestos', inventario);
    }
    
    Storage.saveAndSync('ordenes', ordenes);
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

function cargarOrdenes() {
    // Verificar que hay sesión activa
    const sesion = localStorage.getItem('sesionActiva');
    if (sesion !== 'true') {
        console.warn('Intento de cargar órdenes sin autenticación');
        return;
    }
    
    cargarClientesSelect();
    filtrarOrdenes();
}

function filtrarOrdenes() {
    // Verificar que hay sesión activa
    const sesion = localStorage.getItem('sesionActiva');
    if (sesion !== 'true') {
        return;
    }
    
    let ordenes = Storage.get('ordenes');
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
        const clienteNombre = cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente no encontrado';
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
        
        html += `<div class="orden-card"><div class="orden-header"><span class="orden-numero">Orden #${orden.numero}</span><span class="badge badge-${getEstadoClass(orden.estado)}">${orden.estado}</span></div><div class="orden-info"><div class="info-item"><span class="info-label">Cliente:</span> ${clienteNombre}</div><div class="info-item"><span class="info-label">Dispositivo:</span> ${orden.marca} ${orden.modelo}</div><div class="info-item"><span class="info-label">Tipo:</span> ${orden.tipoDispositivo}</div><div class="info-item"><span class="info-label">Fecha Ingreso:</span> ${new Date(orden.fechaIngreso).toLocaleDateString()}</div>${orden.presupuesto ? `<div class="info-item"><span class="info-label">Presupuesto:</span> $${orden.presupuesto.toFixed(2)}</div><div class="info-item"><span class="info-label">Anticipo:</span> $${orden.anticipo.toFixed(2)}</div><div class="info-item"><span class="info-label">Saldo:</span> <strong>$${saldo.toFixed(2)}</strong></div>` : ''}${orden.tecnico ? `<div class="info-item"><span class="info-label">Técnico:</span> ${orden.tecnico}</div>` : ''}</div><p><strong>Problema:</strong> ${orden.problema}</p>${orden.notas ? `<p><strong>Notas:</strong> ${orden.notas}</p>` : ''}${repuestosHtml}${garantiaHtml}<div style="margin-top: 15px;"><button class="btn-success" onclick="editarOrden(${orden.id})">Editar</button><button class="btn-secondary" onclick="cambiarEstadoOrden(${orden.id})">Cambiar Estado</button><button class="btn-primary" onclick="imprimirRecibo(${orden.id})">📄 Imprimir</button><button class="btn-primary" onclick="enviarWhatsApp(${orden.id})" style="background: #25d366;">📱 WhatsApp</button>${saldo > 0 ? `<button class="btn-primary" onclick="registrarPago(${orden.id})">💰 Pagar</button>` : ''}<button class="btn-danger" onclick="eliminarOrden(${orden.id})">Eliminar</button></div></div>`;
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
    document.getElementById('ordenCliente').value = orden.clienteId;
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
    
    document.getElementById('formOrden').style.display = 'block';
}

function cambiarEstadoOrden(id) {
    const ordenes = Storage.get('ordenes');
    const orden = ordenes.find(o => o.id === id);
    const nuevoEstado = prompt(`Estado actual: ${orden.estado}\n\nIngresa el nuevo estado:\n1. Recibido\n2. En Diagnóstico\n3. Esperando Repuestos\n4. En Reparación\n5. Listo para Entrega\n6. Entregado\n7. Cancelado`);
    const estados = ['Recibido', 'En Diagnóstico', 'Esperando Repuestos', 'En Reparación', 'Listo para Entrega', 'Entregado', 'Cancelado'];
    const index = parseInt(nuevoEstado) - 1;
    if (index >= 0 && index < estados.length) {
        orden.estado = estados[index];
        if (estados[index] === 'Entregado') {
            orden.fechaEntrega = new Date().toISOString();
        }
        Storage.set('ordenes', ordenes);
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
    const hoy = new Date().toISOString().split('T')[0];
    const ordenesPendientes = [];
    ordenes.forEach(orden => {
        const presupuesto = orden.presupuesto || 0;
        const anticipo = orden.anticipo || 0;
        const saldo = presupuesto - anticipo;
        totalCobrado += anticipo;
        if (orden.estado !== 'Cancelado') {
            if (saldo > 0) {
                porCobrar += saldo;
                ordenesPendientes.push({ orden, saldo, cliente: clientes.find(c => c.id === orden.clienteId) });
            } else if (presupuesto > 0) {
                totalCobrado += presupuesto;
            }
        }
        if (orden.fechaCreacion && orden.fechaCreacion.split('T')[0] === hoy && anticipo > 0) {
            cobradoHoy += anticipo;
        }
    });
    document.getElementById('totalCobrado').textContent = `$${totalCobrado.toFixed(2)}`;
    document.getElementById('porCobrar').textContent = `$${porCobrar.toFixed(2)}`;
    document.getElementById('cobradoHoy').textContent = `$${cobradoHoy.toFixed(2)}`;
    const container = document.getElementById('listaPagos');
    if (ordenesPendientes.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>¡Todo pagado! 🎉</h3><p>No hay cuentas por cobrar pendientes</p></div>';
        return;
    }
    let html = '<h3 style="margin: 20px 0;">Cuentas por Cobrar</h3>';
    ordenesPendientes.forEach(({ orden, saldo, cliente }) => {
        const clienteNombre = cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente no encontrado';
        html += `<div class="orden-card"><div class="orden-header"><span class="orden-numero">Orden #${orden.numero}</span><span class="badge badge-${getEstadoClass(orden.estado)}">${orden.estado}</span></div><div class="orden-info"><div class="info-item"><span class="info-label">Cliente:</span> ${clienteNombre}</div><div class="info-item"><span class="info-label">Dispositivo:</span> ${orden.marca} ${orden.modelo}</div><div class="info-item"><span class="info-label">Total:</span> $${orden.presupuesto.toFixed(2)}</div><div class="info-item"><span class="info-label">Anticipo:</span> $${orden.anticipo.toFixed(2)}</div><div class="info-item"><span class="info-label">Saldo:</span> <strong style="color: #f5576c;">$${saldo.toFixed(2)}</strong></div></div><button class="btn-primary" onclick="registrarPago(${orden.id})">💰 Registrar Pago</button></div>`;
    });
    container.innerHTML = html;
}

function registrarPago(ordenId) {
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
        orden.anticipo = (orden.anticipo || 0) + pago;
        Storage.set('ordenes', ordenes);
        alert(`Pago registrado exitosamente!\nNuevo saldo: $${(saldo - pago).toFixed(2)}`);
        if (confirm('¿Deseas imprimir el recibo de pago?')) {
            imprimirReciboPago(ordenId, pago);
        }
        cargarPagos();
        if (document.getElementById('ordenes').classList.contains('active')) {
            cargarOrdenes();
        }
    }
}

function imprimirReciboPago(ordenId, montoPago) {
    const ordenes = Storage.get('ordenes');
    const clientes = Storage.get('clientes');
    const orden = ordenes.find(o => o.id === ordenId);
    const cliente = clientes.find(c => c.id === orden.clienteId);
    const saldo = (orden.presupuesto || 0) - (orden.anticipo || 0);
    const recibo = `<div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 2px solid #333;"><div style="text-align: center; margin-bottom: 20px;"><h2 style="margin: 0;">🔧 TALLER DE REPARACIONES</h2><p style="margin: 5px 0;">RECIBO DE PAGO</p></div><hr style="border: 1px solid #333;"><div style="margin: 15px 0;"><p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p><p><strong>Orden:</strong> #${orden.numero}</p><p><strong>Cliente:</strong> ${cliente.nombre} ${cliente.apellido}</p><p><strong>Celular:</strong> ${cliente.celular}</p></div><hr style="border: 1px dashed #666;"><div style="margin: 15px 0;"><p><strong>Dispositivo:</strong> ${orden.marca} ${orden.modelo}</p><p><strong>Total de la reparación:</strong> $${orden.presupuesto.toFixed(2)}</p><p><strong>Pagos anteriores:</strong> $${(orden.anticipo - montoPago).toFixed(2)}</p><p><strong>Pago actual:</strong> <span style="font-size: 1.2em; color: green;">$${montoPago.toFixed(2)}</span></p><p><strong>Saldo pendiente:</strong> <span style="font-size: 1.2em;">$${saldo.toFixed(2)}</span></p></div><hr style="border: 1px solid #333;"><div style="margin-top: 30px; text-align: center;"><p style="margin: 30px 0 5px;">_____________________</p><p style="margin: 0;">Firma del Cliente</p></div><div style="margin-top: 20px; text-align: center; font-size: 0.9em;"><p>¡Gracias por su confianza!</p></div></div>`;
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
}

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
        fechaRegistro: id ? repuestos.find(r => r.id === parseInt(id)).fechaRegistro : new Date().toISOString()
    };
    if (id) {
        const index = repuestos.findIndex(r => r.id === parseInt(id));
        repuestos[index] = repuesto;
    } else {
        repuestos.push(repuesto);
    }
    Storage.saveAndSync('repuestos', repuestos);
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
            
            return nombre.includes(busqueda) ||
                   codigo.includes(busqueda) ||
                   compatibilidad.includes(busqueda) ||
                   categoria.includes(busqueda) ||
                   ubicacion.includes(busqueda);
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
    let html = '<table><thead><tr><th>Nombre</th><th>Categoría</th><th>Código/SKU</th><th>Stock</th><th>Precio Compra</th><th>Precio Venta</th><th>Ubicación</th><th>Acciones</th></tr></thead><tbody>';
    repuestos.forEach(repuesto => {
        const alertaStock = repuesto.stock <= repuesto.stockMinimo ? 'style="background: #ffebee;"' : '';
        const estadoStock = repuesto.stock === 0 ? '❌ Agotado' : repuesto.stock <= repuesto.stockMinimo ? '⚠️ Stock bajo' : '✅';
        html += `<tr ${alertaStock}><td>${repuesto.nombre}${repuesto.compatibilidad ? `<br><small>${repuesto.compatibilidad}</small>` : ''}</td><td>${repuesto.categoria}</td><td>${repuesto.codigo || '-'}</td><td><strong>${repuesto.stock}</strong> ${estadoStock}</td><td>$${repuesto.precioCompra.toFixed(2)}</td><td>$${repuesto.precioVenta.toFixed(2)}</td><td>${repuesto.ubicacion || '-'}</td><td><button class="btn-success" onclick="editarRepuesto(${repuesto.id})">Editar</button><button class="btn-secondary" onclick="ajustarStock(${repuesto.id})">Stock</button><button class="btn-danger" onclick="eliminarRepuesto(${repuesto.id})">Eliminar</button></td></tr>`;
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
    document.getElementById('formRepuesto').style.display = 'block';
}

function ajustarStock(id) {
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
    Storage.set('repuestos', repuestos);
    filtrarInventario();
}

function eliminarRepuesto(id) {
    if (!confirm('¿Estás seguro de eliminar este repuesto?')) return;
    let repuestos = Storage.get('repuestos');
    repuestos = repuestos.filter(r => r.id !== id);
    Storage.saveAndSync('repuestos', repuestos);
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
            
            fechaInicio = new Date(fechaInicioInput);
            fechaInicio.setHours(0, 0, 0, 0);
            fechaFin = new Date(fechaFinInput);
            fechaFin.setHours(23, 59, 59, 999);
            break;
        default:
            fechaInicio = new Date(0);
    }
    
    const ordenesFiltradas = ordenes.filter(o => {
        const fecha = new Date(o.fechaCreacion);
        return fecha >= fechaInicio && fecha <= fechaFin && o.estado === 'Entregado';
    });
    let ingresosTotales = 0;
    ordenesFiltradas.forEach(orden => {
        ingresosTotales += orden.presupuesto || 0;
    });
    const promedioPorOrden = ordenesFiltradas.length > 0 ? ingresosTotales / ordenesFiltradas.length : 0;
    
    // Calcular ganancia neta para las tarjetas superiores
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
        
        gananciaNetaTotal += (presupuesto - costoPiezas - costoRepuestosOrden);
    });
    
    document.getElementById('reporteIngresos').textContent = `$${ingresosTotales.toFixed(2)}`;
    document.getElementById('reporteCompletadas').textContent = ordenesFiltradas.length;
    document.getElementById('reportePromedio').textContent = `$${promedioPorOrden.toFixed(2)}`;
    document.getElementById('reporteGananciaNeta').textContent = `$${gananciaNetaTotal.toFixed(2)}`;
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
        
        // Ganancia Real = Presupuesto - (Costo Piezas + Costo Repuestos)
        const gananciaOrden = presupuesto - costoPiezas - costoRepuestosOrden;
        
        gananciaReal += gananciaOrden;
        costosTotalesPiezas += costoPiezas;
        costosTotalesRepuestos += costoRepuestosOrden;
        anticiposTotales += orden.anticipo || 0;
    });
    
    const porcentajeGanancia = ingresosTotales > 0 ? (gananciaReal / ingresosTotales * 100) : 0;
    const porcentajeCostosPiezas = ingresosTotales > 0 ? (costosTotalesPiezas / ingresosTotales * 100) : 0;
    const porcentajeCostosRepuestos = ingresosTotales > 0 ? (costosTotalesRepuestos / ingresosTotales * 100) : 0;
    
    let htmlGanancias = '<table><thead><tr><th>Concepto</th><th>Monto</th><th>Porcentaje</th></tr></thead><tbody>';
    htmlGanancias += `<tr style="background: #c8e6c9; font-weight: bold;"><td><strong>💰 TOTAL COBRADO</strong></td><td><strong>$${ingresosTotales.toFixed(2)}</strong></td><td>100%</td></tr>`;
    htmlGanancias += `<tr style="background: #ffebee;"><td><strong>🔧 Costos Piezas Externas</strong></td><td><strong>-$${costosTotalesPiezas.toFixed(2)}</strong></td><td>-${porcentajeCostosPiezas.toFixed(1)}%</td></tr>`;
    htmlGanancias += `<tr style="background: #fce4ec;"><td><strong>📦 Costos Repuestos</strong></td><td><strong>-$${costosTotalesRepuestos.toFixed(2)}</strong></td><td>-${porcentajeCostosRepuestos.toFixed(1)}%</td></tr>`;
    htmlGanancias += `<tr style="background: #e8f5e9; font-weight: bold; font-size: 1.1em;"><td><strong>✅ GANANCIA NETA</strong></td><td><strong>$${gananciaReal.toFixed(2)}</strong></td><td>${porcentajeGanancia.toFixed(1)}%</td></tr>`;
    htmlGanancias += `<tr style="background: #fff9c4;"><td><strong>💵 Anticipos Recibidos</strong></td><td><strong>$${anticiposTotales.toFixed(2)}</strong></td><td>${ingresosTotales > 0 ? (anticiposTotales / ingresosTotales * 100).toFixed(1) : 0}%</td></tr>`;
    htmlGanancias += '</tbody></table>';
    document.getElementById('desgloseganancias').innerHTML = htmlGanancias;
    
    // Resumen de Ingresos sin inversiones
    const saldosPendientes = ingresosTotales - anticiposTotales;
    const porcentajeSaldo = ingresosTotales > 0 ? (saldosPendientes / ingresosTotales * 100) : 0;
    const porcentajeAnticipos = ingresosTotales > 0 ? (anticiposTotales / ingresosTotales * 100) : 0;
    
    let htmlIngresos = '<table><thead><tr><th>Concepto</th><th>Monto</th><th>Porcentaje</th></tr></thead><tbody>';
    htmlIngresos += `<tr style="background: #e3f2fd;"><td><strong>💰 Total Cobrado</strong></td><td><strong>$${ingresosTotales.toFixed(2)}</strong></td><td>100%</td></tr>`;
    htmlIngresos += `<tr style="background: #c8e6c9;"><td><strong>✅ Anticipos Recibidos</strong></td><td><strong>$${anticiposTotales.toFixed(2)}</strong></td><td>${porcentajeAnticipos.toFixed(1)}%</td></tr>`;
    htmlIngresos += `<tr style="background: #fff9c4;"><td><strong>⏳ Saldo Pendiente</strong></td><td><strong>$${saldosPendientes.toFixed(2)}</strong></td><td>${porcentajeSaldo.toFixed(1)}%</td></tr>`;
    htmlIngresos += `<tr style="background: #f3e5f5;"><td><strong>📊 Promedio por Orden</strong></td><td><strong>$${promedioPorOrden.toFixed(2)}</strong></td><td>-</td></tr>`;
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
    return new Promise((resolve) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const saldo = (orden.presupuesto || 0) - (orden.anticipo || 0);
        const garantiaTexto = orden.tieneGarantia !== false ? `${orden.garantia} días` : 'Sin garantía';
        
        // Configuración de fuente y estilos
        let y = 15;
    
    // Encabezado
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TALLER DE REPARACIONES', 105, y, { align: 'center' });
    y += 7;
    doc.setFontSize(12);
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
    doc.text(`Fecha: ${new Date(orden.fechaIngreso).toLocaleDateString()}`, 120, y);
    y += 6;
    if (orden.fechaEstimada) {
        doc.text(`Entrega estimada: ${new Date(orden.fechaEstimada).toLocaleDateString()}`, 15, y);
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
    
    // POLÍTICAS DEL TALLER
    doc.setFillColor(255, 243, 205);
    doc.rect(15, y, 180, 20, 'F');
    doc.setLineWidth(0.3);
    doc.setDrawColor(255, 193, 7);
    doc.rect(15, y, 180, 20);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('POLÍTICAS DEL TALLER', 105, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const politicasText = 'Luego de su equipo ser arreglado tiene un plazo de 15 días para retirarlo. Si pasa de un mes pasa al taller de repuesto si no está pago.';
    const politicasLines = doc.splitTextToSize(politicasText, 170);
    doc.text(politicasLines, 105, y, { align: 'center' });
    y += 15;
    
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

function imprimirRecibo(ordenId) {
    const ordenes = Storage.get('ordenes');
    const clientes = Storage.get('clientes');
    const orden = ordenes.find(o => o.id === ordenId);
    const cliente = clientes.find(c => c.id === orden.clienteId);
    const recibo = `<div style="font-family: Arial, sans-serif; max-width: 300px; font-size: 11px; margin: 0 auto; padding: 20px; border: 2px solid #333;"><div style="text-align: center; margin-bottom: 20px;"><h2 style="margin: 0;">�� TALLER DE REPARACIONES</h2><p style="margin: 5px 0;">ORDEN DE SERVICIO</p></div><hr style="border: 1px solid #333;"><div style="margin: 6px 0;"><p style="margin: 2px 0;"><strong>Orden:</strong> #${orden.numero}</p><p><strong>Fecha:</strong> ${new Date(orden.fechaIngreso).toLocaleDateString()}</p>${orden.fechaEstimada ? `<p><strong>Entrega estimada:</strong> ${new Date(orden.fechaEstimada).toLocaleDateString()}</p>` : ''}</div><hr style="border: 1px dashed #666;"><div style="margin: 15px 0;"><h3 style="margin: 4px 0; font-size: 12px;">DATOS DEL CLIENTE</h3><p><strong>Nombre:</strong> ${cliente.nombre} ${cliente.apellido}</p><p><strong>Celular:</strong> ${cliente.celular}</p>${cliente.email ? `<p><strong>Email:</strong> ${cliente.email}</p>` : ''}</div><hr style="border: 1px dashed #666;"><div style="margin: 15px 0;"><h3 style="margin: 10px 0;">DATOS DEL EQUIPO</h3><p><strong>Tipo:</strong> ${orden.tipoDispositivo}</p><p><strong>Marca:</strong> ${orden.marca}</p><p><strong>Modelo:</strong> ${orden.modelo}</p>${orden.imei ? `<p><strong>IMEI/Serie:</strong> ${orden.imei}</p>` : ''}${orden.accesorios ? `<p><strong>Accesorios:</strong> ${orden.accesorios}</p>` : ''}</div><hr style="border: 1px dashed #666;"><div style="margin: 15px 0;"><h3 style="margin: 10px 0;">PROBLEMA REPORTADO</h3><p>${orden.problema}</p></div>${orden.notas ? `<hr style="border: 1px dashed #666;"><div style="margin: 15px 0;"><h3 style="margin: 10px 0;">NOTAS</h3><p>${orden.notas}</p></div>` : ''}<hr style="border: 1px solid #333;"><div style="margin: 15px 0;">${orden.presupuesto ? `<p><strong>Presupuesto:</strong> <span style="font-size: 1.3em;">$${orden.presupuesto.toFixed(2)}</span></p><p><strong>Anticipo:</strong> $${(orden.anticipo || 0).toFixed(2)}</p><p><strong>Saldo:</strong> $${((orden.presupuesto || 0) - (orden.anticipo || 0)).toFixed(2)}</p>` : '<p><em>Presupuesto pendiente</em></p>'}${orden.tieneGarantia !== false ? `<p><strong>Garantía:</strong> ${orden.garantia} días</p>` : '<p><strong>Garantía:</strong> ❌ Sin garantía</p>'}</div><hr style="border: 1px solid #333;"><div style="margin: 8px 0; padding: 6px; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 3px;"><p style="margin: 0; font-size: 9px; text-align: center; font-weight: bold; color: #856404;">⚠️ POLÍTICAS DEL TALLER</p><p style="margin: 10px 0 0; font-size: 0.8em; text-align: justify; line-height: 1.4;">Luego de su equipo ser arreglado tiene un plazo de 15 días para retirarlo. Si pasa de un mes pasa al taller de repuesto si no está pago.</p></div><div style="margin-top: 12px;"><p style="margin: 15px 0 3px;">_____________________</p><p style="margin: 0; font-size: 10px;">Firma del Cliente</p></div><div style="margin-top: 20px; text-align: center; font-size: 0.9em;"><p><strong>Estado:</strong> ${orden.estado}</p><p>¡Gracias por su confianza!</p></div></div>`;
    const ventana = window.open('', '', 'width=800,height=600');
    ventana.document.write('<html><head><title>Orden de Servicio</title></head><body>');
    ventana.document.write(recibo);
    ventana.document.write('</body></html>');
    ventana.document.close();
    ventana.print();
}

// DASHBOARD
function actualizarDashboard() {
    const clientes = Storage.get('clientes');
    const ordenes = Storage.get('ordenes');
    document.getElementById('totalClientes').textContent = clientes.length;
    const ordenesActivas = ordenes.filter(o => o.estado !== 'Entregado' && o.estado !== 'Cancelado');
    document.getElementById('ordenesActivas').textContent = ordenesActivas.length;
    const enReparacion = ordenes.filter(o => o.estado === 'En Reparación').length;
    document.getElementById('enReparacion').textContent = enReparacion;
    const listas = ordenes.filter(o => o.estado === 'Listo para Entrega').length;
    document.getElementById('listasEntrega').textContent = listas;
    const ordenesRecientes = ordenes.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion)).slice(0, 5);
    const container = document.getElementById('ordenesRecientes');
    if (ordenesRecientes.length === 0) {
        container.innerHTML = '<p>No hay órdenes registradas</p>';
        return;
    }
    let html = '';
    ordenesRecientes.forEach(orden => {
        const cliente = clientes.find(c => c.id === orden.clienteId);
        const clienteNombre = cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente no encontrado';
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
        resultados.ordenes.forEach(orden => {
            const cliente = clientes.find(c => c.id === orden.clienteId);
            const clienteNombre = cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente no encontrado';
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
window.crearClienteFinal = crearClienteFinal;
window.agregarRepuestoOrden = agregarRepuestoOrden;
window.mostrarFormRepuesto = mostrarFormRepuesto;
window.cancelarFormRepuesto = cancelarFormRepuesto;
window.filtrarInventario = filtrarInventario;
window.exportarDatos = exportarDatos;
window.imprimirReporte = imprimirReporte;
window.buscar = buscar;
