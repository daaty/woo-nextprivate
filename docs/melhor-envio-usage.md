# Integração com Melhor Envio

Este documento explica como configurar e testar a nova integração com Melhor Envio para substituir a biblioteca `correios-brasil`.

## Por que esta mudança?

A biblioteca `correios-brasil` tem apresentado instabilidades e falhas frequentes, resultando em mensagens de erro como:
- `Cannot read properties of undefined (reading 'map')`
- Timeouts frequentes
- Dados inconsistentes

A integração direta com o Melhor Envio oferece:
- API mais estável e confiável
- Maior variedade de transportadoras
- Melhor tratamento de erros
- Fallbacks eficientes para quando a API está indisponível

## Requisitos

1. Conta no [Melhor Envio](https://melhorenvio.com.br)
2. Token de API (gerado na plataforma do Melhor Envio)

## Configuração

1. **No arquivo `.env.local`** na raiz do projeto, adicione:
   ```
   # CEP de origem (sem hífen)
   CEP_ORIGEM=78515000
   
   # Melhor Envio API
   MELHORENVIO_TOKEN=seu_token_aqui
   MELHORENVIO_SANDBOX=true  # Use false em produção
   ```

2. **Obter Token do Melhor Envio**:
   - Acesse sua conta no Melhor Envio
   - Vá para Configurações > Tokens
   - Clique em "Gerar Token"
   - Dê um nome para o token (ex: "Integração E-commerce")
   - Selecione as permissões necessárias:
     - shipping-calculate
     - shipping-services
   - Copie o token gerado e adicione ao `.env.local`

## Testando a Integração

Para testar se a integração está funcionando corretamente:

1. Execute o script de teste:
   ```
   node scripts/test-melhorenvio-api.js
   ```

2. Verifique o resultado no console:
   - Se funcionar: você verá uma lista de opções de frete disponíveis
   - Se falhar: verifique os erros e siga as instruções de troubleshooting

## Troubleshooting

### Erro 401 Unauthorized

Se você receber um erro 401:
- Verifique se o token foi configurado corretamente no `.env.local`
- Confirme que o token está ativo no painel do Melhor Envio
- Verifique se o token tem as permissões necessárias

### Usando Valores de Fallback

Se a API do Melhor Envio estiver indisponível, o sistema usará automaticamente valores de fallback calculados com base na distância entre CEPs.

Para identificar quando valores de fallback estão sendo usados:
- Na resposta da API, verifique a propriedade `isFallback: true`
- No console, você verá mensagens indicando o uso de valores de fallback
- O front-end pode exibir uma mensagem informando que são valores estimados

## Sandbox vs. Produção

- **Sandbox** (`MELHORENVIO_SANDBOX=true`): Use durante desenvolvimento e testes
- **Produção** (`MELHORENVIO_SANDBOX=false`): Use quando estiver pronto para ir ao ar

Quando estiver pronto para produção, não esqueça de atualizar o valor para `false` no `.env.local`.
