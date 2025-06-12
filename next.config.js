const path = require("path");
const allowedImageWordPressDomain = new URL(process.env.NEXT_PUBLIC_WORDPRESS_URL).hostname

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    trailingSlash: true,
    webpackDevMiddleware: (config) => {
        config.watchOptions = {
            poll: 1000,
            aggregateTimeout: 300,
        };

        return config;
    },
    sassOptions: {
        includePaths: [path.join(__dirname, "styles")],
    },    env: {
        // Incluir explicitamente a variável CEP_ORIGEM nas variáveis de ambiente
        CEP_ORIGEM: process.env.CEP_ORIGEM || '78515000',
        CORREIOS_ACCESS_CODE: process.env.CORREIOS_ACCESS_CODE,
        CORREIOS_USER: process.env.CORREIOS_USER || '54637507000180',
    },
    // Configurar variáveis de ambiente públicas e privadas
    serverRuntimeConfig: {
        // Variáveis disponíveis apenas no servidor
        CEP_ORIGEM: process.env.CEP_ORIGEM || '78515000',
        CORREIOS_ACCESS_CODE: process.env.CORREIOS_ACCESS_CODE,
        CORREIOS_USER: process.env.CORREIOS_USER || '54637507000180',
    },
    publicRuntimeConfig: {
        // Variáveis disponíveis no cliente e no servidor
        WORDPRESS_URL: process.env.NEXT_PUBLIC_WORDPRESS_URL,
    },
    /**
     * We specify which domains are allowed to be optimized.
     * This is needed to ensure that external urls can't be abused.
     * @see https://nextjs.org/docs/basic-features/image-optimization#domains
     */
    images: {
        domains: [
            'localhost', 
            'woonext.local', 
            'via.placeholder.com',
            'placehold.co',
            'rota.rotadoscelulares.com'
        ],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        // Confirma que as imagens locais funcionarão corretamente
        unoptimized: process.env.NODE_ENV !== 'production',
    },
    // Configuração de reescritas para redirecionar chamadas de API para evitar problemas de CORS
    async rewrites() {
        return [
            // Proxy para API GraphQL para contornar problemas de CORS
            {
                source: '/api/graphql',
                destination: 'https://rota.rotadoscelulares.com/graphql',
            },
            {
                source: '/:path*',
                destination: '/:path*',
            },
        ];
    },
    async redirects() {
        return [
            // Removidos os redirecionamentos para /categoria/apple
            // Se necessário, adicione:
            {
                source: '/categoria/apple',
                destination: '/marca/apple',
                permanent: true,
            },
            {
                source: '/smartphones/xiaomi',
                destination: '/categoria/xiaomi',
                permanent: true,
            },
            {
                source: '/smartphones/samsung',
                destination: '/categoria/samsung',
                permanent: true,
            },
            {
                source: '/smartphones/motorola',
                destination: '/categoria/motorola',
                permanent: true,
            },
            {
                source: '/smartphones',
                destination: '/categoria/smartphones',
                permanent: true,
            }
        ]
    },
    // Garantir que o diretório de páginas esteja correto para projetos que usam /src
    pageExtensions: ['js', 'jsx', 'ts', 'tsx']
};

module.exports = nextConfig;
