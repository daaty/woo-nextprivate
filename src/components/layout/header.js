import { gql } from "@apollo/client";

const GET_COUNTRIES = gql`
  query {
    countries
  }
`;

export default GET_COUNTRIES;

// Modifique para adicionar categorias, barra de busca, 
// ícones de usuário e carrinho como no mibrasil.com.br