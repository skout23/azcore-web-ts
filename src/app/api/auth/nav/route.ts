import { NextResponse } from "next/server";
import { isAdminAccount } from "@/server/admin/access";
import { currentSession } from "@/server/session/database";

export async function GET() {
  try {
    const session = await currentSession();
    const isAdmin = session ? await isAdminAccount(session.user.id) : false;

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("Unable to resolve navigation permissions.", error);
    return NextResponse.json({ isAdmin: false });
  }
}
