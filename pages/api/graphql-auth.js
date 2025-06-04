import { createProxyMiddleware } from 'http-proxy-middleware';
import { NextApiRequest, NextApiResponse } from 'next';

// Configuração para o proxy do GraphQL com melhor tratamento para autenticação
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://rota.rotadoscelulares.com';

// Proxy para requisições de autenticação GraphQL
const proxy = createProxyMiddleware({
  target: `${WORDPRESS_URL}/graphql`,
  changeOrigin: true,
  pathRewrite: { '^/api/graphql-auth': '' },
  secure: false, // Para permitir SSL auto-assinado em desenvolvimento
  onProxyReq: (proxyReq, req, res) => {
    // Adicionar headers específicos para autenticação se necessário
    proxyReq.setHeader('Content-Type', 'application/json');
    proxyReq.setHeader('Origin', WORDPRESS_URL);
    proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Log para debug
    console.log('[Auth Proxy] Request to:', `${WORDPRESS_URL}/graphql`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Permitir cookies e headers de autenticação
    proxyRes.headers['access-control-allow-credentials'] = 'true';
    proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
    
    // Log de resposta para debug
    if (proxyRes.statusCode !== 200) {
      console.log('[Auth Proxy] Response status:', proxyRes.statusCode);
    }
  },
  onError: (err, req, res) => {
    console.error('[Auth Proxy] Error:', err);
    res.writeHead(500, {
      'Content-Type': 'application/json',
    });
    res.end(JSON.stringify({ 
      error: 'Erro de proxy para autenticação',
      message: err.message
    }));
  }
});

// Handler da API Route
export default function handler(req, res) {
  // Verificar se é OPTIONS (preflight) e responder adequadamente
  if (req.method === 'OPTIONS') {
    res.status(200).json({
      body: 'OK',
    });
    return;
  }
  
  // Encaminhar para o proxy
  return proxy(req, res);
}