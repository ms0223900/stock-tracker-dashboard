/**
 * Vercel Cron：平台會帶 `Authorization: Bearer ${CRON_SECRET}`。
 * 另支援 `x-cron-secret` 供本機或手動 curl 測試（與課程 Notion 範例一致）。
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  const xCron = request.headers.get("x-cron-secret")?.trim();
  return xCron === cronSecret;
}
