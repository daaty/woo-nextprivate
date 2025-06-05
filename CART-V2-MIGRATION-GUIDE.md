# Guia de Migração para Cart v2

Este documento explica as alterações realizadas para utilizar exclusivamente o Cart v2 no sistema e remover a dependência do Cart v1.

## Alterações Principais

### 1. Remoções de Integrações com Cart v1

- Removidas todas as referências ao `serverCartStorage` do Cart v1 no endpoint Cart v2
- Eliminado o código de conversão/sincronização entre os dois sistemas de carrinho

### 2. Modificações nos Endpoints

- `pages/api/v2/cart/index.js` - Removido código de sincronização com Cart v1, agora usa apenas seu próprio armazenamento
- `pages/api/v2/cart/clear.js` - Atualizado para aceitar métodos POST/DELETE e usar o armazenamento do Cart v2

### 3. Atualizações nos Componentes de Interface

- `src/components/cart/AddToCartButton.js` - Atualizado para utilizar a API Cart v2 diretamente (`/api/v2/cart`)
- `pages/marca/xiaomi.js` - Atualizado para utilizar a API Cart v2 em vez da API Cart v1

### 4. Sistema de Hooks

- `src/hooks/useCartRest.js` - Modificado para apontar para a API Cart v2 em vez de Cart v1

## Estrutura do Carrinho v2

### Armazenamento

```javascript
global.cartStorageV2 = {
  sessionId: {
    items: [
      {
        id: string,              // Product ID
        productId: string,       // Product ID (same as id)
        name: string,            // Product name
        price: number,           // Product price
        quantity: number,        // Quantity
        total: number,           // Total price (price * quantity)
        image: string|null,      // Image URL
        attributes: array,       // Product attributes
        variationId: string|null // Variation ID if applicable
      },
      // ... mais itens
    ],
    total: number,         // Total do carrinho
    itemCount: number,     // Número total de itens
    created: string,       // Data de criação ISO
    lastUpdated: number    // Timestamp da última atualização
  }
}
```

### Endpoints

- **GET** `/api/v2/cart` - Obtém o conteúdo do carrinho
- **POST** `/api/v2/cart` - Adiciona um item ao carrinho
- **PUT** `/api/v2/cart` - Atualiza a quantidade de um item
- **DELETE** `/api/v2/cart` - Remove um item do carrinho
- **POST** `/api/v2/cart/clear` - Limpa todo o carrinho

## Testes

Um script de teste `test-cart-v2-only.js` foi criado para validar o funcionamento do Cart v2 independente do Cart v1. O script realiza operações básicas de CRUD no carrinho para garantir que tudo está funcionando adequadamente.

## Próximos Passos

1. Acompanhar o uso do carrinho em produção
2. Verificar se todos os componentes estão usando a API correta
3. Remover completamente os endpoints de Cart v1 após um período de observação
