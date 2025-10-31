import { Context, Next } from "hono";

/**
 * Authentication middleware that validates service_key header against AUTH_KEY environment variable
 */
export const authMiddleware = async (c: Context, next: Next) => {
  const serviceKey = c.req.header("service_key");
  const authKey = process.env.AUTH_KEY;

  // Check if AUTH_KEY is configured
  if (!authKey) {
    return c.json(
      {
        error: "Server configuration error: AUTH_KEY not set",
      },
      500
    );
  }

  // Check if service_key header is provided
  if (!serviceKey) {
    return c.json(
      {
        error: "Unauthorized: service_key header is required",
      },
      401
    );
  }

  // Validate service_key against AUTH_KEY
  if (serviceKey !== authKey) {
    return c.json(
      {
        error: "Unauthorized: invalid service_key",
      },
      401
    );
  }

  // If validation passes, proceed to next handler
  await next();
};
