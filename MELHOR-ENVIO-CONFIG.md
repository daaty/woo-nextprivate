## Configuração do Melhor Envio API

Este arquivo contém instruções para configurar a integração com Melhor Envio.

### Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```
# CEP de origem (onde os produtos são enviados)
CEP_ORIGEM=XXXXX-XXX

# Config Melhor Envio
MELHORENVIO_TOKEN=seu_token_aqui
MELHORENVIO_SANDBOX=true
```

### Configuração

Para utilizar a API do Melhor Envio em produção, você precisará obter suas credenciais:

1. Crie uma conta no [Melhor Envio](https://melhorenvio.com.br/)
2. Acesse "Configurações" > "Tokens"
3. Clique em "Gerar Token"
4. Defina um nome para o token (ex: "Integração E-commerce")
5. Selecione as permissões necessárias (pelo menos "shipping-calculate" e "shipping-services")
6. Copie o token gerado e adicione-o ao arquivo `.env.local`
7. Configure o modo sandbox para `false` quando estiver pronto para produção

### Verificação da Configuração

Execute o script de teste para verificar se a integração está funcionando corretamente:
```
node scripts/test-melhorenvio-api.js
```

### Observações

- O modo sandbox (`MELHORENVIO_SANDBOX=true`) permite testar a integração sem realizar envios reais
- Se você receber um erro 401 (Unauthorized), verifique se o token foi configurado corretamente
- Em caso de falha na API do Melhor Envio, o sistema usa um cálculo de fallback baseado na distância entre CEPs
- Para utilizar a geração de etiquetas e envios, você precisará de um token com permissões adicionais
