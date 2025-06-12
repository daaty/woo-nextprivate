import axios from 'axios';
import util from 'util';
import { calculateShippingRates, checkMelhorEnvioStatus } from '../../../src/services/melhorEnvioApi';

/**
 * Função auxiliar para esperar um determinado tempo
 * @param {number} ms - Tempo em milissegundos para aguardar
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Função para logar objetos de forma mais detalhada
 * @param {string} label - Etiqueta para o log
 * @param {any} obj - Objeto a ser logado
 */
const detailedLog = (label, obj) => {
  console.log(`[${label}]`, typeof obj, obj === null ? 'null' : obj === undefined ? 'undefined' : '');
  try {
    console.log(util.inspect(obj, { depth: null, colors: true }));
  } catch (e) {
    console.log('Não foi possível inspecionar objeto:', e.message);
    console.log('Objeto como string:', String(obj));
  }
};

/**
 * Função para tentar uma operação com retry
 * @param {Function} fn - Função a ser executada
 * @param {Object} options - Opções de configuração
 */
const withRetry = async (fn, options = {}) => {
  const { 
    maxRetries = 3, 
    retryDelay = 1000, 
    retryMultiplier = 2,
    onRetry = () => {} 
  } = options;
  
  let lastError;
  let delayMs = retryDelay;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Executando tentativa ${attempt} de ${maxRetries}...`);
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Adicionar log detalhado para melhor diagnóstico
      console.error(`Erro na tentativa ${attempt}:`, error.message);
      console.error(`Tipo de erro:`, error.name);
      if (error.stack) {
        console.error(`Stack trace:`, error.stack.split('\n').slice(0, 3).join('\n'));
      }
      
      // Se for o último retry, não precisa esperar
      if (attempt < maxRetries) {
        console.log(`Tentativa ${attempt} falhou. Tentando novamente em ${delayMs}ms...`);
        onRetry(error, attempt);
        await sleep(delayMs);
        delayMs *= retryMultiplier; // Backoff exponencial
      }
    }
  }
  
  throw lastError;
};

/**
 * Valores de fallback para frete
 * Usado quando a API está indisponível
 * @param {number} distance - Distância relativa entre CEPs (1-10)
 * @param {number} pesoTotal - Peso total em kg
 * @returns {Array} - Opções de frete com valores de fallback
 */
const getFallbackShippingRates = (distance, pesoTotal = 1) => {
  // Determina a "distância" com base no primeiro dígito do CEP
  // CEPs que começam com números maiores geralmente são mais distantes
  
  // Usar o peso para ajustar valores (peso mínimo 0.3kg)
  const pesoAjustado = Math.max(0.3, pesoTotal);
  const fatorPeso = Math.min(3, pesoAjustado) * 0.8; // Limitar impacto do peso
  
  // Valores base ajustados por distância e peso
  // PAC - mais barato, mais lento
  const valorBasePAC = 15 + (distance * 1.5) + (fatorPeso * 2);
  const valorPAC = parseFloat(valorBasePAC.toFixed(2));
  const prazoPAC = Math.min(14, 3 + distance); // PAC máximo 14 dias
  
  // SEDEX - mais caro, mais rápido
  const valorBaseSEDEX = 25 + (distance * 2.5) + (fatorPeso * 3);
  const valorSEDEX = parseFloat(valorBaseSEDEX.toFixed(2));
  const prazoSEDEX = Math.min(6, 1 + Math.ceil(distance / 3)); // SEDEX máximo 6 dias
  
  return [
    {
      Codigo: '04510',
      Valor: valorPAC.toString().replace('.', ','),
      PrazoEntrega: prazoPAC.toString(),
      ValorSemAdicionais: (valorPAC * 0.9).toFixed(2).replace('.', ','),
      Erro: '0',
      MsgErro: '',
      nome: 'PAC', // Adicionamos o nome para facilitar identificação
      isFallback: true // Marcamos como fallback
    },
    {
      Codigo: '04014',
      Valor: valorSEDEX.toString().replace('.', ','),
      PrazoEntrega: prazoSEDEX.toString(),
      ValorSemAdicionais: (valorSEDEX * 0.9).toFixed(2).replace('.', ','),
      Erro: '0',
      MsgErro: '',
      nome: 'SEDEX', // Adicionamos o nome para facilitar identificação
      isFallback: true // Marcamos como fallback
    }
  ];
};

/**
 * Calcula uma "distância relativa" entre dois CEPs
 * Isso é uma simplificação e não representa distância real,
 * mas serve para gerar valores de frete de fallback razoáveis
 */
const calculateRelativeDistance = (cepOrigem, cepDestino) => {
  // Extrai o primeiro e segundo dígitos do CEP (região e sub-região)
  const regiaoOrigem = parseInt(cepOrigem.substring(0, 2));
  const regiaoDestino = parseInt(cepDestino.substring(0, 2));
  
  // Diferença absoluta entre regiões (0-99)
  let distance = Math.abs(regiaoOrigem - regiaoDestino);
  
  // Normaliza para um valor entre 1-10
  distance = Math.max(1, Math.min(10, Math.ceil(distance / 10)));
  
  // Ajuste para mesma região (CEPs próximos)
  if (regiaoOrigem === regiaoDestino) {
    const subRegiaoOrigem = parseInt(cepOrigem.substring(2, 5));
    const subRegiaoDestino = parseInt(cepDestino.substring(2, 5));
    
    // Se as sub-regiões são próximas, reduz ainda mais a distância
    if (Math.abs(subRegiaoOrigem - subRegiaoDestino) < 100) {
      distance = 1; // Menor distância possível
    }
  }
  
  return distance;
};

/**
 * Calcula frete usando a API do Melhor Envio
 * 
 * @param {Object} params - Parâmetros para cálculo
 * @param {string} params.cepOrigem - CEP de origem
 * @param {string} params.cepDestino - CEP de destino
 * @param {Array} params.produtos - Lista de produtos com dimensões
 * @returns {Promise<Array>} - Opções de frete
 */
const calcularFreteMelhorEnvio = async ({ cepOrigem, cepDestino, produtos }) => {
  console.log('Iniciando cálculo de frete com Melhor Envio:', { cepOrigem, cepDestino });
  
  const token = process.env.MELHORENVIO_TOKEN;
  if (!token) {
    console.warn('MELHORENVIO_TOKEN não configurado no .env.local');
  } else {
    console.log('MELHORENVIO_TOKEN configurado');
  }
  
  try {
    const resultado = await calculateShippingRates({
      zipCodeFrom: cepOrigem,
      zipCodeTo: cepDestino,
      products: produtos,
      // Use sandbox mode para testes; alterar para false em produção
      isSandbox: process.env.MELHORENVIO_SANDBOX === 'true',
      token: token
    });
    
    console.log('Resposta da API Melhor Envio:');
    detailedLog('MELHORENVIO_RESPONSE', resultado);
    
    // Validar resposta
    if (!resultado || !Array.isArray(resultado) || resultado.length === 0) {
      throw new Error('Resposta vazia ou inválida do Melhor Envio');
    }
    
    return resultado;
  } catch (error) {
    console.error('Erro ao calcular frete com Melhor Envio:', error);
    
    if (error.message && error.message.includes('Unauthorized') || error.message.includes('Unauthenticated')) {
      console.error('Erro de autenticação na API do Melhor Envio. Verifique seu token de acesso.');
    }
    
    throw error;
  }
};

/**
 * API Route: Calcula opções de frete usando a API do Melhor Envio
 * Espera receber via POST: { cepDestino, produtos: [{ peso, comprimento, altura, largura, diametro, quantidade }] }
 * Retorna: opções de frete com valores e prazos
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  try {
    // Verificar configuração do Melhor Envio
    const melhorEnvioToken = process.env.MELHORENVIO_TOKEN;
    const useSandbox = process.env.MELHORENVIO_SANDBOX === 'true';
    
    console.log(`Melhor Envio: Modo ${useSandbox ? 'Sandbox' : 'Produção'}, Token ${melhorEnvioToken ? 'Configurado' : 'Não Configurado'}`);
    
    if (!melhorEnvioToken) {
      console.warn('MELHORENVIO_TOKEN não configurado no .env.local - O cálculo pode falhar ou usar valores de fallback');
    }
    
    const { cepDestino, produtos = [] } = req.body;
    // Debug dos dados recebidos
    console.log('Dados recebidos na API:', { cepDestino, produtos });
    
    // Definir CEP de origem com fallback direto aqui, para evitar problemas com variáveis de ambiente
    // Usamos o CEP_ORIGEM do .env se disponível ou um valor padrão
    const cepOrigemEnv = process.env.CEP_ORIGEM || '78515000';
    console.log('CEP de origem do env:', cepOrigemEnv);
    
    // Remove caracteres não numéricos do CEP (como hífen)
    const cepOrigem = cepOrigemEnv.replace(/\D/g, '');
    const cepDestinoLimpo = cepDestino?.replace(/\D/g, '');
    
    console.log('CEPs processados:', { cepOrigem, cepDestinoLimpo });
    
    // Verificar requisitos mínimos
    if (!cepOrigem) {
      console.error('CEP de origem não configurado no .env.local');
      return res.status(400).json({ error: 'CEP de origem não configurado.' });
    }
    
    if (!cepDestinoLimpo) {
      console.error('CEP de destino não informado ou inválido');
      return res.status(400).json({ error: 'CEP de destino inválido.' });
    }
    
    if (!Array.isArray(produtos) || produtos.length === 0) {
      console.error('Produtos não informados ou array vazio');
      return res.status(400).json({ error: 'É necessário informar pelo menos um produto.' });
    }
    
    console.log('Dados válidos para cálculo:', { cepOrigem, cepDestinoLimpo, produtos });
    
    // Somar dimensões e peso dos produtos (simplificação: empacotar tudo junto)
    // Inicializar com valores mínimos aceitos
    let pesoTotal = 0, comprimento = 16, altura = 2, largura = 11, diametro = 0;
    
    try {
      produtos.forEach(prod => {
        // Garantir que todos os valores são numéricos, com fallbacks adequados
        const prodPeso = typeof prod.peso === 'number' ? prod.peso : parseFloat(prod.peso || 0.3);
        const prodComp = typeof prod.comprimento === 'number' ? prod.comprimento : parseFloat(prod.comprimento || 16);
        const prodAlt = typeof prod.altura === 'number' ? prod.altura : parseFloat(prod.altura || 2);
        const prodLarg = typeof prod.largura === 'number' ? prod.largura : parseFloat(prod.largura || 11);
        const prodDiam = typeof prod.diametro === 'number' ? prod.diametro : parseFloat(prod.diametro || 0);
        const qtd = typeof prod.quantidade === 'number' ? prod.quantidade : parseInt(prod.quantidade || 1);
        
        // Calcular dimensões
        pesoTotal += prodPeso * qtd;
        comprimento = Math.max(comprimento, prodComp);
        altura += prodAlt * qtd;
        largura = Math.max(largura, prodLarg);
        diametro = Math.max(diametro, prodDiam);
      });
      
      console.log('Dimensões calculadas:', { pesoTotal, comprimento, altura, largura, diametro });
    } catch (err) {
      console.error('Erro ao processar dimensões dos produtos:', err);
      // Usar valores mínimos se ocorrer algum erro
      pesoTotal = 0.3;
      comprimento = 16;
      altura = 2;
      largura = 11;
      diametro = 0;
    }

    // Valores máximos permitidos
    comprimento = Math.max(16, Math.min(comprimento, 105));
    altura = Math.max(2, Math.min(altura, 105));
    largura = Math.max(11, Math.min(largura, 105));
    pesoTotal = Math.max(0.3, Math.min(pesoTotal, 30));
    
    // Formatar produtos para a API do Melhor Envio
    const produtosMelhorEnvio = produtos.map(prod => {
      // Garantir que todos os valores são numéricos, com fallbacks adequados
      const peso = typeof prod.peso === 'number' ? prod.peso : parseFloat(prod.peso || 0.3);
      const comprimento = typeof prod.comprimento === 'number' ? prod.comprimento : parseFloat(prod.comprimento || 16);
      const altura = typeof prod.altura === 'number' ? prod.altura : parseFloat(prod.altura || 2);
      const largura = typeof prod.largura === 'number' ? prod.largura : parseFloat(prod.largura || 11);
      const quantidade = typeof prod.quantidade === 'number' ? prod.quantidade : parseInt(prod.quantidade || 1);
      
      return {
        peso,
        comprimento,
        altura,
        largura,
        quantidade,
        valor: prod.valor || 10.00 // Valor para seguro
      };
    });
    
    // Chamar a API do Melhor Envio com retry e fallback
    let resultado;
    let usedFallback = false;
    
    try {
      console.log('Iniciando cálculo de frete com a API Melhor Envio...');
        // Verificar status da API do Melhor Envio
      const isApiAvailable = await checkMelhorEnvioStatus(
        process.env.MELHORENVIO_SANDBOX === 'true', 
        process.env.MELHORENVIO_TOKEN
      );
      
      if (!isApiAvailable) {
        console.warn('API do Melhor Envio não disponível. Usando fallback.');
        throw new Error('API do Melhor Envio não disponível');
      }
      
      // Tentar chamar a API com retry
      resultado = await withRetry(
        async () => {
          console.log('Calculando frete com Melhor Envio...');
          
          try {
            return await calcularFreteMelhorEnvio({
              cepOrigem,
              cepDestino: cepDestinoLimpo,
              produtos: produtosMelhorEnvio
            });
          } catch (error) {
            console.error('Erro ao usar API do Melhor Envio:', error);
            throw error;
          }
        },
        {
          maxRetries: 2, // Número máximo de tentativas
          retryDelay: 1000,
          retryMultiplier: 1.5, // Backoff mais suave
          onRetry: (err, attempt) => {
            console.log(`Tentativa ${attempt} de consulta ao Melhor Envio falhou:`, err.message);
          }
        }
      );

      console.log('Resultado do cálculo de frete via Melhor Envio:');
      detailedLog('RESULTADO', resultado);
    } catch (err) {
      console.error('Todas as tentativas de chamar a API do Melhor Envio falharam:', err.message);
      
      // Determinar o motivo da falha para informar ao usuário
      let motivoFallback = 'conexão';
      
      if (err.message && err.message.toLowerCase().includes('timeout')) {
        console.log('Erro por timeout na API do Melhor Envio');
        motivoFallback = 'timeout';
      } else if (err.message && err.message.includes('não disponível')) {
        console.log('API do Melhor Envio não disponível');
        motivoFallback = 'indisponível';
      } else if (err.message && err.message.includes('unauthorized')) {
        console.log('Erro de autorização na API do Melhor Envio');
        motivoFallback = 'autorização';
      }
      
      // Usando valores de fallback
      usedFallback = true;
      const distance = calculateRelativeDistance(cepOrigem, cepDestinoLimpo);
      resultado = getFallbackShippingRates(distance, pesoTotal);
      
      console.log('Usando valores de frete fallback baseados na distância aproximada:', distance);
      console.log('Motivo do fallback:', motivoFallback);
      console.log('Valores fallback:');
      detailedLog('FALLBACK', resultado);
      
      // Adicionar o motivo ao resultado para informar ao usuário
      resultado = resultado.map(item => ({
        ...item,
        motivoFallback: motivoFallback
      }));
    }
    
    // Filtrar e formatar resposta
    let opcoes = [];
    try {
      // Validar que temos um resultado válido
      if (!resultado || !Array.isArray(resultado)) {
        throw new Error('Resultado inválido do cálculo de frete');
      }
      
      opcoes = resultado
        .map(opt => {
          // Verificar se temos um objeto válido
          if (!opt) {
            return null;
          }
          
          // Verificar erros nos serviços
          if (opt.Erro && opt.Erro !== '0') {
            console.log(`Erro no serviço ${opt.Codigo}: ${opt.MsgErro}`);
            return null; // Serviço com erro será filtrado
          }
          
          // Converter valores para números
          let valor = 0;
          try {
            valor = Number((opt.Valor || '0').replace(',', '.'));
          } catch (e) {
            console.error(`Erro ao converter valor ${opt.Valor}:`, e);
            valor = 0;
          }
          
          let valorSemAdicionais = 0;
          try {
            valorSemAdicionais = Number((opt.ValorSemAdicionais || opt.Valor || '0').replace(',', '.'));
          } catch (e) {
            console.error(`Erro ao converter valorSemAdicionais ${opt.ValorSemAdicionais}:`, e);
            valorSemAdicionais = valor;
          }
          
          let prazo = 0;
          try {
            prazo = Number(opt.PrazoEntrega || '7');
          } catch (e) {
            console.error(`Erro ao converter prazo ${opt.PrazoEntrega}:`, e);
            prazo = 7; // Valor padrão se houver erro
          }
          
          return {
            codigo: opt.Codigo || '',
            nome: opt.nome || (opt.Codigo === '04510' ? 'PAC' : opt.Codigo === '04014' ? 'SEDEX' : opt.Codigo || ''),
            valor: valor,
            prazo: prazo,
            valorSemAdicionais: valorSemAdicionais,
            isFallback: usedFallback || opt.isFallback // Indica se estamos usando um valor de fallback
          };
        })
        .filter(opt => opt !== null && opt.codigo); // Remover opções inválidas ou com erro
      
      // Se não temos opções válidas, usar valores de fallback
      if (opcoes.length === 0) {
        console.log('Nenhuma opção de frete válida. Usando fallback.');
        usedFallback = true;
        const distance = calculateRelativeDistance(cepOrigem, cepDestinoLimpo);
        const fallbackOptions = getFallbackShippingRates(distance, pesoTotal);
        
        // Converter fallback para o mesmo formato
        opcoes = fallbackOptions.map(opt => ({
          codigo: opt.Codigo || '',
          nome: opt.nome || (opt.Codigo === '04510' ? 'PAC' : opt.Codigo === '04014' ? 'SEDEX' : opt.Codigo || ''),
          valor: Number((opt.Valor || '0').replace(',', '.')),
          prazo: Number(opt.PrazoEntrega || '7'),
          valorSemAdicionais: Number((opt.ValorSemAdicionais || opt.Valor || '0').replace(',', '.')),
          isFallback: true
        }));
      }
    } catch (err) {
      console.error('Erro ao processar as opções de frete:', err);
      
      // Em caso de qualquer erro, usar fallback
      usedFallback = true;
      const distance = calculateRelativeDistance(cepOrigem, cepDestinoLimpo);
      const fallbackOptions = getFallbackShippingRates(distance, pesoTotal);
      
      // Converter fallback para o formato de saída
      opcoes = fallbackOptions.map(opt => ({
        codigo: opt.Codigo || '',
        nome: opt.nome || (opt.Codigo === '04510' ? 'PAC' : opt.Codigo === '04014' ? 'SEDEX' : opt.Codigo || ''),
        valor: Number((opt.Valor || '0').replace(',', '.')),
        prazo: Number(opt.PrazoEntrega || '7'),
        valorSemAdicionais: Number((opt.ValorSemAdicionais || opt.Valor || '0').replace(',', '.')),
        isFallback: true
      }));
    }
    
    // Retornar as opções de frete disponíveis
    console.log('Opções de frete calculadas:', opcoes);
    
    // Extrair o motivo do fallback do primeiro item, se disponível
    const motivoFallback = usedFallback && opcoes.length > 0 && opcoes[0].motivoFallback 
      ? opcoes[0].motivoFallback 
      : 'conexão';
      
    res.status(200).json({ 
      opcoes, 
      // Adiciona um campo para informar o cliente se estamos usando valores de fallback
      isFallback: usedFallback,
      // Adicionamos o motivo do fallback para mensagens mais específicas no frontend
      motivoFallback: usedFallback ? motivoFallback : null,
      // Timestamp para debug e cache-busting
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao calcular frete:', error);
    
    // Tentar criar uma mensagem de erro mais amigável e informativa
    let mensagemErro = 'Erro ao calcular o frete.';
    
    if (error.message) {
      if (error.message.includes('Melhor Envio')) {
        mensagemErro = 'O serviço do Melhor Envio está temporariamente indisponível. Tente novamente mais tarde.';
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        mensagemErro = 'O serviço de cálculo de frete está demorando para responder. Tente novamente mais tarde.';
      } else if (error.message.includes('CEP')) {
        mensagemErro = 'Verifique se o CEP informado está correto.';
      }
    }
    
    // Mesmo em caso de erro, tentamos fornecer uma estimativa de frete como fallback
    try {
      // Se temos dados mínimos para calcular um fallback
      if (cepOrigem && cepDestinoLimpo) {
        const distance = calculateRelativeDistance(cepOrigem, cepDestinoLimpo);
        const fallbackOptions = getFallbackShippingRates(distance, pesoTotal || 0.3);
        
        // Converter fallback para o formato de saída
        const opcoes = fallbackOptions.map(opt => ({
          codigo: opt.Codigo || '',
          nome: opt.nome || (opt.Codigo === '04510' ? 'PAC' : opt.Codigo === '04014' ? 'SEDEX' : opt.Codigo || ''),
          valor: Number((opt.Valor || '0').replace(',', '.')),
          prazo: Number(opt.PrazoEntrega || '7'),
          valorSemAdicionais: Number((opt.ValorSemAdicionais || opt.Valor || '0').replace(',', '.')),
          isFallback: true,
          motivoFallback: 'erro'
        }));
        
        // Retornar resposta com fallback mesmo em caso de erro
        return res.status(200).json({ 
          opcoes,
          isFallback: true,
          motivoFallback: 'erro',
          error: mensagemErro
        });
      }
    } catch (fallbackError) {
      console.error('Erro ao gerar fallback:', fallbackError);
    }
    
    // Se não conseguimos nem gerar um fallback, retornamos erro
    res.status(500).json({ error: mensagemErro });
  }
}
