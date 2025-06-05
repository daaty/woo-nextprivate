# Cart v2 - Sistema Simplificado

## Status Atual

O sistema Cart v2 foi simplificado com sucesso e está funcionando corretamente. A simplificação removeu o complexo sistema de sincronização de sessão que estava causando problemas, substituindo-o por um sistema simples baseado em localStorage.

## Principais Mudanças

1. **Simplificação do CartProvider**
   - Removido o mecanismo complexo de sincronização (`sessionSync.js`)
   - Implementado gerenciamento básico de ID de sessão usando localStorage
   - Simplificadas as chamadas de API com função centralizada

2. **Criado Componente MiniCartCounter**
   - Desenvolvido componente simples que usa o contexto do Cart v2
   - Exibe o contador de itens do carrinho como badge
   - Adicionado indicador de carregamento para melhor UX

3. **Componente de Integração**
   - Desenvolvido `CartIconWithV2Counter` como ponte entre sistemas
   - Garantida compatibilidade com o componente Link do Next.js
   - Adicionados labels aria para acessibilidade

4. **Referências de Rota Corrigidas**
   - Atualizado `Header.js` para remover referências a `/carrinho`
   - Garantido que todos os links apontam para `/cart`

5. **API Simplificada**
   - Simplificado `api/v2/cart/index.js` para remover gerenciamento complexo de sessão
   - Criado script de teste para verificar funcionalidades

## Como Testar

1. **Teste Automatizado**
   - Acesse http://localhost:3000/test-cart-v2.html
   - Clique no botão "Executar Teste"
   - Verifique os resultados no painel abaixo

2. **Teste Manual**
   - Acesse qualquer página do site
   - Navegue até um produto e adicione-o ao carrinho
   - Verifique se o contador do carrinho é atualizado
   - Vá para a página de carrinho e verifique se o produto foi adicionado
   - Teste o checkout completo para garantir que tudo funciona corretamente

## Próximos Passos

1. **Monitorar Desempenho**
   - Monitorar o desempenho do sistema simplificado em produção
   - Verificar se há algum impacto no tempo de carregamento ou no uso de memória

2. **Estender Funcionalidades**
   - Adicionar animações ao contador do carrinho para melhor feedback visual
   - Implementar persistência de carrinho entre sessões/dispositivos
   - Melhorar a integração com o sistema de usuários

## Arquivos Principais

- `src/v2/cart/context/CartProvider.js` - Provedor de contexto simplificado
- `src/v2/cart/components/MiniCartCounter.js` - Componente de contador
- `src/components/cart/CartIconWithV2Counter.js` - Integração com o layout
- `pages/api/v2/cart/index.js` - API REST do carrinho
- `pages/api/v2/cart/clear.js` - API para limpar o carrinho

## Resumo Técnico

O sistema Cart v2 simplificado agora utiliza um ID de sessão armazenado no localStorage do navegador para identificar cada carrinho. Este ID é gerado na primeira visita do usuário e mantido entre visitas. As chamadas de API foram simplificadas para usar esse ID nas requisições, eliminando a complexidade anterior de sincronização entre múltiplas guias/dispositivos.

O estado do carrinho é gerenciado através de um contexto React que fornece os dados e métodos necessários para interagir com o carrinho. O componente MiniCartCounter usa este contexto para mostrar o número de itens no carrinho em tempo real.
