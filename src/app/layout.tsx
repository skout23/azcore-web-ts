import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import "@/styles/globals.css";
import { env } from "@/server/config/env";

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
          <nav>
            <Link href="/characters">Characters</Link>
            <Link href="/guilds">Guilds</Link>
            <Link href="/auctions">Auctions</Link>
            <Link href="/leaderboard">Leaderboard</Link>
            <Link href={"/admin" as Route}>Admin</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
