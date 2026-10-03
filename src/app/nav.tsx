"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function HeaderNav() {
  const [showAdminLink, setShowAdminLink] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadNavState() {
      try {
        const response = await fetch("/api/auth/nav", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as { isAdmin?: boolean };
        if (active) setShowAdminLink(Boolean(data.isAdmin));
      } catch {
        if (active) setShowAdminLink(false);
      }
    }

    void loadNavState();

    return () => {
      active = false;
    };
  }, []);

  return (
    <nav>
      <Link href="/characters">Characters</Link>
      <Link href="/guilds">Guilds</Link>
      <Link href="/auctions">Auctions</Link>
      <Link href="/leaderboard">Leaderboard</Link>
      {showAdminLink ? <Link href="/admin">Admin</Link> : null}
    </nav>
  );
}
