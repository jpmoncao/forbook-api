import fs from "node:fs";
import path from "node:path";

import admin from "firebase-admin";

let firebaseApp: admin.app.App | null = null;

function resolveCredentialPath(): string | undefined {
    const raw = process.env.FIREBASE_CONFIG_PATH;
    if (!raw) {
        return undefined;
    }
    return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

export function getFirebaseApp(): admin.app.App {
    if (firebaseApp) {
        return firebaseApp;
    }

    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    const credPath = resolveCredentialPath();
    if (credPath) {
        const raw = fs.readFileSync(credPath, "utf8");
        const data = JSON.parse(raw) as Record<string, unknown>;
        if (data.type !== "service_account") {
            throw new Error(`Arquivo em FIREBASE_CONFIG_PATH não é uma conta de serviço (esperado type: service_account).`);
        }

        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(data as admin.ServiceAccount),
            storageBucket
        });

        return firebaseApp;
    }

    const firebaseServiceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (firebaseServiceAccountJson) {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(firebaseServiceAccountJson) as admin.ServiceAccount),
            storageBucket
        });
    }

    if (!firebaseApp) {
        throw new Error("Firebase Admin não configurado: defina FIREBASE_CONFIG_PATH ou FIREBASE_SERVICE_ACCOUNT_JSON.");
    }

    return firebaseApp;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return getFirebaseApp().auth().verifyIdToken(idToken);
}
