import "server-only";
import { env } from "@/server/config/env";

export function redirectUrl(request: Request, path: string): URL {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const requestProto = new URL(request.url).protocol.replace(":", "");
  const proto = forwardedProto || requestProto || new URL(env.APP_URL).protocol.replace(":", "");

  if (host) {
    return new URL(path, `${proto}://${host}`);
  }

  return new URL(path, env.APP_URL);
}
