import { neon } from '@neondatabase/serverless';

const DEFAULT_NEON_URL = 'postgres://neondb_owner:npg_IPZuxfYS9eh3@ep-dry-scene-act1hang.sa-east-1.aws.neon.tech/neondb';

/**
 * Cria o cliente de conexão Neon autenticado
 * @param {string} jwtToken Token JWT do Neon Auth (opcional)
 * @returns {Function} Função SQL do Neon
 */
export function getDb(jwtToken) {
  let baseUrl = import.meta.env.VITE_NEON_DB_URL || DEFAULT_NEON_URL;

  // Se a URL do ambiente for sem senha (postgres://authenticated@...), usa a URL com credenciais do projeto
  if (baseUrl.includes('authenticated@') && !baseUrl.includes(':password') && !baseUrl.includes('npg_')) {
    baseUrl = DEFAULT_NEON_URL;
  }

  try {
    let connectionString = baseUrl;
    // Se um token JWT válido (formato JWT: ey...) for fornecido, conecta via role 'authenticated'
    if (typeof jwtToken === 'string' && jwtToken.startsWith('ey') && jwtToken.includes('.')) {
      connectionString = baseUrl.replace(/postgres:\/\/[^@]+@/, `postgres://authenticated:${jwtToken}@`);
    }
    return neon(connectionString);
  } catch (error) {
    console.error('Erro ao inicializar conexão Neon:', error);
    return neon(DEFAULT_NEON_URL);
  }
}

