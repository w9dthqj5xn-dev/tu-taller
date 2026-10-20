import {
    authEmailForUsername,
    clearMigrationLimit,
    enforceIpRateLimit,
    enforceMigrationLimit,
    getAdminServices,
    isPost,
    jsonResponse,
    normalizeUsername,
    readJson,
    validPassword
} from './_shared/firebase-admin.mjs';

export default async function handler(request, context) {
    if (!isPost(request)) return jsonResponse({ error: 'Method not allowed' }, 405);

    let services;
    let username;
    try {
        const body = await readJson(request);
        username = normalizeUsername(body.username);
        const { password } = body;
        if (!username || !validPassword(password)) {
            return jsonResponse({ error: 'Usuario o contraseña incorrectos' }, 401);
        }

        services = getAdminServices();
        if (!(await enforceIpRateLimit(services.db, context.ip, 'migrate-account', 40))) {
            return jsonResponse({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }, 429);
        }
        if (!(await enforceMigrationLimit(services.db, context.ip, username))) {
            return jsonResponse({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }, 429);
        }

        const { auth, db, fieldValue } = services;
        const users = await db.collection('usuarios')
            .where('usuario', '==', username)
            .limit(2)
            .get();

        if (users.size !== 1) {
            console.warn('Legacy account migration lookup did not find one account', {
                matchingAccounts: users.size
            });
            return jsonResponse({ error: 'Usuario o contraseña incorrectos' }, 401);
        }

        const legacyUser = users.docs[0];
        const userData = legacyUser.data();
        if (typeof userData.password !== 'string' || userData.password !== password) {
            console.warn('Legacy account migration credentials did not match', {
                hasLegacyPassword: typeof userData.password === 'string',
                hasAuthUid: typeof userData.authUid === 'string' && userData.authUid.length > 0
            });
            return jsonResponse({ error: 'Usuario o contraseña incorrectos' }, 401);
        }

        const email = authEmailForUsername(username);
        let firebaseUser;
        try {
            firebaseUser = await auth.getUserByEmail(email);
            await auth.updateUser(firebaseUser.uid, { password });
        } catch (error) {
            if (error.code !== 'auth/user-not-found') throw error;
            firebaseUser = await auth.createUser({
                email,
                password,
                displayName: userData.nombreTaller || username
            });
        }

        await auth.setCustomUserClaims(firebaseUser.uid, {
            username,
            admin: false,
            nombreTaller: userData.nombreTaller || 'Taller de Reparaciones'
        });

        const batch = db.batch();
        batch.update(legacyUser.ref, {
            authUid: firebaseUser.uid,
            password: fieldValue.delete(),
            migradoAuth: true
        });
        batch.set(db.collection('usuarios-data').doc(username), {
            authUid: firebaseUser.uid,
            usuario: username,
            nombreTaller: userData.nombreTaller || 'Taller de Reparaciones',
            ultimaActualizacion: new Date().toISOString()
        }, { merge: true });
        await batch.commit();

        const customToken = await auth.createCustomToken(firebaseUser.uid, {
            username,
            nombreTaller: userData.nombreTaller || 'Taller de Reparaciones'
        });
        await clearMigrationLimit(db, context.ip, username);
        return jsonResponse({
            customToken,
            nombreTaller: userData.nombreTaller || 'Taller de Reparaciones'
        });
    } catch (error) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-password') {
            return jsonResponse({ error: 'Usuario o contraseña incorrectos' }, 401);
        }
        console.error('Account migration failed:', error.code || 'unknown');
        return jsonResponse({ error: 'No se pudo migrar la cuenta. Intenta más tarde.' }, 500);
    }
}

export const config = { path: '/api/migrate-account' };
