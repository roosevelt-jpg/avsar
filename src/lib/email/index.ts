import crypto from 'node:crypto';

/**
 * Outbound email that is not authentication.
 *
 * Supabase sends the auth mail (the verification link, the sign-in code) from
 * its own templates. This is for everything else: the reminder to someone who
 * opened an account and stopped.
 *
 * Deliberately behind an interface with a no-op default, the same shape as the
 * payment providers. An unconfigured deployment logs what it would have sent
 * and sends nothing, rather than failing a cron run or, worse, half-sending a
 * batch and losing track of which half.
 */

export type Message = {
  to: string;
  subject: string;
  text: string;
  /** Appears as List-Unsubscribe, so a mail client can offer it directly. */
  unsubscribeUrl?: string;
};

export type Mailer = {
  name: string;
  send(message: Message): Promise<{ sent: boolean }>;
};

/** Logs and discards. What an unconfigured environment gets. */
const noopMailer: Mailer = {
  name: 'noop',
  async send(message) {
    console.warn('[email] no mailer configured, not sending:', message.subject, '->', message.to);
    return { sent: false };
  },
};

/**
 * Amazon SES, over the v4-signed HTTPS API rather than the SDK.
 *
 * The SDK is large, and this needs one call. Signing it by hand keeps the
 * deployment small and avoids pinning a dependency that moves faster than this
 * code will.
 */
function sesMailer(region: string, accessKey: string, secretKey: string, from: string): Mailer {
  const host = `email.${region}.amazonaws.com`;

  return {
    name: 'ses',
    async send(message) {
      const body = JSON.stringify({
        FromEmailAddress: from,
        Destination: { ToAddresses: [message.to] },
        Content: {
          Simple: {
            Subject: { Data: message.subject, Charset: 'UTF-8' },
            Body: { Text: { Data: message.text, Charset: 'UTF-8' } },
          },
        },
        ...(message.unsubscribeUrl
          ? {
              /* Both headers, because a client that honours only the one-click
                 form will otherwise show nothing. */
              Headers: [
                { Name: 'List-Unsubscribe', Value: `<${message.unsubscribeUrl}>` },
                { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' },
              ],
            }
          : {}),
      });

      const path = '/v2/email/outbound-emails';
      const now = new Date();
      const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
      const dateStamp = amzDate.slice(0, 8);

      const payloadHash = crypto.createHash('sha256').update(body).digest('hex');
      const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
      const signedHeaders = 'content-type;host;x-amz-date';
      const canonicalRequest = [
        'POST',
        path,
        '',
        canonicalHeaders,
        signedHeaders,
        payloadHash,
      ].join('\n');

      const scope = `${dateStamp}/${region}/ses/aws4_request`;
      const toSign = [
        'AWS4-HMAC-SHA256',
        amzDate,
        scope,
        crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
      ].join('\n');

      const hmac = (key: crypto.BinaryLike | Buffer, data: string) =>
        crypto.createHmac('sha256', key).update(data).digest();

      const signature = hmac(
        hmac(hmac(hmac(hmac(`AWS4${secretKey}`, dateStamp), region), 'ses'), 'aws4_request'),
        toSign,
      ).toString('hex');

      const response = await fetch(`https://${host}${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-amz-date': amzDate,
          authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
        },
        body,
      });

      if (!response.ok) {
        console.error('[email] ses rejected', response.status, await response.text());
        return { sent: false };
      }
      return { sent: true };
    },
  };
}

export function getMailer(): Mailer {
  const region = process.env.AWS_SES_REGION;
  const accessKey = process.env.AWS_SES_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SES_SECRET_ACCESS_KEY;
  const from = process.env.EMAIL_FROM;

  if (region && accessKey && secretKey && from) {
    return sesMailer(region, accessKey, secretKey, from);
  }
  return noopMailer;
}

/**
 * The unsubscribe token.
 *
 * Derived from the candidate id rather than being the candidate id, so a link
 * in an inbox cannot be edited into someone else's. Same salt as the identity
 * hashes: one secret to rotate, not two.
 */
const SALT = process.env.IDENTITY_HASH_SALT ?? 'avsar-dev-salt';

export function unsubscribeToken(candidateId: string): string {
  return crypto.createHmac('sha256', SALT).update(`unsub:${candidateId}`).digest('hex').slice(0, 32);
}

export function unsubscribeMatches(candidateId: string, token: string): boolean {
  const expected = unsubscribeToken(candidateId);
  /* Constant time, so the endpoint cannot be used to guess a token byte by
     byte from how long it takes to answer. */
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
