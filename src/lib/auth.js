import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

const DEFAULT_AUTH_URL = 'https://ep-dry-scene-act1hang.neonauth.sa-east-1.aws.neon.tech/neondb/auth';

export const authClient = createAuthClient({
  baseURL: (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_NEON_AUTH_URL) || DEFAULT_AUTH_URL,
  plugins: [jwtClient()]
});
