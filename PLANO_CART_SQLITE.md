# Plano de Ação: Persistência do Carrinho (Cart V2) com SQLite

## 1. Diagnóstico do Sistema Atual

- O Cart V2 utiliza um sessionId salvo no localStorage do navegador (`cart_v2_session_id`).
- O sessionId é enviado em todas as requisições para `/api/v2/cart` via header `X-Cart-Session-Id`.
- O backend armazena os carrinhos em memória RAM usando `global.cartStorageV2`, indexado pelo sessionId.
- **Problema:** Se o servidor Node.js reinicia ou há múltiplos processos, os carrinhos são perdidos. Não há persistência real.

---

## 2. Objetivo

Implementar persistência real do carrinho usando SQLite, garantindo que o carrinho do usuário não seja perdido após reinício do servidor ou em ambientes com múltiplos processos.

---

## 3. Passos para Implementação

### a) Instalar dependência SQLite
```powershell
npm install better-sqlite3
```

### b) Criar módulo de persistência
- Criar `lib/cart-storage.js` com funções para:
  - Buscar carrinho por sessionId
  - Salvar/atualizar carrinho por sessionId
  - Remover carrinho (opcional)
- Estrutura da tabela:
  - `session_id` (PRIMARY KEY)
  - `cart_data` (JSON)
  - `updated_at` (timestamp)

### c) Refatorar endpoint `/api/v2/cart/index.js`
- Substituir todo acesso a `global.cartStorageV2` pelas funções do SQLite.
- Toda leitura/escrita de carrinho deve passar pelo SQLite.

### d) Fluxo de uso
- Ao receber requisição, buscar carrinho no SQLite usando sessionId.
- Ao adicionar/atualizar/remover itens, salvar o carrinho atualizado no SQLite.
- Retornar sempre o estado mais recente do carrinho para o usuário.

### e) Testes
- Testar localmente: adicionar, atualizar, remover itens do carrinho e reiniciar o servidor para garantir persistência.
- Testar em produção/VPS: garantir que múltiplos processos compartilham o mesmo banco.

---

## 4. Benefícios
- Carrinho persiste mesmo após reiniciar o servidor.
- Funciona com múltiplos processos Node.js.
- Simples de fazer backup e migrar.
- Não depende de cookies, apenas do sessionId já usado.

---

## 5. Próximos Passos
1. Instalar o pacote `better-sqlite3`.
2. Criar o arquivo `lib/cart-storage.js` com as funções de persistência.
3. Refatorar `/api/v2/cart/index.js` para usar o SQLite.
4. Testar localmente e depois na VPS.
5. (Opcional) Implementar limpeza automática de carrinhos antigos.

---

**Pronto para iniciar a implementação!**
