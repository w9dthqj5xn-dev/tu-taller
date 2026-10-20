import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { getAdminServices, normalizeUsername, validPassword } from '../netlify/functions/_shared/firebase-admin.mjs';

const username = normalizeUsername(process.argv[2]);
const serviceAccountPath = process.argv[3];
const generatePassword = process.argv[4] === '--generate';

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

try {
    if (!username || !serviceAccountPath) {
        throw new Error('Usage: node admin-tools/reset-account-password.mjs <username> <service-account-json-path>');
    }

    const password = generatePassword
        ? randomBytes(24).toString('base64url')
        : await readHiddenPassword('Enter the new account password: ');
    if (!validPassword(password)) {
        throw new Error('Password must contain between 6 and 128 characters.');
    }

    process.env.FIREBASE_SERVICE_ACCOUNT = await readFile(serviceAccountPath, 'utf8');
    const { auth, db } = getAdminServices();
    const users = await db.collection('usuarios')
        .where('usuario', '==', username)
        .limit(2)
        .get();

    if (users.size !== 1) {
        throw new Error('Expected exactly one existing account. No data was changed.');
    }

    const userData = users.docs[0].data();
    if (typeof userData.authUid !== 'string' || !userData.authUid) {
        throw new Error('This account is not linked to Firebase Authentication. No data was changed.');
    }

    const accountDoc = await db.collection('usuarios-data').doc(username).get();
    if (!accountDoc.exists || accountDoc.data().authUid !== userData.authUid) {
        throw new Error('The account ownership link does not match. No data was changed.');
    }

    const authUser = await auth.getUser(userData.authUid);
    await auth.updateUser(authUser.uid, { password });
    await auth.setCustomUserClaims(authUser.uid, {
        ...authUser.customClaims,
        username,
        nombreTaller: userData.nombreTaller || 'Taller de Reparaciones'
    });

    console.log(`Password reset completed for "${username}". Firestore data was not changed.`);
    if (generatePassword) {
        console.log(`Temporary password (save it in your password manager): ${password}`);
    }
} catch (error) {
    console.error('Could not reset account password:', error.code || error.message);
    process.exitCode = 1;
}
