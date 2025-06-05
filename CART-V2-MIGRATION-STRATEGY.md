# 🔄 CART V2 - ESTRATÉGIA DE MIGRAÇÃO

## 📋 **VISÃO GERAL**

Este documento detalha a estratégia completa de migração do sistema de carrinho v1 para v2, garantindo uma transição segura e sem interrupções.

---

## 🎯 **OBJETIVOS DA MIGRAÇÃO**

### **Principais Metas:**
- ✅ **Zero Downtime**: Migração sem interrupção do serviço
- ✅ **Rollback Seguro**: Capacidade de reverter instantaneamente
- ✅ **Data Integrity**: Preservação de todos os dados do carrinho
- ✅ **Performance**: Melhoria imediata na performance
- ✅ **User Experience**: Transição transparente para usuários

---

## 📊 **ESTRATÉGIAS DE ROLLOUT**

### **1. Rollout Gradual (Recomendado)**
```bash
# Configuração padrão
NEXT_PUBLIC_CART_V2_MIGRATION_MODE=gradual
NEXT_PUBLIC_CART_V2_PERCENTAGE=10  # Começar com 10%
```

**Fases do Rollout:**
- **Semana 1**: 10% dos usuários
- **Semana 2**: 25% dos usuários
- **Semana 3**: 50% dos usuários
- **Semana 4**: 75% dos usuários
- **Semana 5**: 100% dos usuários

### **2. Rollout Beta Users**
```bash
# Para usuários específicos
NEXT_PUBLIC_CART_V2_BETA_USERS=true
NEXT_PUBLIC_CART_V2_PERCENTAGE=0
```

### **3. Rollout Imediato**
```bash
# Apenas para ambientes de desenvolvimento/staging
NEXT_PUBLIC_CART_V2_MIGRATION_MODE=immediate
NEXT_PUBLIC_CART_V2_PERCENTAGE=100
```

---

## 🔧 **IMPLEMENTAÇÃO TÉCNICA**

### **Sistema de Feature Flags**

O sistema usa feature flags environment-based para controlar o rollout:

```javascript
// Verificação automática no CartProvider
const useCartVersion = () => {
  const isV2Enabled = process.env.NEXT_PUBLIC_CART_V2_ENABLED === 'true';
  const rolloutPercentage = parseInt(process.env.NEXT_PUBLIC_CART_V2_PERCENTAGE) || 0;
  const isBetaUser = checkBetaUserStatus();
  
  // Lógica de determinação de versão
  if (!isV2Enabled) return 'v1';
  if (isBetaUser) return 'v2';
  
  return isUserInRollout() ? 'v2' : 'v1';
};
```

### **Migração de Dados**

```javascript
// Auto-migração de dados v1 → v2
const migrateCartData = (v1Data) => {
  return {
    items: v1Data.products?.map(product => ({
      id: product.productId,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      image: product.image?.sourceUrl
    })) || [],
    total: parseFloat(v1Data.totalProductsPrice) || 0,
    itemCount: v1Data.totalProductsCount || 0
  };
};
```

---

## 🛡️ **SISTEMA DE FALLBACK**

### **Detecção Automática de Problemas**

```bash
# Configurações de fallback
NEXT_PUBLIC_CART_V2_FALLBACK_ENABLED=true
NEXT_PUBLIC_CART_V2_ERROR_THRESHOLD=5
NEXT_PUBLIC_CART_V2_MONITORING=true
```

### **Triggers de Fallback:**
1. **Error Rate**: > 5 erros consecutivos
2. **API Timeout**: > 5 segundos sem resposta
3. **Performance**: Load time > 3 segundos
4. **User Complaints**: Feedback negativo
5. **Manual Override**: Admin pode forçar rollback

### **Processo de Fallback:**
```javascript
// Fallback automático
const handleCartV2Error = (error) => {
  errorCount++;
  
  if (errorCount >= ERROR_THRESHOLD) {
    console.warn('Cart v2 error threshold reached, falling back to v1');
    localStorage.setItem('cart-fallback-v1', 'true');
    window.location.reload();
  }
};
```

---

## 📈 **MONITORAMENTO E MÉTRICAS**

### **KPIs Principais:**
- **Error Rate**: < 0.1%
- **Response Time**: < 100ms
- **Conversion Rate**: Manter ou melhorar
- **User Satisfaction**: > 95%
- **Performance Score**: > 90

### **Ferramentas de Monitoramento:**
```javascript
// Performance tracking
const trackCartPerformance = (operation, duration) => {
  if (process.env.NEXT_PUBLIC_CART_V2_MONITORING === 'true') {
    analytics.track('cart_v2_performance', {
      operation,
      duration,
      version: 'v2',
      timestamp: new Date().toISOString()
    });
  }
};
```

---

## 🚀 **PLANO DE EXECUÇÃO**

### **Pré-Deploy (Dia -7 a -1)**
- [ ] Backup completo do sistema atual
- [ ] Testes de carga em staging
- [ ] Validação de todos os cenários
- [ ] Treinamento da equipe de suporte
- [ ] Preparação do plano de rollback

### **Deploy Inicial (Dia 0)**
- [ ] Deploy em horário de baixo tráfego
- [ ] Ativação para 10% dos usuários
- [ ] Monitoramento intensivo (primeiras 4 horas)
- [ ] Coleta de feedback inicial
- [ ] Análise de métricas de performance

### **Rollout Progressivo (Semana 1-5)**

#### **Semana 1: 10% → 25%**
- [ ] Análise de dados da primeira semana
- [ ] Correção de bugs críticos (se houver)
- [ ] Aumento para 25% se métricas OK
- [ ] Documentação de issues encontrados

#### **Semana 2: 25% → 50%**
- [ ] Validação de estabilidade
- [ ] Otimizações de performance
- [ ] Aumento para 50% se aprovado
- [ ] Feedback da equipe de CS

#### **Semana 3: 50% → 75%**
- [ ] Análise comparativa v1 vs v2
- [ ] Confirmar melhorias de conversão
- [ ] Aumento para 75%
- [ ] Preparação para rollout completo

#### **Semana 4: 75% → 100%**
- [ ] Validação final de todos os sistemas
- [ ] Rollout completo para 100%
- [ ] Monitoramento crítico 24h
- [ ] Desativação do sistema v1

### **Pós-Deploy (Semana 5+)**
- [ ] Remoção do código legacy v1
- [ ] Documentação final
- [ ] Post-mortem e lessons learned
- [ ] Otimizações adicionais

---

## ⚠️ **CENÁRIOS DE CONTINGÊNCIA**

### **Rollback Parcial**
```bash
# Reduzir percentual
NEXT_PUBLIC_CART_V2_PERCENTAGE=25  # De 50% para 25%
```

### **Rollback Completo**
```bash
# Desabilitar completamente
NEXT_PUBLIC_CART_V2_ENABLED=false
NEXT_PUBLIC_CART_V2_PERCENTAGE=0
```

### **Rollback de Emergência**
```bash
# Script de emergência
node rollback-emergency.js
```

---

## 📋 **CHECKLIST DE MIGRAÇÃO**

### **Pré-Requisitos**
- [ ] Cart v2 100% funcional em staging
- [ ] Todos os testes passando
- [ ] Backup do sistema atual
- [ ] Monitoramento configurado
- [ ] Equipe de suporte treinada

### **Durante a Migração**
- [ ] Monitoramento de métricas em tempo real
- [ ] Logs de erro acompanhados
- [ ] Feedback de usuários coletado
- [ ] Performance tracking ativo
- [ ] Equipe de plantão disponível

### **Pós-Migração**
- [ ] Validação de funcionalidades críticas
- [ ] Análise de métricas de sucesso
- [ ] Documentação de issues
- [ ] Feedback da equipe
- [ ] Planejamento de próximos passos

---

## 📞 **CONTATOS DE EMERGÊNCIA**

### **Equipe Técnica**
- **Tech Lead**: Responsável por decisões técnicas
- **DevOps**: Responsável por deploy e rollback
- **QA**: Validação de funcionalidades
- **CS**: Feedback de usuários

### **Procedimentos de Emergência**
1. **Detectar problema crítico**
2. **Avaliar impacto nos usuários**
3. **Decidir: Fix rápido vs Rollback**
4. **Executar ação imediata**
5. **Comunicar para stakeholders**
6. **Post-mortem após resolução**

---

## 📊 **TEMPLATE DE RELATÓRIO**

### **Relatório Semanal de Migração**

```markdown
## Semana X - Status da Migração Cart v2

**Métricas:**
- Percentual ativo: X%
- Error rate: X%
- Performance: Xms
- Conversão: +/- X%

**Issues encontrados:**
- [ ] Issue 1 - Prioridade Alta
- [ ] Issue 2 - Prioridade Média

**Próximos passos:**
- [ ] Ação 1
- [ ] Ação 2

**Recomendação:**
[ ] Continuar rollout
[ ] Pausar rollout
[ ] Rollback necessário
```

---

## 🎯 **CRITÉRIOS DE SUCESSO**

### **Go/No-Go para Próxima Fase:**
- ✅ Error rate < 0.1%
- ✅ Performance melhor que v1
- ✅ Feedback positivo > 95%
- ✅ Zero issues críticos
- ✅ Métricas de negócio estáveis

### **Critérios de Rollback:**
- ❌ Error rate > 1%
- ❌ Performance pior que v1
- ❌ Feedback negativo > 5%
- ❌ Issues críticos sem solução
- ❌ Impacto na conversão > -2%

---

**Este documento deve ser atualizado conforme a migração progride.**

*Última atualização: 4 de Junho de 2025*
