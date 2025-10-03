import { redis } from "./redis";

export async function invalidateDashboardCache(userId: string) {
  await redis.del(`dashboard:${userId}`);
}
