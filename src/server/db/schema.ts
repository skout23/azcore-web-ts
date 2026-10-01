import type { Generated } from "kysely";

export interface AccountTable {
  id: Generated<number>;
  username: string;
  salt: Buffer | string | null;
  verifier: Buffer | string | null;
  email: string;
  reg_mail: string | null;
  joindate: Date | string | null;
  last_ip: string | null;
  last_attempt_ip: string | null;
  failed_logins: Generated<number>;
  locked: Generated<number>;
  lock_country: string | null;
  last_login: Date | string | null;
  online: Generated<number>;
  expansion: Generated<number>;
  Flags: Generated<number>;
  mutetime: Generated<number>;
  mutereason: string | null;
  muteby: string | null;
  locale: Generated<number>;
  os: string | null;
  recruiter: Generated<number>;
  totaltime: Generated<number>;
  session_key?: Buffer | string | null;
  totp_secret?: string | null;
}

export interface AccountAccessTable {
  id: number;
  gmlevel: number;
  RealmID: number;
}

export interface AccountProfileTable {
  account_id: number;
  verified_email: string | null;
  email_verified_at: Date | string | null;
  pending_email: string | null;
  remember_token: string | null;
  deactivated_at: Date | string | null;
  deactivation_ban_date: number | null;
}

export interface AccountOperationTable {
  id: string;
  account_id: number;
  realm_id: number | null;
  character_guid: number | null;
  character_name: string | null;
  action: string;
  status: Generated<string>;
  context: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface PasswordResetTokenTable {
  email: string;
  token: string;
  created_at: Date | string | null;
}

export interface SessionTable {
  id: string;
  user_id: number | null;
  ip_address: string | null;
  user_agent: string | null;
  payload: string;
  last_activity: number;
}

export interface CharacterTable {
  guid: number;
  account: number;
  name: string;
  race: number;
  class: number;
  gender: number;
  level: number;
  xp: number;
  money: number;
  online: number;
  totaltime: number;
  logout_time: number;
  zone: number;
  map: number;
  position_x: number;
  position_y: number;
  position_z: number;
  at_login: number;
}

export interface AuthDatabase {
  account: AccountTable;
  account_access: AccountAccessTable;
}

export interface WebDatabase {
  account_profiles: AccountProfileTable;
  account_operations: AccountOperationTable;
  password_reset_tokens: PasswordResetTokenTable;
  sessions: SessionTable;
}

export interface CharacterDatabase {
  characters: CharacterTable;
}
