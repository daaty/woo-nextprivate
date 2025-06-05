# Melhorias nas Funcionalidades de Carrinho

## Implementação de Pontes Globais

Foram adicionados scripts globais para garantir a compatibilidade e funcionamento de diferentes botões "Adicionar ao Carrinho" em todo o site. Esses scripts criam uma ponte entre os componentes React e os elementos dinâmicos criados com JavaScript vanilla.

## Pontes Implementadas

### 1. Global Notification Bridge (`global-notification-bridge.js`)

**Propósito**: Permitir que qualquer script JavaScript no site possa exibir notificações utilizando o sistema de notificações React do site.

**Funcionalidades**:
- Expõe a função `window.showNotification(message, type)` para uso global
- Detecta automaticamente a implementação de notificação disponível no contexto React
- Oferece fallback visual caso nenhuma implementação React seja encontrada
- Suporta tipos de notificação: success, error, info, warning

**Exemplo de Uso**:
```javascript
// Exibir uma notificação de sucesso
window.showNotification('Produto adicionado ao carrinho!', 'success');

// Exibir uma notificação de erro
window.showNotification('Não foi possível adicionar o produto', 'error');
```

### 2. Global Cart Counter Bridge (`global-cart-counter.js`)

**Propósito**: Permitir a atualização do contador do carrinho a partir de qualquer script no site, especialmente após adições dinâmicas ao carrinho.

**Funcionalidades**:
- Expõe a função `window.updateCartCount()` para uso global
- Busca automaticamente o número de itens no carrinho via API v2
- Atualiza todos os elementos com as classes `.cart-count` ou `.cart-badge`
- Atualiza atributos `data-count` em elementos com `data-cart-counter`
- Dispara eventos personalizados para integração com outros componentes

**Exemplo de Uso**:
```javascript
// Atualizar o contador do carrinho após adicionar um produto
await window.updateCartCount();
```

## Eventos Personalizados

Os scripts de ponte disparam os seguintes eventos personalizados que podem ser usados por outros componentes:

1. `cartCountUpdated`: Disparado quando o contador do carrinho é atualizado
   ```javascript
   window.addEventListener('cartCountUpdated', (event) => {
     const newCount = event.detail.count;
     console.log(`O carrinho agora tem ${newCount} itens`);
   });
   ```

2. `cartUpdated`: Disparado quando o carrinho é atualizado por uma ação
   ```javascript
   window.addEventListener('cartUpdated', (event) => {
     const { product, quantity } = event.detail;
     console.log(`${quantity}x ${product.name} adicionado ao carrinho`);
   });
   ```

3. `productAddedToCart`: Evento específico para adição de produtos
   ```javascript
   window.addEventListener('productAddedToCart', (event) => {
     const { productId, productName, quantity } = event.detail;
     console.log(`Produto ${productName} (ID: ${productId}) adicionado`);
   });
   ```

## Implementação e Integração

As pontes foram implementadas como scripts autônomos que são carregados no `_app.js`, garantindo que estejam disponíveis em todas as páginas do site:

```javascript
// _app.js
import '../public/global-notification-bridge';
import '../public/global-cart-counter';
```

## Compatibilidade

Estas melhorias foram projetadas para funcionar em todos os componentes e páginas do site, incluindo:
- Botões na página inicial
- Botões nas páginas de categoria
- Botões nas ofertas com contagem regressiva (CountdownOffers)
- Botões nas páginas de produto
- Botões em recomendações e promoções especiais

## Impacto

Com estas melhorias, os usuários experimentarão:
- Feedback visual consistente em toda a loja
- Notificações uniformes para todas as ações de carrinho
- Contador de carrinho sempre atualizado, independente de onde o produto foi adicionado
- Experiência de usuário mais fluida e profissional

---

Documentação criada em 04 de junho de 2025.
