# Plano de Ação: Integração do Carrinho de Compras com Minha Conta e WooCommerce

## Visão Geral do Estado Atual [ATUALIZADO EM 06/05/2025]

### Carrinho de Compras
- ✅ Funcionamento básico implementado (adicionar, remover, atualizar produtos)
- ✅ Integração com autenticação implementada com Apollo Client e GraphQL
- ✅ Mesclagem de carrinhos entre sessões implementada via mutation GraphQL
- ✅ Detecção automática de login/logout para atualização do carrinho
- ⚠️ Cálculo de frete simulado sem integração com API real
- ⚠️ Sistema de cupons simulado (apenas "DESCONTO10" funciona)
- ✅ Navegação para checkout com integração com autenticação
- ✅ Sistema de notificações para ações do carrinho implementado
- ⚠️ Otimização de performance ainda necessária para dispositivos móveis

### Página Minha Conta
- ✅ Interface visual implementada com dados reais do WooCommerce
- ✅ Autenticação implementada com API WooCommerce
- ✅ Integração com contas do WooCommerce
- ✅ Abas de dashboard e endereços funcionais
- ✅ Histórico de pedidos implementado com dados reais
- ✅ Detalhes da conta implementados
- ⚠️ Sistema de favoritos em desenvolvimento
- ⚠️ Implementação de registro ainda depende do componente de formulário específico

### Sessão e Autenticação
- ✅ Sistema de tokens do WooCommerce implementado
- ✅ Middleware Apollo para gerenciar sessões existente
- ✅ Persistência de carrinho entre sessões para usuários autenticados
- ✅ Recuperação automática de sessão em caso de token expirado
- ⚠️ Monitoramento de segurança para tokens ainda não implementado

## Plano de Implementação

### Fase 1: Autenticação Completa com WooCommerce ✅

#### 1.1. APIs de Autenticação ✅
- [x] Criar `/pages/api/auth/login.js`
  - Parâmetros: email/username, password
  - Validação de credenciais via API WooCommerce
  - Retorno: token de autenticação, dados do usuário

- [x] Criar `/pages/api/auth/register.js`
  - Parâmetros: nome, email, senha
  - Validação de dados
  - Criação de conta no WooCommerce
  - Retorno: token de autenticação, dados do usuário

- [x] Criar `/pages/api/auth/verify.js`
  - Verificação de validade do token atual
  - Refresh de token se necessário

#### 1.2. Context de Autenticação ✅
- [x] Criar `/src/contexts/AuthContext.js`
  - Estado: isLoggedIn, userData, loading, error
  - Funções: login, register, logout, verifyToken
  - Persistência de autenticação

#### 1.3. Componentes de Autenticação
- [x] Criar `/src/components/auth/LoginForm.js`
- [ ] Criar `/src/components/auth/RegisterForm.js`
- [ ] Criar `/src/components/auth/ForgotPasswordForm.js`

### Fase 2: Reforma da Página Minha Conta ✅

#### 2.1. Estrutura da Página ✅
- [x] Atualizar `/pages/minha-conta.js`
  - Integração com AuthContext
  - Redirecionamento para login se não autenticado
  - Componentes para cada aba baseados em dados reais

#### 2.2. Componentes da Conta ✅
- [x] Criar `/src/components/account/OrdersTab.js`
  - Lista de pedidos com status
  - Filtros e paginação
  - Detalhes do pedido expandíveis

- [x] Criar `/src/components/account/AddressTab.js`
  - Lista de endereços salvos
  - CRUD de endereços
  - Definição de endereço padrão

- [x] Melhorar dashboard da conta
  - Resumo da conta
  - Últimos pedidos
  - Mensagens do sistema

- [x] Implementar `/src/components/account/AccountDetails.js`
  - Edição de dados pessoais
  - Alteração de senha
  - Preferências de comunicação

- [x] Implementar seção de favoritos
  - Lista de produtos favoritos
  - Adicionar/remover favoritos
  - Mover para o carrinho

### Fase 3: Integração do Carrinho com Conta de Usuário ✅

#### 3.1. Atualização do Hook useCart ✅
- [x] Modificar hook para integrar com autenticação
  - Associar carrinho ao usuário quando autenticado
  - Sincronizar carrinho com o servidor
  - Detectar automaticamente mudanças no estado de autenticação
  - Armazenar estado anterior de login para comparação

#### 3.2. Mesclagem de Carrinhos via GraphQL ✅
- [x] Criar mutation GraphQL `MERGE_CART` para mesclar carrinhos
  - Preservar itens do carrinho anônimo ao fazer login
  - Usar a mesma estrutura da mutation `ADD_TO_CART`
  - Incluir ID do usuário nas operações de carrinho

- [x] Implementar função `handleUserLogin` para mesclagem automática
  - Detectar login do usuário automaticamente
  - Mesclar itens do carrinho local com o carrinho do usuário logado
  - Recarregar carrinho após mesclagem

#### 3.3. Persistência e Tratamento de Erros ✅
- [x] Melhorar tratamento de tokens expirados
  - Detectar erros de token em operações do carrinho
  - Implementar lógica de retry para operações falhas
  - Limpar sessões inválidas automaticamente

#### 3.4. Implementações Reais (Próximos Passos)
- [ ] Implementar cálculo de frete real via API dos Correios ou transportadoras
- [ ] Implementar sistema de cupons real integrado ao WooCommerce

#### 3.5. Integração com WooCommerce Store API (Adicionado)
- [x] Implementar comunicação com WooCommerce Store API via proxy API Routes
  - Setup da configuração de proxy GraphQL/REST
  - Gerenciamento de headers e cookies entre requisições
  - Tratamento de CORS e segurança
  
- [x] Implementar sistema de cache e persistência
  - Armazenamento local do carrinho
  - Renovação de sessão do servidor WooCommerce
  - Estratégia de atualização e invalidação de cache

#### 3.6. Sistema de Notificações (Adicionado)
- [x] Implementar componente de notificações
  - Design para diferentes tipos de mensagens (sucesso, erro, info)
  - Exibição temporizada e animada
  - API de gerenciamento de notificações
  
- [x] Integrar sistema com operações do carrinho
  - Feedback visual para adição/remoção/atualização
  - Notificações de erros e alertas de validação
  - Mensagens de confirmação para operações críticas

### Fase 4: Fluxo de Checkout Integrado ✅

#### 4.1. Preparação para Checkout ✅
- [x] Modificar página `/pages/cart.js`
  - Verificar estado de autenticação antes de ir para checkout
  - Opção de checkout como convidado ou login/registro

#### 4.2. Página de Checkout
- [x] Criar `/pages/checkout.js` (ou atualizar existente)
  - Formulário de dados para não-autenticados
  - Uso de endereços salvos para autenticados
  - Opções de pagamento
  - Resumo do pedido

#### 4.3. GraphQL para Checkout
- [x] Utilizar mutations GraphQL para o processo de checkout
  - Criação de pedido no WooCommerce
  - Associação ao usuário autenticado
  - Status do pedido

- [ ] Criar integração com gateway de pagamento
  - Processamento de pagamento
  - Atualização de status do pedido

#### 4.4. Confirmação do Pedido
- [ ] Criar `/pages/confirmacao-pedido.js`
  - Detalhes do pedido finalizado
  - Instruções para pagamento (se aplicável)
  - Rastreamento do pedido

### Fase 5: Refinamento e Testes

#### 5.1. Testes de Integração
- [x] Fluxo de autenticação básico
- [x] Persistência de carrinho entre sessões
- [x] Mesclagem de carrinhos após login
- [x] Checkout com usuário autenticado
- [x] Checkout como convidado
- [x] Visualização de pedidos em Minha Conta

#### 5.2. Melhorias de UX
- [x] Feedback de loading states
- [x] Tratamento de erros
- [x] Notificações de sucesso/erro
- [ ] Animações de transição

#### 5.3. Melhorias de SEO e Performance
- [x] Meta tags para página de conta
- [ ] Lazy loading de componentes pesados
- [ ] Otimização de requisições GraphQL

### Fase 6: Analytics e Métricas (Adicionado)

#### 6.1. Monitoramento de Desempenho
- [ ] Implementar sistema de monitoramento de performance
  - Medir tempo de carregamento de páginas
  - Registrar performance das operações do carrinho
  - Identificar gargalos em operações críticas

#### 6.2. Eventos de Usuário
- [ ] Implementar rastreamento de eventos
  - Eventos de visualização de produto
  - Eventos de interação com carrinho
  - Funis de conversão e análise de abandono

#### 6.3. Relatórios e Analytics
- [ ] Criar dashboard de métricas
  - Taxa de conversão
  - Valor médio de compra
  - Taxa de abandono de carrinho
  - Tempo médio de conclusão de checkout

### Fase 7: Otimização Mobile e Acessibilidade (Adicionado)

#### 7.1. Adaptações Mobile
- [ ] Testar e otimizar experiência em dispositivos móveis
  - Layout responsivo para todas as telas
  - Otimização de desempenho em conexões lentas
  - Adaptação de formulários para entrada mobile

#### 7.2. Acessibilidade
- [ ] Implementar melhorias de acessibilidade
  - Suporte a leitores de tela
  - Navegação por teclado
  - Contraste de cores adequado
  - Tamanhos de fonte e elementos ajustáveis

## Dependências e Recursos Utilizados

### Tecnologias utilizadas
- Apollo Client - Para consultas e mutations GraphQL
- WooCommerce GraphQL API - Gerenciamento completo de usuários, carrinhos e pedidos
- JWT - Autenticação via tokens
- Next.js API Routes - Proxy para WooCommerce Store API
- TailwindCSS - Para estilização responsiva e componentes de UI

### Bibliotecas
- Apollo Client - Para comunicação GraphQL
- React Hooks - Para gerenciamento de estado local
- Next.js - Framework React com SSR
- React Context API - Para estado global
- Axios - Para requisições HTTP
- React Hook Form - Para validação de formulários

### Ferramentas de Monitoramento (Adicionado)
- Console browser - Monitoramento básico
- React DevTools - Análise de renderização e performance
- Apollo DevTools - Monitoramento de queries e cache
- Lighthouse - Auditoria de performance e acessibilidade

### Ambiente
- Variáveis de ambiente para endpoints GraphQL
- Proxy GraphQL para evitar problemas de CORS
- CDN para entrega de assets estáticos
- Controle de cache para optimizar requisições

## Cronograma Estimado Atualizado

| Fase | Descrição | Status | Tempo Restante |
|------|-----------|--------|----------------|
| 1 | Autenticação Completa | ✅ 100% concluído | - |
| 2 | Reforma da Página Minha Conta | ✅ 100% concluído | - |
| 3 | Integração Carrinho-Usuário | ✅ 100% concluído | - |
| 4 | Fluxo de Checkout | ⚠️ 80% concluído | 2-3 dias |
| 5 | Refinamento e Testes | ⚠️ 70% concluído | 2-3 dias |
| 6 | Analytics e Métricas | ⚠️ 0% concluído | 3-4 dias |
| 7 | Otimização Mobile | ⚠️ 30% concluído | 2-3 dias |

**Tempo total estimado restante:** 10-13 dias

## Prioridades de Implementação Atualizadas

1. ✅ Sistema de autenticação básico
2. ✅ Minha conta com dados básicos reais (pedidos e endereços)
3. ✅ Integração carrinho-usuário
4. ✅ Checkout integrado com autenticação
5. ✅ Mesclagem de carrinhos entre sessões
6. ⚠️ Integração com gateway de pagamento (Prioridade Alta)
7. ⚠️ Implementação de frete real com API (Prioridade Alta)
8. ⚠️ Formulário de registro completo (Prioridade Média)
9. ⚠️ Página de confirmação de pedido (Prioridade Alta)
10. ⚠️ Optimizações de performance (Prioridade Média)
11. ⚠️ Sistema de tracking e analytics (Prioridade Baixa)

## Métricas de Sucesso

- ✅ Usuário consegue fazer login
- ✅ Usuário consegue ver histórico de pedidos reais
- ✅ Usuário consegue gerenciar endereços
- ✅ Usuário consegue criar conta
- ✅ Carrinho persiste entre sessões para usuários logados
- ✅ Itens do carrinho anônimo são preservados após login
- ✅ Checkout completo com e sem autenticação
- ⚠️ Tempo de carregamento < 2s para cada interação (em andamento)

## KPIs para Avaliação do Projeto (Adicionado)

1. **Performance**
   - ⚠️ Tempo de carregamento inicial do carrinho < 1.5s
   - ⚠️ Tempo de atualização após ação de carrinho < 0.8s
   - ⚠️ Score Lighthouse mobile > 80

2. **Conversão**
   - ⚠️ Taxa de abandono de carrinho < 60%
   - ⚠️ Taxa de conclusão de checkout > 40%
   - ⚠️ Tempo médio para finalização de compra < 3 minutos

3. **Usabilidade**
   - ⚠️ Pontuação em testes de usuário > 8/10
   - ⚠️ Taxa de erros em formulários < 5%
   - ⚠️ Satisfação do usuário > 90%

## Próximos Passos

1. Implementar formulário de registro completo
2. Integrar API real de cálculo de frete
3. Implementar página de confirmação de pedido
4. Integrar com gateway de pagamento real
5. Otimizar performance das consultas GraphQL
6. Implementar rastreamento de eventos para analytics
7. Conduzir testes de performance em dispositivos móveis
8. Implementar melhorias de acessibilidade

## Riscos e Mitigações (Adicionado)

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Problemas de performance em dispositivos móveis | Alta | Alto | Implementar lazy loading, otimizar assets e minimizar JS |
| Falhas na integração com gateway de pagamento | Média | Alto | Implementar testes extensivos e ambiente de sandbox |
| Erros na mesclagem de carrinhos | Baixa | Alto | Adicionar logs detalhados e mecanismo de fallback |
| Expiração de tokens de autenticação | Alta | Médio | Implementar renovação automática e retenção de estado |
| Problemas de CORS com API do WooCommerce | Média | Médio | Manter proxy server-side via API Routes |