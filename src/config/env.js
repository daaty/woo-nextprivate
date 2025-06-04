// Arquivo de configuração para centralizar variáveis de ambiente
// Isso ajuda a debugar problemas e fornece fallbacks quando as variáveis não estão disponíveis

// CEP de origem para cálculos de frete
export const CEP_ORIGEM = process.env.CEP_ORIGEM || '78515000';

// URL do WordPress
export const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://rota.rotadoscelulares.com';

// Outras variáveis de ambiente podem ser adicionadas aqui
