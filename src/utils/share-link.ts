import { randomBytes, createHash } from "crypto";

export function generateShareToken() {
  const token = randomBytes(24).toString("base64url"); // 192-bit
  const tokenHash = createHash("sha256").update(token).digest("base64url");
  return { token, tokenHash };
}
