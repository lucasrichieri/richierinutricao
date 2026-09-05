import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import gerarPlanoHandler from './api/gerar-plano.js';
import enviarEmailHandler from './api/enviar-plano-email.js';

function serverlessApiPlugin() {
  return {
    name: 'serverless-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const isGerarPlano = req.url === '/api/gerar-plano' || req.url.startsWith('/api/gerar-plano');
        const isEnviarEmail = req.url === '/api/enviar-plano-email' || req.url.startsWith('/api/enviar-plano-email');

        if (isGerarPlano || isEnviarEmail) {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              req.body = body ? JSON.parse(body) : {};
            } catch {
              req.body = {};
            }

            res.status = (code) => {
              res.statusCode = code;
              return res;
            };
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return res;
            };

            try {
              if (isGerarPlano) {
                await gerarPlanoHandler(req, res);
              } else if (isEnviarEmail) {
                await enviarEmailHandler(req, res);
              }
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), serverlessApiPlugin()],
  };
});
