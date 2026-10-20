import { getAdminServices, jsonResponse } from './_shared/firebase-admin.mjs';

export default async function handler(request) {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

    try {
        const authorization = request.headers.get('authorization') || '';
        const match = authorization.match(/^Bearer (.+)$/i);
        if (!match) return jsonResponse({ error: 'No autorizado' }, 401);

        const { auth, db, fieldValue } = getAdminServices();
        const decodedToken = await auth.verifyIdToken(match[1]);
        const username = decodedToken.username;
        if (typeof username !== 'string' || !username) {
            return jsonResponse({ error: 'No autorizado' }, 401);
        }

        const users = await db.collection('usuarios')
            .where('usuario', '==', username)
            .limit(2)
            .get();
        if (users.size !== 1) return jsonResponse({ error: 'Cuenta no encontrada' }, 403);

        const userDoc = users.docs[0];
        const userData = userDoc.data();
        if (userData.authUid && userData.authUid !== decodedToken.uid) {
            return jsonResponse({ error: 'No autorizado' }, 403);
        }

        const batch = db.batch();
        batch.update(userDoc.ref, {
            authUid: decodedToken.uid,
            password: fieldValue.delete(),
            migradoAuth: true
        });
        batch.set(db.collection('usuarios-data').doc(username), {
            authUid: decodedToken.uid,
            usuario: username,
            nombreTaller: userData.nombreTaller || decodedToken.nombreTaller || 'Taller de Reparaciones',
            ultimaActualizacion: new Date().toISOString()
        }, { merge: true });
        await batch.commit();

        return jsonResponse({
            nombreTaller: userData.nombreTaller || decodedToken.nombreTaller || 'Taller de Reparaciones'
        });
    } catch (error) {
        console.error('Account verification failed:', error.code || 'unknown');
        return jsonResponse({ error: 'No se pudo verificar la cuenta.' }, 500);
    }
}

export const config = { path: '/api/ensure-account' };
