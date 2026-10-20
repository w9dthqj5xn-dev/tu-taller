import {
    authEmailForUsername,
    clearMigrationLimit,
    enforceIpRateLimit,
    enforceMigrationLimit,
    findLicense,
    getAdminServices,
    isPost,
    jsonResponse,
    licenseIsUsable,
    normalizeUsername,
    readJson,
    safeLicense,
    validPassword
} from './_shared/firebase-admin.mjs';

export default async function handler(request, context) {
    if (!isPost(request)) return jsonResponse({ error: 'Method not allowed' }, 405);

    let createdAuthUser;
    let username;
    let licenseRef;
    let registrationCommitted = false;
    try {
        const { db, auth } = getAdminServices();
        const body = await readJson(request);
        username = normalizeUsername(body.username);
        const nombreTaller = typeof body.nombreTaller === 'string' ? body.nombreTaller.trim().slice(0, 120) : '';
        const licenseKey = typeof body.licenseKey === 'string' ? body.licenseKey.trim().toUpperCase() : '';

        if (!username || !nombreTaller || !validPassword(body.password) || !licenseKey) {
            return jsonResponse({ error: 'Revisa los datos del formulario e inténtalo de nuevo.' }, 400);
        }

        if (!(await enforceIpRateLimit(db, context.ip, 'register-account', 10))
            || !(await enforceMigrationLimit(db, context.ip, username))) {
            return jsonResponse({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }, 429);
        }

        const [existingUsers, licenseDoc] = await Promise.all([
            db.collection('usuarios').where('usuario', '==', username).limit(1).get(),
            findLicense(db, licenseKey)
        ]);

        if (!existingUsers.empty) {
            return jsonResponse({ error: 'Este nombre de usuario ya está en uso.' }, 409);
        }
        if (!licenseDoc || !licenseIsUsable(licenseDoc.data())) {
            return jsonResponse({ error: 'La licencia no existe, está suspendida o ha expirado.' }, 400);
        }
        licenseRef = licenseDoc.ref;

        const email = authEmailForUsername(username);
        createdAuthUser = await auth.createUser({
            email,
            password: body.password,
            displayName: nombreTaller
        });
        await auth.setCustomUserClaims(createdAuthUser.uid, {
            username,
            admin: false,
            nombreTaller
        });

        let licenseData;
        await db.runTransaction(async transaction => {
            const accountRef = db.collection('usuarios-data').doc(username);
            const existingAccount = await transaction.get(accountRef);
            if (existingAccount.exists) {
                const error = new Error('Account already exists');
                error.code = 'account/already-exists';
                throw error;
            }

            const currentLicense = await transaction.get(licenseDoc.ref);
            if (!currentLicense.exists || !licenseIsUsable(currentLicense.data())) {
                const error = new Error('License is not usable');
                error.code = 'license/not-usable';
                throw error;
            }

            licenseData = currentLicense.data();
            if (licenseData.usuarioAsociado && licenseData.usuarioAsociado !== username) {
                const error = new Error('License is already associated');
                error.code = 'license/already-associated';
                throw error;
            }

            const now = new Date().toISOString();
            transaction.update(licenseDoc.ref, { usuarioAsociado: username });
            transaction.set(db.collection('usuarios').doc(createdAuthUser.uid), {
                id: createdAuthUser.uid,
                authUid: createdAuthUser.uid,
                nombreTaller,
                usuario: username,
                email: licenseData.clientEmail || '',
                licenseKey,
                fechaRegistro: now,
                fechaCreacion: now,
                estado: 'activo'
            });
            transaction.set(accountRef, {
                authUid: createdAuthUser.uid,
                usuario: username,
                nombreTaller,
                ultimaActualizacion: now,
                version: '2.0',
                fechaCreacion: now
            });
        });
        registrationCommitted = true;

        const customToken = await auth.createCustomToken(createdAuthUser.uid, {
            username,
            nombreTaller
        });
        await clearMigrationLimit(db, context.ip, username);
        return jsonResponse({
            customToken,
            nombreTaller,
            license: safeLicense(licenseData)
        }, 201);
    } catch (error) {
        if (createdAuthUser) {
            try {
                const { auth, db } = getAdminServices();
                if (registrationCommitted && licenseRef && username) {
                    await db.runTransaction(async transaction => {
                        const userRef = db.collection('usuarios').doc(createdAuthUser.uid);
                        const accountRef = db.collection('usuarios-data').doc(username);
                        const [userSnapshot, accountSnapshot, licenseSnapshot] = await Promise.all([
                            transaction.get(userRef),
                            transaction.get(accountRef),
                            transaction.get(licenseRef)
                        ]);
                        if (userSnapshot.exists && userSnapshot.data().authUid === createdAuthUser.uid) {
                            transaction.delete(userRef);
                        }
                        if (accountSnapshot.exists && accountSnapshot.data().authUid === createdAuthUser.uid) {
                            transaction.delete(accountRef);
                        }
                        if (licenseSnapshot.exists && licenseSnapshot.data().usuarioAsociado === username) {
                            transaction.update(licenseRef, { usuarioAsociado: null });
                        }
                    });
                }
                await auth.deleteUser(createdAuthUser.uid);
            } catch (cleanupError) {
                console.error('Could not roll back account creation:', cleanupError.code || 'unknown');
            }
        }
        if (error.code === 'account/already-exists') {
            return jsonResponse({ error: 'Este nombre de usuario ya está en uso.' }, 409);
        }
        if (error.code === 'auth/email-already-exists') {
            return jsonResponse({ error: 'Este nombre de usuario ya está en uso.' }, 409);
        }
        if (error.code === 'license/already-associated') {
            return jsonResponse({ error: 'Esta licencia ya está asociada a otra cuenta.' }, 409);
        }
        if (error.code === 'license/not-usable') {
            return jsonResponse({ error: 'La licencia no existe, está suspendida o ha expirado.' }, 400);
        }
        console.error('Account registration failed:', error.code || 'unknown');
        return jsonResponse({ error: 'No se pudo crear la cuenta. Intenta más tarde.' }, 500);
    }
}

export const config = { path: '/api/register-account' };
