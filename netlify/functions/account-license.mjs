import { getAdminServices, jsonResponse, safeLicense } from './_shared/firebase-admin.mjs';

export default async function handler(request) {
    if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);

    try {
        const authorization = request.headers.get('authorization') || '';
        const match = authorization.match(/^Bearer (.+)$/i);
        if (!match) return jsonResponse({ error: 'No autorizado' }, 401);

        const { auth, db } = getAdminServices();
        const decodedToken = await auth.verifyIdToken(match[1]);
        const username = decodedToken.username;
        if (typeof username !== 'string' || !username) {
            return jsonResponse({ error: 'No autorizado' }, 401);
        }

        const [associatedLicenses, userDocs] = await Promise.all([
            db.collection('licencias').where('usuarioAsociado', '==', username).limit(2).get(),
            db.collection('usuarios').where('authUid', '==', decodedToken.uid).limit(2).get()
        ]);

        let licenseDoc = associatedLicenses.size === 1 ? associatedLicenses.docs[0] : null;
        if (!licenseDoc && userDocs.size === 1) {
            const licenseKey = userDocs.docs[0].data().licenseKey;
            if (typeof licenseKey === 'string' && licenseKey) {
                const matchingLicense = await db.collection('licencias')
                    .where('licenseKey', '==', licenseKey)
                    .limit(2)
                    .get();
                if (matchingLicense.size === 1) licenseDoc = matchingLicense.docs[0];
            }
        }

        if (!licenseDoc) return jsonResponse({ license: null });
        return jsonResponse({ license: safeLicense(licenseDoc.data()) });
    } catch (error) {
        console.error('Account license lookup failed:', error.code || 'unknown');
        return jsonResponse({ error: 'No se pudo consultar la licencia.' }, 500);
    }
}

export const config = { path: '/api/account-license' };
