import { neon } from '@neondatabase/serverless';

/**
 * Cria o cliente de conexão Neon autenticado
 * @param {string} jwtToken Token JWT do Neon Auth
 * @returns {Function} Função SQL do Neon
 */
export function getDb(jwtToken) {
  const baseUrl = import.meta.env.VITE_NEON_DB_URL;
  if (!baseUrl) {
    console.warn('VITE_NEON_DB_URL não configurada no ambiente');
    return null;
  }

  try {
    let connectionString = baseUrl;
    if (jwtToken) {
      connectionString = baseUrl.replace('authenticated', `authenticated:${jwtToken}`);
    }
    return neon(connectionString);
  } catch (error) {
    console.error('Erro ao inicializar conexão Neon:', error);
    return null;
  }
}
