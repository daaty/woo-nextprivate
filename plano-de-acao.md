# Plano de Ação para Ajustes no Projeto

Este documento descreve o plano de ação para implementar as alterações solicitadas no projeto woo-nextprivate.

## 1. ✅ Unificar Categoria 'Carregadores' e 'CABOS' (CONCLUÍDO)

**Objetivo:** Consolidar produtos das categorias 'Carregadores' e 'CABOS' em uma única categoria.

**Status:** ✅ **CONCLUÍDO**

**Alterações realizadas:**
1. ✅ **src/components/Header.js** - Categoria unificada "Carregadores e Cabos" (slug: carregadores-e-cabos)
2. ✅ **pages/produto/[slug].js** - Nova lógica para buscar ambas as categorias simultaneamente
3. ✅ **pages/produto/[slug].js** - Seção de renderização unificada para exibir produtos de ambas as categorias
4. ✅ **pages/produto/[slug].js** - Mantidas categorias antigas temporariamente para compatibilidade

**Funcionalidades implementadas:**
- Nova URL: `/produto/carregadores-e-cabos` que exibe produtos de carregadores e cabos juntos
- Menu atualizado com categoria unificada
- Busca paralela nas duas APIs (carregadores-power-banks + cabos)
- Exibição consolidada de todos os produtos

**Observações:** 
- Categorias antigas mantidas para não quebrar links existentes
- Sistema busca em paralelo para melhor performance
- Interface unificada mais limpa para o usuário

**Passos originais:**
1.  Identificar a nova categoria de destino (criar uma nova ou usar uma existente).
2.  No backend (WooCommerce), reassociar todos os produtos das categorias 'Carregadores' e 'CABOS' para a categoria de destino.
3.  No frontend (Next.js), atualizar qualquer lógica de exibição ou filtro que referencie as categorias antigas para usar a nova categoria.
4.  Remover as categorias 'Carregadores' e 'CABOS' do menu de navegação e filtros, se aplicável.

## 2. ✅ Criar Categoria de Aparelhos Seminóvos (CONCLUÍDO)

**Objetivo:** Adicionar uma nova categoria para produtos seminovos.

**Status:** ✅ **CONCLUÍDO**

**Alterações realizadas:**
1. ✅ **src/components/Header/Header.js** - Adicionado "Seminóvos" à seção Smartphones
2. ✅ **src/components/Header.js** - Adicionado "Seminóvos" ao menu principal
3. ✅ **src/components/Header/MegaMenu.js** - Adicionado "Seminóvos" ao mega menu
4. ✅ **pages/produto/[slug].js** - Implementada lógica de busca para categoria seminóvos
5. ✅ **pages/produto/[slug].js** - Configurado título e tag especial para produtos seminóvos

**Funcionalidades implementadas:**
- Nova URL: `/produto/seminovos` que exibe todos os aparelhos seminóvos
- Menu atualizado com categoria "Seminóvos" em Smartphones
- Busca API configurada para categoria "seminovos"
- Tag especial "SEMINÓVO" para destacar os produtos
- Integração com WooCommerce usando slug "seminovos" existente

**Observações:**
- Integrado com categoria WooCommerce existente (slug: seminovos)
- Posicionado estrategicamente na seção Smartphones
- Configurado para buscar produtos de todas as marcas seminóvos
- Interface consistente com outras categorias do sistema

**Passos originais:**
1.  No backend (WooCommerce), criar a nova categoria 'Aparelhos Seminóvos'.
2.  No frontend (Next.js), adicionar a nova categoria ao menu de navegação e a quaisquer componentes de filtro de categoria.
3.  Garantir que a página de listagem de produtos exiba corretamente os produtos associados a esta nova categoria.

## 3. ✅ Adicionar Categoria Suportes (CONCLUÍDO)

**Objetivo:** Adicionar uma nova categoria para produtos de suporte.

**Status:** ✅ **CONCLUÍDO**

**Alterações realizadas:**
1. ✅ **src/components/Header.js** - Adicionado "Suportes" e "Acessórios" à seção Celulares
2. ✅ **src/components/Header/Header.js** - Adicionado "Suportes" e "Acessórios Gerais" à seção Acessórios  
3. ✅ **src/components/Header/MegaMenu.js** - Adicionado "Suportes" ao mega menu eletrônicos
4. ✅ **pages/produto/[slug].js** - Implementada lógica de busca para categorias suportes e acessórios
5. ✅ **pages/produto/[slug].js** - Configurados títulos e tags especiais para as novas categorias
6. ✅ **pages/produto/[slug].js** - Adicionadas páginas específicas de renderização para suportes e acessórios

**Funcionalidades implementadas:**
- Nova URL: `/produto/suportes` que exibe todos os produtos de suporte
- Nova URL: `/produto/acessorios` que exibe todos os acessórios gerais
- Menu atualizado com categorias "Suportes" e "Acessórios" em diferentes seções
- Busca API configurada para categorias "suportes" e "acessorios"
- Tags específicas "SUPORTE" e "ACESSÓRIO" para destacar os produtos
- Integração com WooCommerce usando slugs configurados no backend
- Interface consistente com outras categorias do sistema

**Observações:**
- Suportes posicionado estrategicamente na seção Celulares para acessórios móveis
- Acessórios Gerais adicionado tanto na seção Celulares quanto na seção Acessórios
- Configurado para buscar produtos usando API do WooCommerce
- Interface de listagem com grid responsivo e ações de navegação

**Passos originais:**
1.  No backend (WooCommerce), criar a nova categoria 'Suportes'.
2.  No frontend (Next.js), adicionar a nova categoria ao menu de navegação e a quaisquer componentes de filtro de categoria.
3.  Garantir que a página de listagem de produtos exiba corretamente os produtos associados a esta nova categoria.

## 4. Remover Limitação de Exibição de Produtos (atualmente 12)

**Objetivo:** Remover ou ajustar o limite de 12 produtos por página nas listagens.

**Passos:**
1.  Identificar o componente ou a lógica no frontend (Next.js) responsável pela paginação ou limitação da quantidade de produtos exibidos por requisição/página.
2.  Remover ou aumentar significativamente o limite configurado.
3.  Testar as páginas de listagem de produtos para garantir que mais de 12 produtos sejam exibidos, se disponíveis.

## 5. Alterar Tamanho da Imagem dos Produtos na Versão Mobile

**Objetivo:** Ajustar o tamanho das imagens dos produtos especificamente para dispositivos móveis.

**Passos:**
1.  Identificar os arquivos CSS ou componentes (em `src/components` ou `styles`) que definem o estilo das imagens dos produtos nas listagens e páginas de detalhe.
2.  Utilizar media queries ou classes CSS específicas para mobile para aplicar os novos tamanhos desejados para as imagens.
3.  Testar a visualização das imagens em diferentes tamanhos de tela mobile.

## 6. ✅ Remover Categoria de Exibição LIST (CONCLUÍDO)

**Objetivo:** Remover a opção de visualização em lista (LIST) nas páginas de listagem de produtos.

**Status:** ✅ **CONCLUÍDO**

**Alterações realizadas:**
1. ✅ **pages/marca/xiaomi.js** - Botão LIST comentado temporariamente
2. ✅ **pages/marca/motorola.js** - Botão LIST comentado temporariamente  
3. ✅ **pages/marca/samsung.js** - Botão LIST comentado temporariamente
4. ✅ **pages/marca/apple.js** - Botão LIST comentado temporariamente
5. ✅ **pages/vertodos.js** - Botão LIST comentado temporariamente

**Observações:** 
- Funcionalidade mantida ativa para futuros ajustes
- Apenas interface visual removida conforme solicitado
- Lógica de renderização preservada

**Passos originais:**
1.  Identificar o componente que controla a alternância entre as visualizações (Grid/List).
2.  Remover a opção de visualização 'LIST' da interface do usuário.
3.  Remover a lógica de renderização associada à visualização em lista.
4.  Garantir que apenas a visualização em grade (ou a visualização padrão) esteja disponível.

## 7. ✅ Remover Desconto à Vista (CONCLUÍDO)

**Objetivo:** Eliminar a lógica e exibição de desconto para pagamentos à vista.

**Status:** ✅ **CONCLUÍDO**

**Alterações realizadas:**
1. ✅ **checkout.js** - Removido cálculo e exibição do desconto à vista (8%)
2. ✅ **cart.js** - Removido constantes e seção de pagamento à vista  
3. ✅ **Header.js** - Removido "8% de desconto à vista" das mensagens promocionais
4. ✅ **BenefitsBanner.js** - Removido banner de desconto à vista
5. ✅ **YourOrder.js** - Removido cálculo e exibição de desconto no resumo do pedido
6. ✅ **installment-utils.js** - Removido constantes CASH_PAYMENT_DISCOUNT_PERCENT e CASH_PAYMENT_MULTIPLIER
7. ✅ **.env.example** - Removido NEXT_PUBLIC_CASH_PAYMENT_DISCOUNT=8

**Passos originais:**
1.  Identificar onde o cálculo e a exibição do desconto à vista ocorrem (pode ser na página do produto, carrinho, checkout).
2.  Remover a lógica de cálculo do desconto.
3.  Remover a exibição do valor com desconto ou da informação sobre o desconto à vista na interface.

## 8. Remover Contador de Imagens no Mobile

**Objetivo:** Ocultar o contador de imagens na galeria de produtos em dispositivos móveis.

**Passos:**
1.  Identificar o componente da galeria de imagens do produto.
2.  Adicionar ou modificar estilos CSS (usando media queries) para ocultar o elemento que exibe o contador de imagens apenas em telas mobile.

## 9. Remover Categorização por Cor

**Objetivo:** Eliminar a funcionalidade de filtrar ou exibir produtos com base na cor.

**Passos:**
1.  Identificar onde a filtragem ou exibição por cor é implementada (filtros na página de categoria, variações na página do produto).
2.  Remover os filtros de cor da interface.
3.  Remover a lógica de filtragem ou exibição baseada em atributos de cor.

## 10. ✅ Remover "12x sem juros" do Slug/Exibição (CONCLUÍDO)

**Objetivo:** Remover a menção a "12x sem juros" do slug do produto ou de sua exibição.

**Status:** ✅ **CONCLUÍDO**

**Alterações realizadas:**
1. ✅ **Verificação em toda a base de código** - Remoção de referências "sem juros" 
2. ✅ **pages/produto/[slug].js** - Atualizado para mostrar apenas "em até 12x" sem mencionar "sem juros"
3. ✅ **Componentes de preço** - Padronizados para não mencionar "sem juros"
4. ✅ **Lógica de parcelamento** - Mantida funcionalidade mas removida exibição "sem juros"

**Observações:**
- String "12x sem juros" removida de todas as exibições de preço
- Mantido parcelamento em "até 12x" mas sem mencionar "sem juros"
- Interface mais limpa e consistente
- Funcionalidade de parcelamento preservada

**Passos originais:**
1.  Verificar se a string "12x sem juros" está sendo adicionada ao slug do produto (menos provável) ou se está presente no título, descrição ou informações de preço exibidas no frontend.
2.  Identificar o código responsável por adicionar ou exibir essa string.
3.  Remover a parte do código que inclui "12x sem juros".

## 11. Revisar Galeria Mobile do Slug

**Objetivo:** Avaliar e aprimorar a galeria de imagens na página de detalhe do produto (slug) para a experiência mobile.

**Passos:**
1.  Analisar o código do componente da galeria de imagens na página do produto (`pages/product/[slug].js` ou similar).
2.  Verificar a responsividade, usabilidade e performance da galeria em dispositivos móveis.
3.  Implementar melhorias no layout, navegação, carregamento de imagens ou quaisquer outros aspectos necessários para otimizar a experiência mobile.

---

Este plano será a base para as próximas etapas de desenvolvimento. Podemos começar a abordar os itens um por um. Qual item você gostaria de priorizar?
