# 🛍️ Cart V2 - Versão Simplificada

## 📋 Resumo da Restauração

O sistema Cart V2 foi restaurado para uma versão simplificada e estável, removendo o sistema complexo de sincronização de sessões que estava causando problemas. A implementação atual é simples, robusta e fácil de manter.

### ✅ O que foi restaurado

1. **Gerenciamento Simples de Sessões**:
   - Armazenamento único em `localStorage` com a chave `cart_v2_session_id`
   - Sessão gerada automaticamente quando necessário
   - Sem sincronização complexa entre abas ou componentes

2. **API Cart V2 Simplificada**:
   - Endpoint `/api/v2/cart` para operações CRUD
   - Endpoint `/api/v2/cart/clear` para limpar carrinho
   - Sem cabeçalhos complexos ou validação avançada de sessão
   
3. **Mini Cart Counter**:
   - Componente simples para exibir o contador de itens
   - Integrado ao layout existente via `CartIconWithV2Counter`
   - Atualização automática quando o carrinho é modificado

### 🧹 O que foi removido

1. **Sistema Complexo de Sincronização**:
   - `sessionSync.js` - sistema de eventos complexo
   - Validação e limpeza de cookies
   - Cross-tab synchronization
   
2. **Throttling e Cache Excessivos**:
   - Remoção de lógica de throttling que estava impedindo atualizações do carrinho
   - Remoção de cache complexo que causava problemas de inconsistência
   
3. **Código de Session Reset**:
   - Remoção de lógica para forçar criação de novas sessões

## 📌 Como funciona agora

### Fluxo de Operação

1. **Inicialização**:
   - O `CartProvider.js` verifica se existe uma sessão no localStorage
   - Se não existir, cria uma nova sessão e a armazena

2. **Adição ao Carrinho**:
   - O botão `AddToCartButton.js` chama a função `addToCart` do CartProvider
   - O CartProvider usa a função `apiCall` que adiciona o ID da sessão aos cabeçalhos
   - A API `/api/v2/cart` recebe o produto e o adiciona ao carrinho da sessão

3. **Exibição do Contador**:
   - O componente `MiniCartCounter.js` usa o hook `useCartV2` para acessar o estado do carrinho
   - O contador é atualizado automaticamente quando o estado muda

### Estrutura de Arquivos

```
src/
└── v2/
    └── cart/
        ├── components/
        │   ├── AddToCartButton.js    # Botão para adicionar ao carrinho
        │   └── MiniCartCounter.js    # Contador para o mini carrinho
        ├── context/
        │   └── CartProvider.js       # Provider simplificado do carrinho
        └── services/
            └── wooCommerceIntegration.js  # Integração WooCommerce
            
pages/
└── api/
    └── v2/
        └── cart/
            ├── index.js              # Endpoints CRUD do carrinho
            └── clear.js              # Endpoint para limpar o carrinho
```

## 🚀 Como usar

### Adicionar o Cart Counter a um Componente

```jsx
import MiniCartCounter from '../v2/cart/components/MiniCartCounter';

const MeuComponente = () => {
  return (
    <div>
      {/* Outros elementos */}
      <MiniCartCounter className="minha-classe" />
    </div>
  );
};
```

### Adicionar o Button "Adicionar ao Carrinho"

```jsx
import AddToCartButtonV2 from '../v2/cart/components/AddToCartButton';

const PaginaProduto = ({ produto }) => {
  return (
    <div>
      <h1>{produto.nome}</h1>
      <p>R$ {produto.preco}</p>
      
      <AddToCartButtonV2 
        product={produto}
        quantity={1}
        showModal={true}
        onSuccess={() => console.log('Produto adicionado!')}
      />
    </div>
  );
};
```

## 📝 Notas Importantes

1. Esta implementação é simples e adequada para a maioria dos cenários.
2. O carrinho é armazenado por sessão, não por usuário, o que é compatível com a maioria dos sistemas de e-commerce.
3. Para futura expansão, considerar a adição de sincronização com WooCommerce quando necessário.
