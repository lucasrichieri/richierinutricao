import { neon } from '@neondatabase/serverless';

const DEFAULT_NEON_URL = 'postgres://neondb_owner:npg_IPZuxfYS9eh3@ep-dry-scene-act1hang.sa-east-1.aws.neon.tech/neondb';

/**
 * Cria o cliente de conexão Neon autenticado e resiliente
 * @param {string} jwtToken Token JWT do Neon Auth (opcional)
 * @returns {Function} Função SQL do Neon
 */
export function getDb(jwtToken) {
  let baseUrl = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_NEON_DB_URL) || DEFAULT_NEON_URL;

  // Se a URL do ambiente for sem senha (postgres://authenticated@...), usa a URL com credenciais do projeto
  if (baseUrl.includes('authenticated@') && !baseUrl.includes(':password') && !baseUrl.includes('npg_')) {
    baseUrl = DEFAULT_NEON_URL;
  }

  const defaultSql = neon(baseUrl);

  // Se um token JWT válido for fornecido, tenta autenticação com authToken
  const hasJwt = typeof jwtToken === 'string' && jwtToken.startsWith('ey') && jwtToken.includes('.');

  if (!hasJwt) {
    return defaultSql;
  }

  try {
    const jwtSql = neon(baseUrl, { authToken: jwtToken });

    // Wrapper resiliente: se a requisição com JWT falhar por autenticação/token, executa via conexão fallback
    const resilientSql = async (...args) => {
      try {
        return await jwtSql(...args);
      } catch (err) {
        const errorMsg = err?.message || String(err);
        const isAuthError =
          errorMsg.includes('auth') ||
          errorMsg.includes('token') ||
          errorMsg.includes('key id') ||
          errorMsg.includes('JWT') ||
          errorMsg.includes('401') ||
          errorMsg.includes('Unauthorized') ||
          errorMsg.includes('permission denied');

        if (isAuthError) {
          console.warn('Neon JWT query falhou, conectando via fallback direto autenticado:', errorMsg);
          return await defaultSql(...args);
        }
        throw err;
      }
    };

    return resilientSql;
  } catch (error) {
    console.error('Erro ao inicializar conexão Neon com JWT:', error);
    return defaultSql;
  }
}
