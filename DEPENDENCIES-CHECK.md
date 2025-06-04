# 📦 Verificação de Dependências - PagBank Integration

## Dependências Necessárias

Verifique se estas dependências estão instaladas no seu `package.json`:

### Dependências Principais
```json
{
  "dependencies": {
    "@apollo/client": "^3.7.0",
    "graphql": "^16.6.0",
    "next": "^13.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "classnames": "^2.3.2"
  }
}
```

### Instalar Dependências Faltantes

Se alguma dependência estiver faltando, execute:

```bash
# Apollo Client (para GraphQL)
npm install @apollo/client graphql

# Next.js e React (se não estiverem atualizados)
npm install next@latest react@latest react-dom@latest

# Classnames (para classes condicionais)
npm install classnames

# Outras dependências úteis (opcionais)
npm install date-fns # para formatação de datas
npm install js-cookie # para gerenciar cookies
```

### Scripts Recomendados

Adicione estes scripts ao seu `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

## Verificação Rápida

Execute este comando para verificar se tudo está funcionando:

```bash
npm run dev
```

Se houver erros de dependências, instale as que estiverem faltando.

## ✅ Checklist Final

- [ ] Todas as dependências instaladas
- [ ] Variáveis de ambiente configuradas (.env.local)
- [ ] Projeto rodando sem erros
- [ ] Página de checkout acessível (/checkout-v2)
- [ ] Métodos de pagamento carregando
- [ ] Interface responsiva funcionando

## 🚀 Próximo Passo

Acesse: http://localhost:3000/checkout-v2

E teste toda a funcionalidade!