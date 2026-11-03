export const DEMO_EMAIL = "demo@devstash.app";
export const DEMO_USER_ID = "demo_user";
export const DEMO_RESET_INTERVAL_MS = 60 * 60 * 1000;

export function isDemoUser(email: string | null | undefined): boolean {
  return email === DEMO_EMAIL;
}
