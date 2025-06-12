// Script para testar a API dos Correios diretamente
const { calcularPrecoPrazo } = require('correios-brasil');
const util = require('util');

// Configurar a exibição de objetos
const detailedLog = (label, obj) => {
  console.log(`\n[${label}]`);
  try {
    console.log(util.inspect(obj, { depth: null, colors: true }));
  } catch (e) {
    console.log('Erro ao inspecionar objeto:', e.message);
    console.log('Objeto como string:', String(obj));
  }
};

// Parâmetros de teste - mesmos valores usados na API
const params = {
  sCepOrigem: '78515000',
  sCepDestino: '78455000',
  nVlPeso: '0.30',
  nCdFormato: '1', // caixa/pacote
  nVlComprimento: '16',
  nVlAltura: '4',
  nVlLargura: '11',
  nVlDiametro: '0',
  nCdServico: ['04510', '04014'],  // PAC e SEDEX
  nVlValorDeclarado: '0',
  sCdMaoPropria: 'N',
  sCdAvisoRecebimento: 'N',
};

console.log('Iniciando teste da API dos Correios');
console.log('Versão da biblioteca correios-brasil:', require('correios-brasil/package.json').version);
console.log('Parâmetros:', params);

// Função para fazer uma chamada direta à API dos Correios usando axios
const calcularFreteDireto = async (params) => {
  console.log('\nTestando método alternativo com chamada direta à API...');
  
  // Precisamos do axios para fazer a requisição
  const axios = require('axios');
  
  // URL base para o serviço de frete dos Correios
  const url = 'http://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx';
  
  // Preparar os parâmetros
  const servicos = Array.isArray(params.nCdServico) ? params.nCdServico.join(',') : params.nCdServico;
  
  // Montar os parâmetros da requisição
  const queryParams = new URLSearchParams({
    nCdEmpresa: '',
    sDsSenha: '',
    nCdServico: servicos,
    sCepOrigem: params.sCepOrigem,
    sCepDestino: params.sCepDestino,
    nVlPeso: params.nVlPeso,
    nCdFormato: params.nCdFormato,
    nVlComprimento: params.nVlComprimento,
    nVlAltura: params.nVlAltura,
    nVlLargura: params.nVlLargura,
    nVlDiametro: params.nVlDiametro,
    sCdMaoPropria: params.sCdMaoPropria,
    nVlValorDeclarado: params.nVlValorDeclarado,
    sCdAvisoRecebimento: params.sCdAvisoRecebimento,
    StrRetorno: 'xml',
    nIndicaCalculo: 3
  });
  
  const requestUrl = `${url}?${queryParams.toString()}`;
  
  console.log('URL da requisição direta:', requestUrl);
  
  try {
    const response = await axios.get(requestUrl, {
      timeout: 15000, // 15 segundos
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro na chamada direta:', error.message);
    throw error;
  }
};

// Função para calcular o frete com timeout
const calcularFreteComTimeout = (params) => {
  return new Promise((resolve, reject) => {
    // Timeout para evitar que a promessa fique pendente eternamente
    const timeout = setTimeout(() => {
      reject(new Error('Timeout ao aguardar resposta da API dos Correios'));
    }, 25000); // 25 segundos (aumentado de 20s para 25s)
    
    try {
      calcularPrecoPrazo(params)
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(err => {
          clearTimeout(timeout);
          
          // Verificar se é o erro específico que estamos tentando resolver
          if (err.message && err.message.includes('Cannot read properties of undefined')) {
            console.log('\n⚠️ Encontrado o erro específico "Cannot read properties of undefined"');
            console.log('Tentando método alternativo com chamada direta...');
            
            // Tente com o método alternativo
            calcularFreteDireto(params)
              .then(xmlResult => {
                console.log('\n✅ Chamada direta funcionou! Resultado XML:');
                console.log(xmlResult.substring(0, 500) + '...');
                resolve({ directApiWorked: true, xmlResult });
              })
              .catch(directErr => {
                console.error('\n❌ Método alternativo também falhou:', directErr.message);
                reject(err);
              });
            
            return; // Importante retornar para não executar o reject abaixo
          }
          
          reject(err);
        });
    } catch (err) {
      clearTimeout(timeout);
      reject(err);
    }
  });
};

// Executar o teste
(async () => {
  console.log('\nExecutando chamada para calcularPrecoPrazo...');
  
  try {
    console.time('API Correios');
    const resultado = await calcularFreteComTimeout(params);
    console.timeEnd('API Correios');
    
    console.log('\n✅ Chamada bem-sucedida!');
    
    // Verificar resposta
    detailedLog('RESULTADO COMPLETO', resultado);
    
    // Validar se a resposta é um array
    if (!Array.isArray(resultado)) {
      console.error('⚠️ ALERTA: Resposta não é um array!');
      console.log('Tipo da resposta:', typeof resultado);
    } else {
      console.log(`\nRecebido array com ${resultado.length} itens`);
      
      // Verificar cada item individualmente
      resultado.forEach((item, index) => {
        console.log(`\n--- Item ${index + 1} ---`);
        if (!item) {
          console.log('❌ Item inválido (null ou undefined)');
        } else {
          console.log('Código:', item.Codigo);
          console.log('Valor:', item.Valor);
          console.log('Prazo:', item.PrazoEntrega);
          console.log('Erro:', item.Erro);
          if (item.Erro !== '0') {
            console.log('Mensagem de erro:', item.MsgErro);
          }
        }
      });
    }
  } catch (error) {
    console.log('\n❌ Erro na chamada da API:');
    console.error(error);
    
    // Verificar detalhes específicos do erro
    if (error.message && error.message.includes('Cannot read properties of undefined')) {
      console.log('\n⚠️ Este é o mesmo erro observado na aplicação!');
      console.log('Isso geralmente acontece quando o site dos Correios muda seu HTML ou está indisponível.');
    }
    
    if (error.response) {
      console.log('\nDetalhes da resposta:');
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
      
      if (error.response.data) {
        const dataStr = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data);
          
        console.log('Primeiros 500 caracteres dos dados:', dataStr.substring(0, 500));
      }
    }
  }
})();
