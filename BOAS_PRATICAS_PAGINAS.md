# Boas Práticas para Implementação de Novas Páginas

## O que fazer

- **Sempre reutilize a API interna `/api/products` para buscar produtos**
  - Use parâmetros como `category`, `on_sale`, `featured` e, futuramente, `brand`.
  - Exemplo: `/api/products?category=apple&per_page=20`
- **Aproveite os componentes e lógica já existentes**
  - Use componentes como ProductCard, ProductGrid, CountdownOffers, etc.
  - Utilize funções utilitárias de formatação de preço, imagem, etc.
- **Centralize a lógica de busca e processamento de produtos no backend**
  - Toda a lógica de GraphQL deve estar em `/api/products.js`.
  - Só altere a query se realmente precisar de um filtro novo.
- **No frontend, apenas adapte os parâmetros conforme a necessidade da página**
  - Não duplique lógica de busca, formatação ou exibição.
- **Mantenha o padrão de consumo de API via fetch**
  - Exemplo:
    ```js
    useEffect(() => {
      setLoading(true);
      setError(null);
      fetch('/api/products?category=apple&per_page=20')
        .then(async (res) => {
          if (!res.ok) throw new Error(`API retornou status ${res.status}`);
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : data.products || []);
        })
        .catch((err) => {
          setError(err.message);
          setProducts([]);
        })
        .finally(() => setLoading(false));
    }, []);
    ```
- **Se precisar de novo filtro (ex: brand), implemente primeiro no backend**
  - Só depois adapte o frontend para consumir o novo parâmetro.

## O que NÃO fazer

- **Não crie endpoints ou lógicas duplicadas para busca de produtos**
  - Não use REST diretamente no frontend, nem crie novas rotas desnecessárias.
- **Não busque produtos diretamente via GraphQL no frontend**
  - Sempre use a API interna para manter o padrão e facilitar manutenção.
- **Não duplique lógica de formatação, preço, imagem, etc.**
  - Use as funções e componentes utilitários já existentes.
- **Não altere a estrutura de resposta da API sem necessidade**
  - Mantenha o formato esperado pelos componentes.
- **Não misture abordagens REST e GraphQL no frontend**
  - Padronize sempre pelo uso da API interna.

## Observações

- Quando o backend suportar filtro por marca, basta ajustar a query em `/api/products.js`.
- Se precisar de novo tipo de filtro, centralize a lógica no backend antes de alterar o frontend.
- Consulte sempre os arquivos de queries e mutations em `src/queries` e `src/mutations` antes de criar algo novo.

---

**Seguindo essas práticas, evitamos retrabalho, bugs e garantimos manutenção fácil e padronizada do projeto.**
