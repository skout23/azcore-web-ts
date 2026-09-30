import "server-only";
import { env } from "./env";

export const wowConfig = {
  defaultRealmId: env.REALM_DEFAULT_ID,
  worldDatabase: env.DB_WORLD_DATABASE,
  tooltipUrl: env.WOW_TOOLTIP_URL,
  modelviewerPath: "modelviewer/9.2.0/",
  auction: {
    shared: env.WOW_AUCTION_SHARED
  },
  realms: {
    [env.REALM_DEFAULT_ID]: {
      name: env.REALM_NAME || env.APP_NAME,
      soap: {
        url: env.REALM_SOAP_URL,
        username: env.REALM_SOAP_USERNAME,
        password: env.REALM_SOAP_PASSWORD
      }
    }
  },
  expansion: "Wrath of the Lich King (3.3.5a)",
  rates: {
    xp: env.WOW_RATE_XP,
    drop: env.WOW_RATE_DROP,
    gold: env.WOW_RATE_GOLD,
    reputation: env.WOW_RATE_REP
  },
  realmlist: env.WOW_REALMLIST,
  clientDownloadUrl: env.WOW_CLIENT_URL,
  registrationEnabled: env.WOW_REGISTRATION_ENABLED,
  communityPublic: env.WOW_COMMUNITY_PUBLIC,
  actions: {
    unstuck: {
      enabled: env.WOW_UNSTUCK_ENABLED,
      cooldown: env.WOW_UNSTUCK_COOLDOWN
    },
    rename: {
      enabled: env.WOW_RENAME_ENABLED,
      cooldown: env.WOW_RENAME_COOLDOWN
    },
    customize: {
      enabled: env.WOW_CUSTOMIZE_ENABLED,
      cooldown: env.WOW_CUSTOMIZE_COOLDOWN
    }
  }
} as const;

export function realmName(realmId = wowConfig.defaultRealmId): string {
  return wowConfig.realms[realmId]?.name ?? env.APP_NAME;
}
