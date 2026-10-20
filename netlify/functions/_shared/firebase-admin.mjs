import { createHash } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

let adminApp;

export function getAdminServices() {
    if (!adminApp) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!serviceAccountJson) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT is not configured');
        }

        const serviceAccount = JSON.parse(serviceAccountJson);
        adminApp = getApps()[0] || initializeApp({
            credential: cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
        });
    }

    return {
        auth: getAuth(adminApp),
        db: getFirestore(adminApp),
        fieldValue: FieldValue
    };
}

export function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store'
        }
    });
}

export async function readJson(request) {
    try {
        return await request.json();
    } catch {
        throw new Error('Invalid JSON request');
    }
}

export function authEmailForUsername(username) {
    const usernameHash = createHash('sha256')
        .update(username.trim())
        .digest('hex');
    return `u.${usernameHash}@auth.tu-taller.invalid`;
}

export function normalizeUsername(value) {
    if (typeof value !== 'string') return null;
    const username = value.trim();
    if (username.length < 4 || username.length > 64 || /[\/\u0000-\u001f\u007f]/.test(username)) return null;
    return username;
}

export function validPassword(value) {
    return typeof value === 'string' && value.length >= 6 && value.length <= 128;
}

export function safeLicense(license) {
    return {
        licenseKey: license.licenseKey,
        clientName: license.clientName || 'Cliente',
        licenseType: license.licenseType || 'mensual',
        maxDevices: Number(license.maxDevices) || 1,
        fechaCreacion: license.fechaCreacion || null,
        fechaExpiracion: license.fechaExpiracion || null,
        suspendida: license.suspendida === true,
        activa: license.activa !== false
    };
}

export async function enforceIpRateLimit(db, ip, scope, maximum) {
    if (!ip) throw new Error('Client IP is unavailable');
    const key = createHash('sha256')
        .update(`${scope}:${ip}`)
        .digest('hex');
    const ref = db.collection('_authRateLimits').doc(key);
    const now = Date.now();
    const resetAt = now + 15 * 60 * 1000;

    return db.runTransaction(async transaction => {
        const snapshot = await transaction.get(ref);
        const data = snapshot.exists ? snapshot.data() : {};
        const currentReset = Number(data.resetAt) || 0;
        if (currentReset > now && (Number(data.attempts) || 0) >= maximum) {
            return false;
        }

        transaction.set(ref, {
            attempts: currentReset > now ? (Number(data.attempts) || 0) + 1 : 1,
            resetAt: currentReset > now ? currentReset : resetAt
        });
        return true;
    });
}

export async function findLicense(db, licenseKey) {
    const snapshot = await db.collection('licencias')
        .where('licenseKey', '==', licenseKey)
        .limit(2)
        .get();
    if (snapshot.size !== 1) return null;
    return snapshot.docs[0];
}

export function licenseIsUsable(license) {
    if (!license || license.suspendida === true || license.activa === false) return false;
    if (!license.fechaExpiracion) return true;
    const expiry = new Date(license.fechaExpiracion);
    return !Number.isNaN(expiry.getTime()) && expiry >= new Date();
}

export async function enforceMigrationLimit(db, ip, username) {
    if (!ip) throw new Error('Client IP is unavailable');
    const key = createHash('sha256')
        .update(`${ip}:${username.trim().toLowerCase()}`)
        .digest('hex');
    const ref = db.collection('_authRateLimits').doc(key);
    const now = Date.now();
    const resetAt = now + 15 * 60 * 1000;

    return db.runTransaction(async transaction => {
        const snapshot = await transaction.get(ref);
        const data = snapshot.exists ? snapshot.data() : {};
        const currentReset = Number(data.resetAt) || 0;
        if (currentReset > now && (Number(data.attempts) || 0) >= 8) {
            return false;
        }

        transaction.set(ref, {
            attempts: currentReset > now ? (Number(data.attempts) || 0) + 1 : 1,
            resetAt: currentReset > now ? currentReset : resetAt
        });
        return true;
    });
}

export async function clearMigrationLimit(db, ip, username) {
    if (!ip) return;
    const key = createHash('sha256')
        .update(`${ip}:${username.trim().toLowerCase()}`)
        .digest('hex');
    await db.collection('_authRateLimits').doc(key).delete();
}

export function isPost(request) {
    return request.method === 'POST';
}
