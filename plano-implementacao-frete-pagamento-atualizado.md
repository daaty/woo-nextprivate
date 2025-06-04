# Plano de Implementação: Frete Correios, Confirmação de Pedido e Pagamento PagBank

## 1. Integração com API real de cálculo de frete (Melhor Envio)

### Etapas
- [x] Instalar biblioteca/configurar SDK para integração com API de frete:
  - Implementado serviço `melhorEnvioApi.js` para cálculo de frete
- [x] Criar rota API Next.js para consumir a biblioteca e retornar opções de frete
- [x] Utilizar variáveis de ambiente (.env) para armazenar dados sensíveis como CEP de origem e tokens
- [x] No frontend, criar componente React para cálculo de frete, enviando CEP e itens do carrinho
- [x] Exibir opções de frete e permitir seleção pelo usuário:
  - Implementada exibição formatada do valor e prazo de entrega separadamente
  - Corrigidos nomes dos serviços de entrega (.Package, .Com)
  - Adicionada ordenação por preço e prazo, priorizando opções gratuitas
- [x] Integrar seleção de frete ao fluxo de checkout e resumo do pedido
- [x] Tratar erros e feedbacks de cálculo de frete (fallback para casos de indisponibilidade)

## 2. Implementar página de confirmação de pedido

### Etapas
- [ ] Criar `/pages/confirmacao-pedido.js`
- [ ] Exibir detalhes do pedido finalizado (produtos, endereço, frete, pagamento)
- [ ] Exibir instruções de pagamento (boleto, pix, cartão) conforme método escolhido
- [ ] Exibir status do pedido e botão para rastreamento (se aplicável)
- [ ] Integrar com API para buscar detalhes do pedido pelo ID
- [ ] Garantir responsividade e boa experiência mobile

## 3. Integração com gateway de pagamento real (PagBank via pagseguro-nodejs)

### Etapas
- [ ] Instalar a biblioteca pagseguro-nodejs como dependência do projeto:
  - `npm install pagseguro-nodejs`
  - Adicionar ao `package.json`
- [ ] Criar rota API Next.js `/pages/api/payment/process.js` para processar pagamentos usando a biblioteca
- [ ] Utilizar variáveis de ambiente (.env) para armazenar dados sensíveis como tokens, e-mails e chaves do PagBank
- [ ] No frontend, criar componente React para seleção e preenchimento dos métodos de pagamento (cartão, pix, boleto)
- [ ] Enviar dados do pagamento para a rota criada e tratar resposta (sucesso, erro, instruções)
- [ ] Exibir QR Code, link de boleto ou confirmação de cartão conforme resposta da API
- [ ] Atualizar status do pedido no WooCommerce após confirmação do pagamento
- [ ] Implementar ambiente de testes (sandbox) antes de ir para produção

---

**Observações:**
- Todos os dados sensíveis (tokens, credenciais, CEP de origem, etc.) devem ser importados via variáveis de ambiente (.env) para garantir segurança e flexibilidade
- Garantir tratamento de erros e feedbacks claros ao usuário em todas as etapas
- Validar dados sensíveis (cartão, CPF, CEP) no frontend e backend
- Documentar endpoints e fluxos para facilitar manutenção futura
