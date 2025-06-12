# Integração Melhor Envio API

Esta integração substitui a biblioteca `correios-brasil` por uma implementação direta da API do Melhor Envio para cálculo de fretes.

## Funcionalidades

- Cálculo de fretes usando a API do [Melhor Envio](https://melhorenvio.com.br)
- Sistema de fallback para quando a API estiver indisponível
- Suporte ao modo sandbox para testes
- Compatível com a implementação anterior (mesma estrutura de resposta)

## Configuração

1. Crie um arquivo `.env.local` na raiz do projeto baseado no arquivo `.env.local.example`
2. Configure a variável `CEP_ORIGEM` com o CEP de origem dos produtos
3. Configure a variável `MELHORENVIO_SANDBOX` como `true` para testes ou `false` para produção

## Testando a Integração

Execute o script de teste para verificar se a integração está funcionando corretamente:

```bash
npm run test:shipping
```

Ou se preferir usando o PowerShell:

```powershell
node scripts/test-melhorenvio-api.js
```

## Estrutura da Implementação

### Arquivos Principais

- `src/services/melhorEnvioApi.js`: Serviço que faz a integração com a API do Melhor Envio
- `pages/api/shipping/calculate.js`: Endpoint da API que usa o serviço para calcular fretes
- `scripts/test-melhorenvio-api.js`: Script de teste para verificar a integração

### Fluxo de Funcionamento

1. O front-end envia uma requisição para `/api/shipping/calculate` com o CEP de destino e os produtos
2. A API tenta calcular o frete usando o Melhor Envio
3. Se a API do Melhor Envio estiver indisponível, o sistema usa valores de fallback
4. A resposta segue o mesmo formato da implementação anterior, garantindo compatibilidade

## Vantagens em Relação à Implementação Anterior

- Maior confiabilidade (o Melhor Envio é mais estável que a API dos Correios)
- Mais opções de transportadoras (não apenas Correios)
- Melhor tratamento de erros e sistema de fallback aprimorado
- Implementação modular e fácil de manter
- Suporte a modo sandbox para testes sem custo
