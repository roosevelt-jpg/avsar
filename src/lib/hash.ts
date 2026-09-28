import crypto from 'node:crypto';

/**
 * Phone and passport numbers are stored as salted hashes as well as in clear,
 * so duplicate detection and the fraud dashboard can work on the hash without
 * every query pulling the raw identifier around.
 *
 * The salt must be stable, so it lives in the environment, not in code.
 */
const SALT = process.env.IDENTITY_HASH_SALT ?? 'avsar-dev-salt';

export function identityHash(value: string): string {
  return crypto
    .createHmac('sha256', SALT)
    .update(value.trim().toLowerCase())
    .digest('hex');
}
