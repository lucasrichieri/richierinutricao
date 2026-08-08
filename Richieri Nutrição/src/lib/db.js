import { neon } from '@neondatabase/serverless';

export function getDb(jwtToken) {
    if (!jwtToken) {
        throw new Error("Token JWT não fornecido para conexão ao banco de dados");
    }
    const baseUrl = import.meta.env.VITE_NEON_DB_URL;
    const connectionString = baseUrl.replace('authenticated', `authenticated:${jwtToken}`);
    return neon(connectionString);
}
