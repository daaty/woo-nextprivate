import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../src/components/Layout';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '../src/utils/format';
import { useNotification } from '../src/components/ui/Notification';
import client from '../src/components/ApolloClient';
import { GET_ORDER } from '../src/queries/get-order';

/**
 * Página de confirmação de pedido
 * Exibe detalhes do pedido recém-finalizado, status, informações de envio e pagamento
 */
const ConfirmacaoPedido = () => {
  const router = useRouter();
  const { notification } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const { id: orderId } = router.query;

  // Buscar detalhes do pedido pelo ID
  useEffect(() => {
    if (orderId) {
      setIsLoading(true);
      setError(null);
      
      // Tentar buscar o pedido da API WooCommerce
      client.query({
        query: GET_ORDER,
        variables: { id: orderId },
      })
      .then(({ data }) => {
        if (data?.order) {
          const orderData = formatOrderData(data.order);
          setOrder(orderData);
          console.log('Dados do pedido carregados:', orderData);
        } else {
          throw new Error('Pedido não encontrado');
        }
      })
      .catch(err => {
        console.error('Erro ao buscar pedido:', err);
        setError('Não foi possível carregar os detalhes do pedido. Por favor, tente novamente mais tarde.');
        
        // Carregar dados de demonstração caso estejamos em ambiente de desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          loadDemoOrder();
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
    } else if (process.env.NODE_ENV === 'development' && !orderId) {
      // Carregar dados de demonstração em desenvolvimento quando não há ID
      loadDemoOrder();
    }
  }, [orderId]);
  
  // Função para carregar dados de demonstração durante desenvolvimento
  const loadDemoOrder = () => {
    // Dados de exemplo para visualização inicial
    const demoOrder = {
      id: orderId,
      status: 'processing',
      statusLabel: 'Processando',
      date: '15/05/2025',
      customerName: 'João Silva',
      total: 1250.90,
      paymentMethod: 'pix',
      paymentStatus: 'pending',
      paymentLabel: 'Aguardando pagamento',
      billing: {
        firstName: 'João',
        lastName: 'Silva',
        address1: 'Rua Exemplo, 123',
        address2: 'Apto 45',
        city: 'São Paulo',
        state: 'SP',
        postcode: '01310-000',
        country: 'BR',
        email: 'joao@example.com',
        phone: '(11) 98765-4321',
      },
      shipping: {
        firstName: 'João',
        lastName: 'Silva',
        address1: 'Rua Exemplo, 123',
        address2: 'Apto 45',
        city: 'São Paulo',
        state: 'SP',
        postcode: '01310-000',
        country: 'BR',
      },
      shippingMethod: 'Correios Express',
      shippingCost: 21.90,
      deliveryEstimate: '3-5 dias úteis',
      products: [
        {
          id: 123,
          name: 'Smartphone XYZ',
          quantity: 1,
          price: 999.00,
          total: 999.00,
          image: '/placeholder/product-1.jpg',
        },
        {
          id: 456,
          name: 'Fone de Ouvido Bluetooth',
          quantity: 2,
          price: 129.95,
          total: 259.90,
          image: '/placeholder/product-2.jpg',
        },
      ],
    };

    setOrder(demoOrder);
    setIsLoading(false);
  };

  // Função para formatar dados do pedido vindos da API WooCommerce
  const formatOrderData = (apiOrder) => {
    // Mapear os dados da API para o formato que a UI espera
    return {
      id: apiOrder.orderId || apiOrder.databaseId,
      status: apiOrder.status || 'processing',
      statusLabel: getStatusLabel(apiOrder.status),
      date: new Date(apiOrder.date).toLocaleDateString('pt-BR'),
      customerName: `${apiOrder.billing?.firstName || ''} ${apiOrder.billing?.lastName || ''}`.trim(),
      total: parseFloat(apiOrder.total || 0),
      paymentMethod: apiOrder.paymentMethod || 'default',
      paymentStatus: apiOrder.isPaid ? 'completed' : 'pending',
      paymentLabel: apiOrder.isPaid ? 'Pago' : 'Aguardando pagamento',
      billing: {
        firstName: apiOrder.billing?.firstName || '',
        lastName: apiOrder.billing?.lastName || '',
        address1: apiOrder.billing?.address1 || '',
        address2: apiOrder.billing?.address2 || '',
        city: apiOrder.billing?.city || '',
        state: apiOrder.billing?.state || '',
        postcode: apiOrder.billing?.postcode || '',
        country: apiOrder.billing?.country || 'BR',
        email: apiOrder.billing?.email || '',
        phone: apiOrder.billing?.phone || '',
      },
      shipping: {
        firstName: apiOrder.shipping?.firstName || apiOrder.billing?.firstName || '',
        lastName: apiOrder.shipping?.lastName || apiOrder.billing?.lastName || '',
        address1: apiOrder.shipping?.address1 || apiOrder.billing?.address1 || '',
        address2: apiOrder.shipping?.address2 || apiOrder.billing?.address2 || '',
        city: apiOrder.shipping?.city || apiOrder.billing?.city || '',
        state: apiOrder.shipping?.state || apiOrder.billing?.state || '',
        postcode: apiOrder.shipping?.postcode || apiOrder.billing?.postcode || '',
        country: apiOrder.shipping?.country || apiOrder.billing?.country || 'BR',
      },
      shippingMethod: getShippingMethodName(apiOrder.shippingLines),
      shippingCost: parseFloat(apiOrder.shippingTotal || 0),
      deliveryEstimate: getDeliveryEstimate(apiOrder.shippingLines),
      products: (apiOrder.lineItems || []).map(item => ({
        id: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.total) / item.quantity,
        total: parseFloat(item.total),
        image: item.image?.sourceUrl || '/placeholder/product.jpg',
      })),
    };
  };
  
  // Helper para obter nome legível do status do pedido
  const getStatusLabel = (status) => {
    const statusMap = {
      'pending': 'Aguardando pagamento',
      'processing': 'Em processamento',
      'on-hold': 'Em espera',
      'completed': 'Concluído',
      'cancelled': 'Cancelado',
      'refunded': 'Reembolsado',
      'failed': 'Falhou'
    };
    
    return statusMap[status] || 'Processando';
  };
  
  // Helper para obter nome do método de envio
  const getShippingMethodName = (shippingLines) => {
    if (!shippingLines || !shippingLines.length) return 'Entrega Padrão';
    
    const method = shippingLines[0];
    const methodName = method.methodTitle || method.method || '';
    
    // Melhorar nomes genéricos
    if (methodName === '.Package') return 'Correios Package';
    if (methodName === '.Com') return 'Correios Express';
    if (methodName.startsWith('.')) return `Correios ${methodName.substring(1)}`;
    
    return methodName;
  };
  
  // Helper para estimar prazo de entrega
  const getDeliveryEstimate = (shippingLines) => {
    if (!shippingLines || !shippingLines.length) return '5-7 dias úteis';
    
    // Tentar buscar informações de prazo de entrega dos metadados
    const method = shippingLines[0];
    const deliveryDays = method.metaData?.find(meta => meta.key === 'delivery_days')?.value;
    
    if (deliveryDays) {
      const days = parseInt(deliveryDays);
      if (!isNaN(days)) {
        return days === 1 ? '1 dia útil' : `${days} dias úteis`;
      }
    }
    
    // Estimativas baseadas no método quando não há dados específicos
    const methodId = method.method || '';
    if (methodId.includes('sedex')) return '1-3 dias úteis';
    if (methodId.includes('pac')) return '3-9 dias úteis';
    if (methodId.includes('express')) return '1-2 dias úteis';
    if (methodId.includes('standard')) return '3-7 dias úteis';
    
    return '5-7 dias úteis';
  };
  
  // Estado para exibir informações de erro
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="inline-flex rounded-full bg-red-100 p-4 mb-4">
                <svg className="h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Ocorreu um problema</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex flex-col md:flex-row justify-center gap-4">
                <Link href="/minha-conta">
                  <a className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition duration-300">
                    Ir para Minha Conta
                  </a>
                </Link>
                <Link href="/">
                  <a className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-6 rounded-md transition duration-300">
                    Voltar para a loja
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Se o ID do pedido não estiver disponível na URL
  if (!orderId && !isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Pedido não encontrado</h1>
            <p className="mb-6 text-gray-600">Não foi possível localizar as informações do seu pedido.</p>
            
            <Link href="/minha-conta">
              <a className="bg-primary-600 text-white py-2 px-6 rounded-md hover:bg-primary-700 transition duration-300 inline-block">
                Ver meus pedidos
              </a>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Estado de carregamento
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-8"></div>
              
              <div className="h-32 bg-gray-200 rounded mb-6"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-40 bg-gray-200 rounded"></div>
                <div className="h-40 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Função para rastrear o pedido
  const handleTrackOrder = () => {
    // Verificar se há código de rastreamento
    if (order?.trackingCode) {
      // Se tiver rastreio dos Correios
      if (order.shippingMethod.toLowerCase().includes('correios')) {
        window.open(`https://rastreamento.correios.com.br/app/index.php?objeto=${order.trackingCode}`, '_blank');
      } else {
        notification.info('Número de rastreamento: ' + order.trackingCode);
      }
    } else {
      notification.info('Este pedido ainda não possui código de rastreamento. Assim que seu pedido for enviado, o código será disponibilizado.');
    }
  };
  
  // Renderizar o componente de status de pagamento
  const renderPaymentStatus = () => {
    switch (order.paymentMethod) {
      case 'pix':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold mb-4 text-yellow-700">Pagamento via PIX</h3>
            <div className="flex flex-col items-center">
              <div className="border-2 border-gray-300 rounded-lg p-2 mb-4">
                <Image 
                  src="/payment/pix-qrcode-example.png" 
                  alt="QR Code PIX" 
                  width={200} 
                  height={200} 
                  className="mx-auto"
                />
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Escaneie o QR code acima com o app do seu banco ou copie o código abaixo:
              </p>
              <div className="bg-gray-100 p-3 rounded-md w-full mb-3">
                <p className="text-xs text-gray-800 break-all select-all">
                  00020101021226930014br.gov.bcb.pix2571api.example.com/pix/v2/cobv/9d36b84f10cd4a6abc3ded19b7e28d788025303986540400.005802BR5925Example Recipient Name6009SAO PAULO62070503***63046D23
                </p>
              </div>
              <button 
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                onClick={() => {
                  navigator.clipboard.writeText("00020101021226930014br.gov.bcb.pix2571api.example.com/pix/v2/cobv/9d36b84f10cd4a6abc3ded19b7e28d788025303986540400.005802BR5925Example Recipient Name6009SAO PAULO62070503***63046D23");
                  notification.success('Código PIX copiado para a área de transferência!');
                }}
              >
                Copiar código PIX
              </button>
            </div>
          </div>
        );
      
      case 'boleto':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold mb-4 text-blue-700">Boleto Bancário</h3>
            <div className="flex flex-col items-center">
              <p className="text-sm text-gray-600 mb-4">
                Seu boleto foi gerado com sucesso. Clique no botão abaixo para visualizar e imprimir:
              </p>
              <a 
                href="#" 
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition duration-300 mb-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visualizar Boleto
              </a>
              <div className="text-sm text-gray-600">
                <p className="mb-1"><strong>Valor:</strong> {formatCurrency(order.total)}</p>
                <p className="mb-1"><strong>Vencimento:</strong> Em até 2 dias úteis</p>
              </div>
            </div>
          </div>
        );
      
      case 'credit_card':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold mb-4 text-green-700">Pagamento com Cartão</h3>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-center text-gray-600 mb-2">
              Seu pagamento foi aprovado com sucesso!
            </p>
            <p className="text-center text-sm text-gray-500">
              O cartão foi processado e o pagamento confirmado.
            </p>
          </div>
        );
      
      default:
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">Informações de Pagamento</h3>
            <p className="text-gray-600">
              Status atual: <span className="font-medium">{order.paymentLabel}</span>
            </p>
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="bg-gray-50 py-10">
        <div className="container mx-auto px-4">
          {/* Cabeçalho com informações do pedido */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div className="mb-4 md:mb-0">
                <h1 className="text-2xl font-bold text-gray-800">Confirmação de Pedido</h1>
                <p className="text-gray-600 mt-1">Obrigado por comprar conosco!</p>
              </div>
              
              <div className="bg-gray-100 px-4 py-3 rounded-md">
                <p className="text-sm text-gray-600">Número do Pedido</p>
                <p className="font-bold text-lg"># {order.id}</p>
              </div>
            </div>
            
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="flex flex-wrap -mx-3">
                <div className="w-full md:w-1/2 px-3 mb-4 md:mb-0">
                  <p className="text-sm text-gray-600 mb-1">Data do Pedido:</p>
                  <p className="font-medium">{order.date}</p>
                </div>
                <div className="w-full md:w-1/2 px-3">
                  <p className="text-sm text-gray-600 mb-1">Status do Pedido:</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    {order.statusLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Coluna da esquerda - Detalhes do Pedido */}
            <div className="md:col-span-2">
              {/* Produtos */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 overflow-hidden mb-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Itens do Pedido</h2>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead className="bg-gray-50 text-left text-gray-600 text-sm uppercase">
                      <tr>
                        <th className="py-3 px-4 font-medium">Produto</th>
                        <th className="py-3 px-4 font-medium text-center">Qtd</th>
                        <th className="py-3 px-4 font-medium text-right">Preço</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {order.products.map((product) => (
                        <tr key={product.id} className="text-gray-800">
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded overflow-hidden mr-4">
                                <Image 
                                  src={product.image || '/placeholder/product.jpg'} 
                                  alt={product.name}
                                  width={64} 
                                  height={64} 
                                  objectFit="cover"
                                  className="h-full w-full object-center object-cover"
                                />
                              </div>
                              <div>
                                <h3 className="text-base font-medium">{product.name}</h3>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">{product.quantity}</td>
                          <td className="py-4 px-4 text-right">{formatCurrency(product.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(order.products.reduce((sum, product) => sum + product.total, 0))}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Frete ({order.shippingMethod}):</span>
                    <span className="font-medium">{formatCurrency(order.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-lg font-bold">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
              
              {/* Instruções de pagamento - varia de acordo com o método selecionado */}
              {renderPaymentStatus()}
              
              {/* Informações de entrega */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Informações de Entrega</h2>
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {order.deliveryEstimate}
                  </span>
                </div>
                
                <p className="text-gray-600">
                  <strong>Método:</strong> {order.shippingMethod}
                </p>
                <div className="mt-4">
                  <p className="font-medium">{`${order.shipping.firstName} ${order.shipping.lastName}`}</p>
                  <p className="text-gray-600">{order.shipping.address1}</p>
                  {order.shipping.address2 && <p className="text-gray-600">{order.shipping.address2}</p>}
                  <p className="text-gray-600">{`${order.shipping.city}, ${order.shipping.state} - ${order.shipping.postcode}`}</p>
                </div>
              </div>
            </div>
            
            {/* Coluna da direita - Resumo e ações */}
            <div className="md:col-span-1">
              {/* Status do pedido */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Status do Pedido</h2>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">Pedido #{order.id}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                    order.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' : 
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.statusLabel}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">
                  <strong>Data do pedido:</strong> {order.date}
                </p>
                
                {/* Timeline de status do pedido */}
                <div className="relative pt-4">
                  <div className="absolute top-0 h-full w-1 left-3 bg-gray-200"></div>
                  <ul className="space-y-6">
                    <li className="relative">
                      <div className="relative flex items-start">
                        <div className="absolute left-0 mt-1 -ml-3">
                          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-4 ring-white">
                            <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-6">
                          <h3 className="font-medium">Pedido recebido</h3>
                          <p className="text-sm text-gray-500">Pedido confirmado em {order.date}</p>
                        </div>
                      </div>
                    </li>
                    <li className="relative">
                      <div className="relative flex items-start">
                        <div className="absolute left-0 mt-1 -ml-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white ${
                            order.paymentStatus === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                          }`}>
                            <svg className={`h-5 w-5 ${order.paymentStatus === 'completed' ? 'text-white' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-6">
                          <h3 className="font-medium">Pagamento</h3>
                          <p className="text-sm text-gray-500">{order.paymentLabel}</p>
                        </div>
                      </div>
                    </li>
                    <li className="relative">
                      <div className="relative flex items-start">
                        <div className="absolute left-0 mt-1 -ml-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white ${
                            order.status === 'processing' || order.status === 'completed' ? 'bg-blue-500' : 'bg-gray-300'
                          }`}>
                            <svg className={`h-5 w-5 ${order.status === 'processing' || order.status === 'completed' ? 'text-white' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-6">
                          <h3 className="font-medium">Preparação</h3>
                          <p className="text-sm text-gray-500">
                            {order.status === 'completed' ? 'Pedido preparado com sucesso' : 
                             order.status === 'processing' ? 'Pedido em preparação' : 
                             'Aguardando processamento'}
                          </p>
                        </div>
                      </div>
                    </li>
                    <li className="relative">
                      <div className="relative flex items-start">
                        <div className="absolute left-0 mt-1 -ml-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white ${
                            order.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                          }`}>
                            <svg className={`h-5 w-5 ${order.status === 'completed' ? 'text-white' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-6">
                          <h3 className="font-medium">Entrega</h3>
                          <p className="text-sm text-gray-500">
                            {order.status === 'completed' ? 'Pedido entregue' : 'Aguardando envio'}
                          </p>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
                
                {/* Botão de rastreamento */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition duration-300 flex items-center justify-center"
                    onClick={handleTrackOrder}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Rastrear Pedido
                  </button>
                </div>
              </div>
              
              {/* Informações de contato */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Informações de Contato</h2>
                <p className="mb-2">
                  <strong>Email:</strong> {order.billing.email}
                </p>
                {order.billing.phone && (
                  <p className="mb-4">
                    <strong>Telefone:</strong> {order.billing.phone}
                  </p>
                )}
                
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Precisa de ajuda?</h3>
                  <Link href="/contato">
                    <a className="text-blue-600 hover:text-blue-800 text-sm">
                      Entrar em contato com suporte
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/">
              <a className="text-blue-600 hover:text-blue-800 inline-flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar para a loja
              </a>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ConfirmacaoPedido;
