import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/globals.css";
import { env } from "@/server/config/env";
import { HeaderNav } from "./nav";

export const metadata: Metadata = {
  title: env.APP_NAME,
  description: env.SITE_DESCRIPTION ?? "AzerothCore account and armory"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">
            {env.APP_NAME}
          </Link>
          <HeaderNav />
        </header>
        {children}
      </body>
    </html>
  );
}
