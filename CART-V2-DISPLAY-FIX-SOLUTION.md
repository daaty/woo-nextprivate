# Correção da Exibição do Cart v2

## Problema

Identificamos um problema na exibição dos produtos no carrinho onde:

- Produtos são adicionados com sucesso ao carrinho (logs mostram "✅ [Homepage Button] Produto adicionado com sucesso!")
- Porém estes produtos não aparecem na página do carrinho (cart.js)
- Logs do hook useCartWithFallback mostram "adaptedCartItems: []" indicando que o hook não está recuperando corretamente os itens

## Causa Raiz

Após análise, a causa raiz do problema foi identificada como inconsistência no ID de sessão usado entre:

1. A adição de produtos (`AddToCartButton.js`) - que usa o Cart v2 API corretamente
2. A exibição de produtos (`useCartWithFallback.js`) - que apesar de ter as flags corretas está usando um ID de sessão inconsistente

Além disso, embora as configurações no arquivo `.env.local` estejam corretas:

```
NEXT_PUBLIC_CART_V2_ENABLED=true
NEXT_PUBLIC_CART_V2_API=true
NEXT_PUBLIC_CART_V2_PERCENTAGE=100
```

Havia um problema na propagação desses valores e na consistência do ID de sessão entre as operações.

## Solução Implementada

Implementamos uma série de correções para resolver o problema:

### 1. Script de Correção de Sessão do CartProvider

Criamos um script (`fix-cart-provider.js`) que:
- Garante que o ID de sessão é consistente em todos os requests para a API do carrinho
- Intercepta todas as chamadas `fetch()` para `/api/v2/cart` e adiciona o cabeçalho `X-Cart-Session-Id`
- Ativa as feature flags no localStorage para garantir que o Cart v2 é usado consistentemente

```javascript
// Trecho principal da solução
window.fetch = function(...args) {
  // Se for uma requisição para a API do carrinho
  if (args[0] && typeof args[0] === 'string' && args[0].includes('/api/v2/cart')) {
    const sessionId = ensureConsistentSession();
    
    // Adicionar cabeçalho com sessionId
    if (args[1] && typeof args[1] === 'object') {
      args[1].headers = args[1].headers || {};
      args[1].headers['X-Cart-Session-Id'] = sessionId;
    }
  }
  
  // Chamar o fetch original
  return originalFetch.apply(this, args);
};
```

### 2. Correção na Página do Carrinho

Adicionamos um efeito na página `cart.js` para:
- Verificar e corrigir inconsistências de sessão ao carregar a página
- Forçar uma atualização do carrinho através de `refetchCart()`
- Aceitar um parâmetro `fix=true` na URL para aplicar correções manualmente

```javascript
// Trecho adicionado ao cart.js
useEffect(() => {
  // Verificar se precisa aplicar a correção (via query param)
  const shouldApplyFix = router?.query?.fix === 'true' || localStorage.getItem('apply_cart_fix') === 'true';
  
  // Limpar flag se existir
  if (localStorage.getItem('apply_cart_fix')) {
    localStorage.removeItem('apply_cart_fix');
  }
  
  // Garantir sessão consistente e forçar atualização
  if (shouldApplyFix) {
    console.log('[Cart Fix] Aplicando correção de sessão do carrinho...');
    ensureConsistentSession();
    if (refetchCart && typeof refetchCart === 'function') {
      refetchCart();
    }
  }
}, [router.query, refetchCart]);
```

### 3. Ferramentas de Diagnóstico

Criamos duas ferramentas para diagnóstico e teste:

1. **Script de Fix para Execução Única**: `fix-cart-session.js`
   - Verifica a presença de ID de sessão e cria se necessário
   - Testa conexão com a API do carrinho
   - Adiciona um produto de teste se o carrinho estiver vazio

2. **Página de Diagnóstico**: `diagnosticar-carrinho.html`
   - Interface visual para verificar status do sistema de carrinho
   - Ferramentas para reparar sessão, testar API, adicionar produtos de teste
   - Logs detalhados das operações

## Como Testar a Correção

1. **Teste Automático**:
   - Acesse `/cart?fix=true` para aplicar a correção automaticamente

2. **Teste Manual**:
   - Acesse `/diagnosticar-carrinho.html` para usar a ferramenta de diagnóstico
   - Clique em "Reparar Sessão" e "Corrigir Integridade do Carrinho"
   - Adicione um produto de teste e verifique se aparece na página do carrinho

3. **Verificação de Logs**:
   - Abra o console do navegador
   - Verifique os logs `[CartProvider Patch]` e `[Cart Fix]`
   - Confirme que não há erros durante o processo

## Impacto das Modificações

- **Arquivos Modificados**:
  - `pages/_app.js`: Inclusão do script fix-cart-provider.js
  - `pages/cart.js`: Adição de código para correção de sessão
  - `public/fix-cart-provider.js`: Novo script de correção
  - `public/fix-cart-session.js`: Script de correção para execução única
  - `public/diagnosticar-carrinho.html`: Nova página de diagnóstico

- **Comportamento Esperado**:
  - Produtos adicionados via botões da homepage aparecem na página do carrinho
  - Consistência entre contagem de itens e produtos exibidos
  - Nenhum erro no console relacionado ao carrinho

## Conclusão

A implementação dessas correções resolve o problema de inconsistência na exibição dos produtos no carrinho. Os produtos agora são corretamente adicionados e exibidos, mantendo uma experiência de usuário consistente.

O sistema agora utiliza efetivamente o Cart v2 em toda a aplicação, com as feature flags apropriadas e uma gestão de sessão consistente entre todas as operações relacionadas ao carrinho.

---

Documentação elaborada em 04 de Junho de 2025.
