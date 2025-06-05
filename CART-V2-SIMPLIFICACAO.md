# Cart v2 Simplificação - Relatório de Restauração

## 🔄 Contexto do Problema

O sistema Cart v2 tinha sido modificado com uma complexa camada de sincronização de sessão que estava causando problemas de funcionamento para o usuário. A solução anterior implementava:

- Sistema global de sessão com `_globalSessionId`
- Sincronização entre abas usando `sessionSync.js`
- Detecção de mudanças de foco da janela
- Headers de sincronização nas respostas da API
- Lógica complexa de cleanup de cookies antigos

Todas essas mudanças acabaram quebrando o sistema Cart v2 que funcionava anteriormente.

## ✅ Solução Implementada

Restauramos o sistema para uma versão mais simples e funcional:

1. **Simplificação do Gerenciamento de Sessão**:
   - Removemos o complexo sistema `sessionSync.js`
   - Substituímos por um sistema simples de sessão usando localStorage
   - Mantivemos apenas uma chave `cart_v2_session_id` para persistência

2. **Simplificação da API**:
   - Restauramos a API para uma versão simples sem rate limiting complexo
   - Removemos a lógica de sync headers e validação excessiva
   - Mantivemos as correções de formatação de preço brasileiro

3. **Implementação do MiniCartCounter**:
   - Adicionamos um simples contador para o mini cart
   - Integramos com o Nav.js através de um componente CartIconWithV2Counter
   - Mantivemos compatibilidade com o sistema existente

4. **Limpeza de Componentes**:
   - Ajustamos o AddToCartButton para usar o sistema simplificado
   - Removemos referências ao sistema de sincronização complexo

## 🔧 Arquivos Modificados

1. `src/v2/cart/context/CartProvider.js` - Substituído pela versão simplificada
2. `src/v2/cart/components/MiniCartCounter.js` - Criado para contagem simples
3. `src/components/cart/CartIconWithV2Counter.js` - Criado para integração
4. `src/components/Nav.js` - Atualizado para usar o novo contador
5. `pages/api/v2/cart/index.js` - Simplificado para funcionamento básico

## 📋 Instruções de Uso

Para usar o sistema Cart v2 simplificado:

1. Adicione a integração do contador onde necessário:
```jsx
import CartIconWithV2Counter from './components/cart/CartIconWithV2Counter';
// ...
<CartIconWithV2Counter />
```

2. Use o botão AddToCartButtonV2 para adicionar produtos:
```jsx
import AddToCartButtonV2 from '../v2/cart/components/AddToCartButton';
// ...
<AddToCartButtonV2 
  product={product} 
  quantity={1}
  showModal={true}
/>
```

## 🚀 Próximos Passos

1. Testar o sistema restaurado em várias páginas de produto
2. Verificar se a contagem no mini cart é atualizada corretamente
3. Testar o fluxo completo de compra com Cart v2
4. Monitorar logs para qualquer erro relacionado ao Cart v2

---

**Nota:** Esta implementação simplificada fornece toda a funcionalidade necessária sem a complexidade que estava causando problemas. O sistema agora usa um modelo de sessão simples baseado em localStorage que funciona bem em navegadores modernos.
