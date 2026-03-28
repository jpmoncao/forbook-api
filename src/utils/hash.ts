import argon2 from "argon2";

export default class Hash {
    static async hash(password: string): Promise<string> {
        return argon2.hash(password, { type: argon2.argon2id });
    }

    static async compare(password: string, hash: string): Promise<boolean> {
        try {
            return await argon2.verify(hash, password);
        } catch {
            return false;
        }
    }
}
