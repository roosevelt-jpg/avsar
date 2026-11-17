/**
 * Client-safe CCAvenue Hosted Payment Page launcher.
 *
 * Their gateway expects a browser POST with encRequest + access_code (not a
 * GET redirect). The server encrypts the order; this only builds the form.
 */

export type CcavenueClientToken = {
  accessCode: string;
  encRequest: string;
  action: string;
};

export function parseCcavenueClientToken(token: string): CcavenueClientToken | null {
  try {
    const data = JSON.parse(token) as Partial<CcavenueClientToken>;
    if (!data.accessCode || !data.encRequest || !data.action) return null;
    return { accessCode: data.accessCode, encRequest: data.encRequest, action: data.action };
  } catch {
    return null;
  }
}

export function openCcavenueCheckout(payload: CcavenueClientToken): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = payload.action;
  form.acceptCharset = 'UTF-8';
  form.style.display = 'none';

  const enc = document.createElement('input');
  enc.type = 'hidden';
  enc.name = 'encRequest';
  enc.value = payload.encRequest;
  form.appendChild(enc);

  const access = document.createElement('input');
  access.type = 'hidden';
  access.name = 'access_code';
  access.value = payload.accessCode;
  form.appendChild(access);

  document.body.appendChild(form);
  form.submit();
}
