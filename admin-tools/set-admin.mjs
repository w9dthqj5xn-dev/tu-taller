import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const username = process.argv[2]?.trim();
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!username) {
    console.error('Usage: FIREBASE_SERVICE_ACCOUNT=<private JSON> node admin-tools/set-admin.mjs <username>');
    process.exitCode = 1;
} else if (!serviceAccountJson) {
    console.error('FIREBASE_SERVICE_ACCOUNT must be set in the local shell.');
    process.exitCode = 1;
} else {
    try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        const app = getApps()[0] || initializeApp({
            credential: cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
        });
        const auth = getAuth(app);
        const db = getFirestore(app);
        const users = await db.collection('usuarios')
            .where('usuario', '==', username)
            .limit(2)
            .get();

        if (users.size !== 1) {
            throw new Error('Expected exactly one matching account.');
        }

        const userData = users.docs[0].data();
        if (!userData.authUid) {
            throw new Error('The account must complete its first login and migration before admin access is granted.');
        }

        const user = await auth.getUser(userData.authUid);
        await auth.setCustomUserClaims(user.uid, {
            ...user.customClaims,
            username: userData.usuario,
            nombreTaller: userData.nombreTaller || 'Taller de Reparaciones',
            admin: true
        });
        console.log('Administrator claim granted. The user must sign out and sign in again.');
    } catch (error) {
        console.error('Could not grant administrator access:', error.code || error.message);
        process.exitCode = 1;
    }
}
