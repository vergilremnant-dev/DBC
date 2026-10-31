/**
 * Safety rails for the demo/test seed scripts in this folder.
 *
 * These scripts create demo accounts (and seed_all_services.js deletes and recreates demo data). They must never
 * run against production, and they carry no passwords: the demo password comes from the environment.
 *
 *   ALLOW_DEMO_SEED=true SEED_DEMO_PASSWORD='<at least 12 chars>' node prisma/seed.js
 *
 * An ADMIN demo account is only created when SEED_CREATE_ADMIN=true is also set.
 * Passwords and tokens are never printed.
 */
export function assertDemoSeedAllowed(scriptName) {
  const env = process.env;
  if (env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production') {
    console.error(`[${scriptName}] Refusing to run: demo seeding is disabled when NODE_ENV/VERCEL_ENV is production.`);
    process.exit(1);
  }
  if (env.ALLOW_DEMO_SEED !== 'true') {
    console.error(`[${scriptName}] Refusing to run: set ALLOW_DEMO_SEED=true to seed a development or test database.`);
    process.exit(1);
  }
}

/** Demo account password from the environment (never hard-coded, never logged). */
export function demoSeedPassword(scriptName) {
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password || password.length < 12) {
    console.error(`[${scriptName}] Set SEED_DEMO_PASSWORD (at least 12 characters) to create demo accounts.`);
    process.exit(1);
  }
  return password;
}

export function demoAdminAllowed() {
  return process.env.SEED_CREATE_ADMIN === 'true';
}
