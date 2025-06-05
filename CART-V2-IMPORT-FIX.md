# Cart V2 Import Structure Fix

## Problema Identificado
O sistema Cart v2 estava apresentando um erro de servidor relacionado a tipos inválidos de componentes React, especificamente no `_document.js`:

```
Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined.
```

## Causa Raiz
Havia uma inconsistência na forma como o `CartProvider` estava sendo exportado e importado em diferentes arquivos do projeto:

1. Em `CartProvider.js`, tínhamos apenas export default e export da função useCartV2
2. Em `_app.js`, estávamos importando como `{ CartProvider as CartV2Provider }`
3. Outros componentes usavam `useCartV2` como uma importação nomeada

Essa inconsistência causava problemas durante a renderização no servidor (SSR).

## Solução Implementada

1. **Atualizado `CartProvider.js`**:
   - Mantido o export default
   - Adicionado export nomeado adicional: `export { CartV2Provider as CartProvider }`
   - Mantido o export de `useCartV2`

2. **Corrigido `_app.js`**:
   - Alterada a importação para usar o export default: `import CartV2Provider from '../src/v2/cart/context/CartProvider'`

3. **Script de Teste**:
   - Criado `test-cart-v2-imports.js` para validar as importações

## Como Testar

1. Execute o servidor de desenvolvimento:
   ```
   npm run dev
   ```

2. Verifique se não há erros de console relacionados ao CartProvider

3. Navegue até `/cart` e verifique se o contador do carrinho é exibido corretamente

## Próximos Passos

- Teste adicional para garantir que a integração com outras partes do sistema continua funcionando
- Considerar a padronização das exportações em todo o projeto para evitar problemas semelhantes
