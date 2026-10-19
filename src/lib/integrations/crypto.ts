import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/**
 * AES-256-GCM for the values on the Integrations page.
 *
 * The key is INTEGRATIONS_MASTER_KEY from the hosting environment, hashed to
 * 32 bytes so any long random string works. GCM authenticates as well as
 * encrypts: a row edited directly in the database fails to decrypt rather
 * than turning into a different key.
 */

const MIN_MASTER_LENGTH = 32;

function masterKey(): Buffer | null {
  const raw = process.env.INTEGRATIONS_MASTER_KEY ?? '';
  if (raw.length < MIN_MASTER_LENGTH) return null;
  return createHash('sha256').update(raw).digest();
}

export function canEncrypt(): boolean {
  return masterKey() !== null;
}

export function encryptValue(plain: string): { ciphertext: string; iv: string; tag: string } {
  const key = masterKey();
  if (!key) throw new Error('integrations_master_key_missing');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return { ciphertext: ciphertext.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64') };
}

export function decryptValue(row: { ciphertext: string; iv: string; tag: string }): string | null {
  const key = masterKey();
  if (!key) return null;
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(row.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(row.tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(row.ciphertext, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
