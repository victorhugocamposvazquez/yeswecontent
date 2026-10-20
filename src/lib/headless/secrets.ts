/** Cifra secretos de integraciones headless con src/lib/crypto.ts cuando hay clave configurada. */
import "server-only";
import { decrypt, encrypt, hasEncryptionKey, isEncrypted } from "@/lib/crypto";

export const sealSecret = (v: string) => (v && hasEncryptionKey() && !isEncrypted(v) ? encrypt(v) : v);
export const openSecret = (v: string | null | undefined) => (v && isEncrypted(v) ? decrypt(v) : (v ?? ""));
