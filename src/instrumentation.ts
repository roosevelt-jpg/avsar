import type { Instrumentation } from 'next';

/* Imported lazily so the Edge build never pulls in node:crypto, and so the
   Node runtime only loads the reporter when there is an error to report. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { captureServerError } = await import('@/lib/monitoring/sentry');
  const digest =
    typeof error === 'object' && error !== null && 'digest' in error ? String(error.digest) : undefined;
  await captureServerError(error, {
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    digest,
  });
};
