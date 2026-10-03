import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const startedAt = Date.now();
  const response = NextResponse.next();

  response.headers.set("x-azweb-request", "1");
  console.log(`${request.method} ${request.nextUrl.pathname} ${Date.now() - startedAt}ms`);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
