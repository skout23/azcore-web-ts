import "server-only";
import { z } from "zod";

const booleanFromEnv = z
  .string()
  .optional()
  .transform((value) => value === undefined || ["1", "true", "yes", "on"].includes(value.toLowerCase()));

const optionalString = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value : undefined));

const envSchema = z.object({
  APP_NAME: z.string().default("AzerothCore"),
  APP_ENV: z.enum(["development", "test", "production"]).default("production"),
  APP_SECRET: optionalString,
  ADMIN_MIN_GMLEVEL: z.coerce.number().int().min(1).max(4).default(3),
  ADMIN_REALM_ID: z.coerce.number().int().default(-1),
  APP_URL: z.string().url().default("http://localhost:8080"),
  APP_TIMEZONE: z.string().default("UTC"),
  LOG_LEVEL: z.string().default("info"),
  TRUSTED_PROXIES: z.string().optional().default(""),

  DB_AUTH_HOST: z.string().default("host.docker.internal"),
  DB_AUTH_PORT: z.coerce.number().int().positive().default(3306),
  DB_AUTH_DATABASE: z.string().default("acore_auth"),
  DB_AUTH_USERNAME: z.string().default("azweb_auth"),
  DB_AUTH_PASSWORD: z.string().default(""),
  DB_WEB_HOST: z.string().default("host.docker.internal"),
  DB_WEB_PORT: z.coerce.number().int().positive().default(3306),
  DB_WEB_DATABASE: z.string().default("azweb"),
  DB_WEB_USERNAME: z.string().default("azweb"),
  DB_WEB_PASSWORD: z.string().default(""),
  DB_CHAR_HOST: z.string().default("host.docker.internal"),
  DB_CHAR_PORT: z.coerce.number().int().positive().default(3306),
  DB_CHAR_DATABASE: z.string().default("acore_characters"),
  DB_CHAR_USERNAME: z.string().default("azweb_ro"),
  DB_CHAR_PASSWORD: z.string().default(""),
  DB_WORLD_DATABASE: z.string().default("acore_world"),

  SESSION_LIFETIME: z.coerce.number().int().positive().default(120),
  SESSION_SECURE_COOKIE: booleanFromEnv,
  SESSION_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),

  REALM_DEFAULT_ID: z.coerce.number().int().positive().default(1),
  REALM_NAME: z.string().default("AzerothCore"),
  REALM_SOAP_URL: optionalString,
  REALM_SOAP_USERNAME: optionalString,
  REALM_SOAP_PASSWORD: optionalString,

  WOW_REALMLIST: z.string().default("set realmlist logon.example.com"),
  WOW_CLIENT_URL: optionalString,
  WOW_RATE_XP: z.string().default("x1"),
  WOW_RATE_DROP: z.string().default("x1"),
  WOW_RATE_GOLD: z.string().default("x1"),
  WOW_RATE_REP: z.string().default("x1"),
  WOW_AUCTION_SHARED: booleanFromEnv,
  WOW_TOOLTIP_URL: z.string().url().default("https://wowgaming.altervista.org/aowow"),
  WOW_REGISTRATION_ENABLED: booleanFromEnv,
  WOW_COMMUNITY_PUBLIC: booleanFromEnv,
  WOW_UNSTUCK_ENABLED: booleanFromEnv,
  WOW_RENAME_ENABLED: booleanFromEnv,
  WOW_CUSTOMIZE_ENABLED: booleanFromEnv,
  WOW_UNSTUCK_COOLDOWN: z.string().default("PT3H"),
  WOW_RENAME_COOLDOWN: z.string().default("P1Y"),
  WOW_CUSTOMIZE_COOLDOWN: z.string().default("calendar_quarter"),

  SITE_LOGO: optionalString,
  SITE_FAVICON: optionalString,
  SITE_DESCRIPTION: optionalString
});

export const env = envSchema.parse(process.env);

export type AppEnv = typeof env;
