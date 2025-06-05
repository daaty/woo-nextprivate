# Melhoria nos Botões "Adicionar ao Carrinho"

## Descrição

Implementação de melhorias nos botões "Adicionar ao Carrinho" do componente `CountdownOffers`, aplicando a mesma funcionalidade e estilização dos botões da página principal que já funcionavam corretamente.

## Alterações Realizadas

1. **Atualização do Componente `CountdownOffers.js`**:
   - Adicionada funcionalidade completa de adição ao carrinho usando a API REST v2
   - Implementada lógica de extração de dados do produto diretamente do componente
   - Adicionados estados visuais de feedback (loading, sucesso, erro)
   - Implementadas animações para melhorar a experiência do usuário

2. **Atualização do CSS (`CountdownOffers.module.css`)**:
   - Adicionadas animações keyframe para os diferentes estados do botão
   - Corrigido problema de compatibilidade com a propriedade `line-clamp`
   - Mantida a consistência visual com os outros botões do site

## Funcionalidades Implementadas

O botão "Adicionar ao Carrinho" agora possui as seguintes funcionalidades:

- **Estado de Loading**: Mostra um spinner animado enquanto a requisição está em andamento
- **Estado de Sucesso**: Exibe um ícone de checkmark verde quando o produto é adicionado com sucesso
- **Estado de Erro**: Mostra um ícone X vermelho quando ocorre algum erro
- **Integração com API v2**: Utiliza a API REST v2 para adicionar produtos ao carrinho
- **Feedback Tátil**: Vibração do dispositivo móvel ao adicionar produto com sucesso (quando suportado)
- **Notificações**: Integração com o sistema de notificações existente
- **Atualização do Contador**: Dispara eventos para atualizar o contador do carrinho no layout

## Dados do Produto

Os botões agora incluem atributos de dados (data attributes) com informações do produto:

```html
<button 
  data-product-id="123"
  data-product-name="Nome do Produto"
  data-product-price="299,90"
  data-product-image="url_da_imagem.jpg"
>
  Adicionar ao Carrinho
</button>
```

## Eventos Disparados

O botão dispara os seguintes eventos personalizados:

1. `cartUpdated`: Quando o produto é adicionado com sucesso ao carrinho
2. `productAddedToCart`: Evento específico para atualização do contador do layout

## Comportamento Visual

1. **Clique Inicial**: 
   - O botão mostra um spinner de carregamento
   - O botão é desabilitado para evitar múltiplos cliques

2. **Adição com Sucesso**:
   - O botão muda para verde com degradê
   - Exibe um ícone de checkmark branco
   - Após 2 segundos, retorna ao estado original

3. **Erro na Adição**:
   - O botão muda para vermelho com degradê
   - Exibe um ícone X branco
   - Após 2 segundos, retorna ao estado original

## Compatibilidade

A implementação é compatível com:
- Diferentes navegadores modernos
- Dispositivos móveis e desktop
- Sistema de notificações existente
- Contador de carrinho global

---

Documentação criada em 04 de junho de 2025.
