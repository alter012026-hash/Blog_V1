import { cookies } from "next/headers";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export function checkAdminAuth() {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_auth")?.value;
  if (!token) return false;
  try {
    return Buffer.from(token, "base64").toString("utf8") === ADMIN_PASSWORD;
  } catch {
    return false;
  }
}
