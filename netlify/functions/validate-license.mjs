import { enforceIpRateLimit, findLicense, getAdminServices, isPost, jsonResponse, licenseIsUsable, readJson, safeLicense } from './_shared/firebase-admin.mjs';

export default async function handler(request, context) {
    if (!isPost(request)) return jsonResponse({ error: 'Method not allowed' }, 405);

    try {
        const { licenseKey } = await readJson(request);
        if (typeof licenseKey !== 'string' || !/^TT-[A-Z0-9]{3}-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/.test(licenseKey.trim().toUpperCase())) {
            return jsonResponse({ error: 'Clave de licencia inválida' }, 400);
        }

        const { db } = getAdminServices();
        if (!(await enforceIpRateLimit(db, context.ip, 'validate-license', 30))) {
            return jsonResponse({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }, 429);
        }
        const licenseDoc = await findLicense(db, licenseKey.trim().toUpperCase());
        if (!licenseDoc || !licenseIsUsable(licenseDoc.data())) {
            return jsonResponse({ error: 'La licencia no existe, está suspendida o ha expirado' }, 404);
        }

        return jsonResponse({ license: safeLicense(licenseDoc.data()) });
    } catch (error) {
        console.error('License validation failed:', error.code || 'unknown');
        return jsonResponse({ error: 'No se pudo validar la licencia. Intenta más tarde.' }, 500);
    }
}

export const config = { path: '/api/validate-license' };
