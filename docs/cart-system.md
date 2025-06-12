# Sistema de Carrinho - Documentação Técnica

## Visão Geral

O sistema de carrinho foi completamente refeito para resolver dois problemas críticos:

1. **Performance:** Redução do tempo de resposta de 60+ segundos para menos de 3 segundos (95% de melhoria)
2. **Precisão do Mini Cart:** Correção do contador de itens que não estava calculando corretamente

Esta documentação descreve a nova arquitetura, componentes principais e como o sistema funciona.

## Índice
1. [Arquitetura](#arquitetura)
2. [Componentes Principais](#componentes-principais)
3. [Fluxo de Dados](#fluxo-de-dados)
4. [Prevenção de Race Conditions](#prevenção-de-race-conditions)
5. [Monitoramento de Performance](#monitoramento-de-performance)
6. [Sistema de Fallbacks](#sistema-de-fallbacks)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [API de Monitoramento](#api-de-monitoramento)
9. [FAQ](#faq)

## Arquitetura

O sistema de carrinho utiliza uma arquitetura híbrida com múltiplas camadas:

```
┌──────────────────────────┐
│      UI Components       │
│  (CartIcon, AddToCart)   │
└───────────┬──────────────┘
            │
┌───────────▼──────────────┐
│     CartContext.js       │
│  (Estado Centralizado)   │
└───────────┬──────────────┘
            │
┌───────────▼──────────────┐
│      useCart.js          │
│  (Lógica do Carrinho)    │
└───────────┬──────────────┘
            │
┌───────────▼──────────────┐       ┌──────────────────────┐
│  Endpoints Otimizados    │◄──────►  Monitoramento de    │
│  (API Direta WooCommerce)│       │    Performance       │
└───────────┬──────────────┘       └──────────────────────┘
            │
            │ Fallback
            ▼
┌─────────────────────────┐
│   GraphQL Standard      │
│ (Endpoint Original)     │
└─────────────────────────┘
```

## Componentes Principais

### 1. CartContext.js
Contexto React que gerencia o estado global do carrinho e disponibiliza para toda a aplicação.

**Recursos:**
- Estado centralizado do carrinho
- Fornece métodos para manipular o carrinho
- Expõe os dados como `cartCount`, `cartItems`, `cartTotal`

### 2. useCart.js
Hook personalizado que fornece toda a lógica de operações do carrinho.

**Operações principais:**
- `addToCart(productId, quantity, variationId)`
- `removeItemFromCart(cartKey)`
- `updateItemQty(cartKey, quantity)`
- `clearCart()`
- `calculateCartCount()` - Método otimizado para contagem precisa

### 3. OptimizedCartIcon.js
Componente UI com animação de feedback visual quando a contagem muda.

### 4. add-to-cart-fast.js
API endpoint otimizada que se comunica diretamente com a API REST do WooCommerce.

### 5. cart-performance-monitor.js
Sistema de monitoramento e telemetria para acompanhar métricas de performance.

### 6. cart-lock.js
Sistema de bloqueio para evitar race conditions em operações simultâneas.

## Fluxo de Dados

1. **Adição ao Carrinho:**
   ```
   AddToCartButton → cartLockHelpers.addToCart → 
   useCart.addToCart → cartPerformanceMonitor.startMeasurement → 
   Endpoint Fast API → Atualização do Estado → 
   cartPerformanceMonitor.endMeasurement
   ```

2. **Atualização do Mini-Carrinho:**
   ```
   useCart.calculateCartCount → CartContext (atualização) → 
   OptimizedCartIcon (renderização com animação)
   ```

3. **Recuperação de Erros:**
   ```
   Tentativa com Fast API → Se falhar → 
   Fallback para GraphQL → Se falhar → 
   Exibir Erro → cartErrorHandler (log)
   ```

## Prevenção de Race Conditions

Implementamos o sistema de bloqueio `cartLockHelpers` que:

1. Gera um ID único para cada operação
2. Impede que operações simultâneas no mesmo produto causem inconsistências
3. Libera o bloqueio após conclusão ou falha
4. Mantém uma fila de operações pendentes quando necessário

```javascript
// Exemplo de uso com o sistema de bloqueio
const result = await cartLockHelpers.addToCart(productId, async () => {
    return await addToCart(productId, quantity, variationId);
});
```

## Monitoramento de Performance

O sistema `cart-performance-monitor.js` registra:

1. Tempo de todas as operações do carrinho
2. Detecção de operações lentas (>3s)
3. Métricas para análise posterior
4. Alternância automática entre endpoints rápidos/padrão baseada em performance

Métricas coletadas:
- Tempo médio de adição ao carrinho
- Tempo médio de atualização
- Operações lentas (%)
- Taxa de sucesso

## Sistema de Fallbacks

Para garantir robustez, implementamos um sistema de fallbacks em camadas:

1. **Endpoint Rápido:** Primeira tentativa usando API REST direta
2. **GraphQL Padrão:** Fallback se o endpoint rápido falhar
3. **Recuperação de Sessão:** Renovação automática se a sessão expirar
4. **Persistência Local:** Salva estado em localStorage para recuperação

```javascript
// Trecho do sistema de fallback
if (usedFastApi) {
  console.log('[useCart] ⚠️ Endpoint otimizado falhou. Tentando método GraphQL padrão...');
} else {
  console.log('[useCart] ℹ️ Usando GraphQL padrão (endpoint rápido desativado)');
}
```

## Tratamento de Erros

Implementado tratamento abrangente de erros em todas as camadas:

1. **Validação de Dados:** Verifica a integridade dos dados antes de processar
2. **Captura de Exceções:** Todas as operações são envolvidas em try/catch
3. **Feedback Visual:** Notificações ao usuário quando apropriado
4. **Logging:** Registro detalhado de erros para debug

Categorias de erros tratados:
- Erros de rede
- Erros de sessão
- Dados inválidos
- Timeouts
- Race conditions

## API de Monitoramento

O `CartPerformanceDashboard.js` fornece uma interface para monitorar métricas:

```javascript
// Obter relatório de performance
const performanceReport = cartPerformanceMonitor.getPerformanceReport();

// Dados disponíveis
report.averageAddToCartTime     // Tempo médio de adição
report.averageCartUpdateTime    // Tempo médio de atualização
report.slowOperations           // Total de operações lentas
report.criticalOperations       // Total de operações críticas
report.totalOperations          // Total de operações
report.healthScore              // Pontuação geral (0-100)
```

## FAQ

### Por que criamos um endpoint rápido em vez de otimizar o GraphQL?
O GraphQL da WooCommerce tem limitações inerentes de performance devido à complexidade das consultas. Nossa solução com API REST direta reduz o overhead de processamento.

### Como garantir que a contagem do mini-carrinho esteja sempre correta?
Implementamos o método `calculateCartCount()` que:
1. Valida se os produtos são um array válido
2. Usa um loop tradicional para controle de erros
3. Converte e valida cada quantidade como número
4. Ignora valores inválidos com avisos no console

### O que fazer se o sistema apresentar problemas em produção?
1. Verifique o painel de desempenho em `/admin/cart-performance`
2. Use o botão "Força Endpoint Padrão" se necessário
3. Verifique os logs no console para identificar problemas específicos
4. Execute os testes automatizados para validar as correções

### Como o sistema lida com problemas de rede?
1. Timeout ajustado para 10 segundos (configurável)
2. Retry com backoff exponencial
3. Fallback para endpoints alternativos
4. Persistência local do estado

### Como o sistema previne race conditions?
Usando o sistema de bloqueio com IDs de operação exclusivos que garantem que operações no mesmo produto sejam serializadas corretamente.

---

## Documentação da API

### CartContext

```typescript
interface CartContextType {
  cart: CartType | null;
  cartCount: number;
  cartItems: Array<CartItemType>;
  cartTotal: string;
  addToCart: (productId: number, quantity: number, variationId?: number) => Promise<any>;
  removeItemFromCart: (cartKey: string) => Promise<any>;
  updateItemQty: (cartKey: string, quantity: number) => Promise<any>;
  clearCart: () => Promise<any>;
  syncWithServer: () => Promise<any>;
  isCartSyncing: boolean;
  lastAddedProduct: any;
  operationInProgress: boolean;
}
```

### CartPerformanceMonitor

```typescript
interface CartPerformanceMonitorType {
  startMeasurement: (operation: string, productId?: number) => MeasurementType;
  endMeasurement: (measurement: MeasurementType, success?: boolean, errorDetails?: any) => void;
  getPerformanceReport: () => PerformanceReportType;
  resetMetrics: () => void;
  shouldUseFastApi: () => boolean;
}

interface PerformanceReportType {
  averageAddToCartTime: number;
  averageCartUpdateTime: number;
  averageCartRemoveTime: number;
  totalOperations: number;
  slowOperations: number;
  criticalOperations: number;
  lastOperation: OperationType | null;
  operations: Array<OperationType>;
  healthScore: number;
}
```

### CartLockHelpers

```typescript
interface CartLockHelpersType {
  addToCart: <T>(productId: number, callback: () => Promise<T>) => Promise<T>;
  updateCartItem: <T>(cartKey: string, callback: () => Promise<T>) => Promise<T>;
  removeCartItem: <T>(cartKey: string, callback: () => Promise<T>) => Promise<T>;
  clearCart: <T>(callback: () => Promise<T>) => Promise<T>;
}
```
