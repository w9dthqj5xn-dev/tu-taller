import { readFile } from 'node:fs/promises';
import { getAdminServices, authEmailForUsername, normalizeUsername, validPassword } from '../netlify/functions/_shared/firebase-admin.mjs';

const username = normalizeUsername(process.argv[2]);
const serviceAccountPath = process.argv[3];

function readHiddenPassword(prompt) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        throw new Error('Run this command in an interactive terminal so the password can be entered privately.');
    }

    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    return new Promise((resolve, reject) => {
        let password = '';
        const onData = character => {
            if (character === '\u0003') {
                process.stdin.off('data', onData);
                process.stdin.setRawMode(false);
                process.stdout.write('\n');
                reject(new Error('Cancelled.'));
            } else if (character === '\r' || character === '\n') {
                process.stdin.off('data', onData);
                process.stdin.setRawMode(false);
                process.stdout.write('\n');
                resolve(password);
            } else if (character === '\u007f' || character === '\b') {
                password = password.slice(0, -1);
            } else {
                password += character;
            }
        };
        process.stdin.on('data', onData);
    });
}

let authUser;
try {
    if (!username || !serviceAccountPath) {
        throw new Error('Usage: node admin-tools/create-license-admin.mjs <username> <service-account-json-path>');
    }

    const password = await readHiddenPassword('Create a new password for the license administrator: ');
    if (!validPassword(password)) {
        throw new Error('Password must contain between 6 and 128 characters.');
    }

    process.env.FIREBASE_SERVICE_ACCOUNT = await readFile(serviceAccountPath, 'utf8');
    const { auth, db } = getAdminServices();
    const email = authEmailForUsername(username);
    const [existingUsers, existingAccount, existingAuthUser] = await Promise.all([
        db.collection('usuarios').where('usuario', '==', username).limit(1).get(),
        db.collection('usuarios-data').doc(username).get(),
        auth.getUserByEmail(email).catch(error => {
            if (error.code === 'auth/user-not-found') return null;
            throw error;
        })
    ]);

    if (!existingUsers.empty || existingAccount.exists || existingAuthUser) {
        throw new Error('This username already exists. Use admin-tools/set-admin.mjs to promote an existing migrated account.');
    }

    authUser = await auth.createUser({
        email,
        password,
        displayName: 'Administración de licencias'
    });
    await auth.setCustomUserClaims(authUser.uid, {
        username,
        nombreTaller: 'Administración de licencias',
        admin: true
    });

    const now = new Date().toISOString();
    await db.runTransaction(async transaction => {
        const userRef = db.collection('usuarios').doc(authUser.uid);
        const accountRef = db.collection('usuarios-data').doc(username);
        const [userSnapshot, accountSnapshot] = await Promise.all([
            transaction.get(userRef),
            transaction.get(accountRef)
        ]);
        if (userSnapshot.exists || accountSnapshot.exists) {
            throw new Error('This username was created concurrently. No account data was overwritten.');
        }
        transaction.create(userRef, {
            id: authUser.uid,
            authUid: authUser.uid,
            usuario: username,
            nombreTaller: 'Administración de licencias',
            fechaRegistro: now,
            fechaCreacion: now,
            estado: 'activo',
            administrador: true
        });
        transaction.create(accountRef, {
            authUid: authUser.uid,
            usuario: username,
            nombreTaller: 'Administración de licencias',
            ultimaActualizacion: now,
            version: '2.0',
            fechaCreacion: now
        });
    });

    console.log(`License administrator "${username}" created. Sign in at /licencias.html.`);
} catch (error) {
    if (authUser) {
        try {
            const { auth, db } = getAdminServices();
            const accountRef = db.collection('usuarios-data').doc(username);
            const userRef = db.collection('usuarios').doc(authUser.uid);
            const [accountSnapshot, userSnapshot] = await Promise.all([accountRef.get(), userRef.get()]);
            if (accountSnapshot.exists && accountSnapshot.data().authUid === authUser.uid) {
                await accountRef.delete();
            }
            if (userSnapshot.exists && userSnapshot.data().authUid === authUser.uid) {
                await userRef.delete();
            }
            await auth.deleteUser(authUser.uid);
        } catch (cleanupError) {
            console.error('Could not roll back administrator creation:', cleanupError.code || cleanupError.message);
        }
    }
    console.error('Could not create license administrator:', error.code || error.message);
    process.exitCode = 1;
}
