import * as Sentry from "@sentry/node";

export const initErrorTracking = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
    });
  }
};

export const captureError = (error, context = {}) => {
  console.error(error);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
};
