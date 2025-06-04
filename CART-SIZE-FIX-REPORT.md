# Correção do Problema do Carrinho - Limite de 3 Itens

## Resumo do Problema

O carrinho da página de marca Xiaomi estava apresentando um problema em que apenas os primeiros 3 itens adicionados apareciam na interface do usuário, embora as respostas da API indicassem que os produtos estavam sendo adicionados com sucesso.

## Causa Raiz

Após análise, identificamos que o problema estava relacionado ao limite de tamanho dos cookies do navegador (aproximadamente 4KB). À medida que mais produtos eram adicionados:

1. O cookie crescia progressivamente (933 bytes → 1736 bytes → 2542 bytes → 3338 bytes → 3357 bytes)
2. Quando se aproximava do limite, o navegador truncava o cookie ou o rejeitava completamente
3. Como resultado, apenas os primeiros 3 itens eram mantidos/exibidos no carrinho

## Solução Implementada

### 1. Gerenciamento Inteligente do Tamanho do Cookie

- Monitoramento do tamanho do cookie durante a adição de produtos
- Quando o cookie se aproxima do limite (3700 bytes), a solução:
  - Mantém apenas os itens mais recentes no cookie
  - Preserva o contador total e informações de preço
  - Adiciona metadados indicando que há mais itens não exibidos

### 2. Sistema de Paginação para Itens do Carrinho

- Implementação de uma estratégia onde todos os itens são retornados na resposta da API
- O cookie contém apenas os itens mais recentes, mas a resposta contém todos os itens
- Adição de flags como `totalItemTypes`, `hasMoreItems` e `itemsInCookie` para informar o frontend

### 3. Otimização de Dados

- Redução do tamanho dos campos para economizar espaço:
  - Limitação do tamanho do nome do produto para 100 caracteres
  - Limitação de URLs de imagem para 250 caracteres
  - Limitação de outros textos como SKU, dimensões, etc.
- URI encoding/decoding para evitar corrupção de caracteres especiais

### 4. Tratamento Robusto de Erros

- Sistema de recuperação quando o cookie estiver corrompido
- Fallbacks para garantir que o carrinho continue funcionando mesmo em condições adversas
- Logs detalhados para facilitar a depuração futura

## Arquivos Modificados

1. `pages/api/cart/simple-add.js` → Substituído por versão melhorada
2. `pages/api/cart/simple-get.js` → Substituído por versão melhorada

## Como Testar

Execute o script de teste:

```
run-cart-size-fix.bat
```

Ou, para testar manualmente:

1. Abra a página da Xiaomi
2. Adicione mais de 3 produtos ao carrinho
3. Verifique se todos os produtos aparecem na interface do carrinho

## Resultados Esperados

- O carrinho deve exibir corretamente todos os produtos adicionados, mesmo que sejam mais de 3
- O sistema deve lidar adequadamente com limitações de tamanho de cookie
- Não deve ocorrer corrupção de dados ou perda de itens

## Observações

Esta solução equilibra:
- Conformidade com os limites do navegador
- Experiência de usuário (exibindo todos os itens)
- Performance (evitando cookies excessivamente grandes)
- Confiabilidade (prevenindo corrupção de dados)
