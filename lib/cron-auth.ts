/**
 * Validates cron / manual scheduled invocations (US-003).
 * Vercel sends Authorization: Bearer {CRON_SECRET}; manual tests may use x-cron-secret.
 */
export function isCronAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  const headerSecret = request.headers.get("x-cron-secret");
  return headerSecret === cronSecret;
}
