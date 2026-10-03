import { wowConfig } from "@/server/config/wow";

export type AccountAction = "email" | "password" | "sessions" | "unstuck" | "rename" | "customize" | "deactivate" | "restore";
export type CharacterAction = "unstuck" | "rename" | "customize";

export const accountActionLabels: Record<AccountAction, string> = {
  email: "Email changed",
  password: "Password changed",
  sessions: "Other sessions ended",
  unstuck: "Unstuck",
  rename: "Rename",
  customize: "Change appearance",
  deactivate: "Account deactivated",
  restore: "Account restored"
};

export function loginFlagForAction(action: AccountAction): number {
  if (action === "rename") return 1;
  if (action === "customize") return 8;
  return 0;
}

export function commandForCharacterAction(action: CharacterAction, guid: number): string {
  if (action === "unstuck") return `unstuck ${guid} inn`;
  if (action === "rename") return `character rename ${guid}`;
  return `character customize ${guid}`;
}

export function actionEnabled(action: CharacterAction): boolean {
  return wowConfig.actions[action].enabled;
}
