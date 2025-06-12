// Página de confirmação de pagamento Infinitepay
// /confirmacao/infinitepay

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/components/Layout';
import LoadingSpinner from '../../src/components/LoadingSpinner';

const InfinitepayConfirmation = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [orderData, setOrderData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const processPaymentReturn = async () => {
            try {
                // Capturar parâmetros da URL
                const urlParams = new URLSearchParams(window.location.search);
                const orderId = urlParams.get('order');
                const receiptUrl = urlParams.get('receipt_url');
                const transactionId = urlParams.get('transaction_id');
                const captureMethod = urlParams.get('capture_method');
                const orderNsu = urlParams.get('order_nsu');
                const slug = urlParams.get('slug');

                console.log('[Infinitepay Confirmation] Parâmetros recebidos:', {
                    orderId,
                    transactionId,
                    captureMethod,
                    orderNsu,
                    slug,
                    receiptUrl
                });

                if (!orderId) {
                    throw new Error('ID do pedido não encontrado');
                }

                // Processar retorno de pagamento via API
                const response = await fetch('/api/infinitepay/payment-return', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        receipt_url: receiptUrl,
                        transaction_id: transactionId,
                        capture_method: captureMethod,
                        order_nsu: orderNsu,
                        slug: slug,
                        orderId: orderId
                    })
                });

                const result = await response.json();
                
                console.log('[Infinitepay Confirmation] Resultado do processamento:', result);

                setPaymentStatus(result);
                
                // Buscar dados do pedido
                if (orderId) {
                    try {
                        const orderResponse = await fetch(`/api/orders/order-details?orderId=${orderId}`);
                        const orderResult = await orderResponse.json();
                        
                        if (orderResult.success) {
                            setOrderData(orderResult.order);
                        }
                    } catch (orderError) {
                        console.error('[Infinitepay Confirmation] Erro ao buscar dados do pedido:', orderError);
                    }
                }

            } catch (error) {
                console.error('[Infinitepay Confirmation] Erro:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (typeof window !== 'undefined') {
            processPaymentReturn();
        }
    }, []);

    const handleBackToStore = () => {
        router.push('/');
    };

    const handleViewOrder = () => {
        if (orderData?.id) {
            router.push(`/pedido/${orderData.id}`);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <LoadingSpinner />
                        <p className="mt-4 text-gray-600">Processando seu pagamento...</p>
                        <p className="mt-2 text-sm text-gray-500">Por favor, aguarde.</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                        <div className="text-6xl mb-4">❌</div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro no Pagamento</h1>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={handleBackToStore}
                            className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors"
                        >
                            Voltar à Loja
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    const isPaid = paymentStatus?.status === 'paid';

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        
                        {/* Header */}
                        <div className={`px-8 py-6 ${isPaid ? 'bg-green-50' : 'bg-yellow-50'}`}>
                            <div className="text-center">
                                <div className="text-6xl mb-4">
                                    {isPaid ? '✅' : '⏳'}
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                    {isPaid ? 'Pagamento Confirmado!' : 'Pagamento Pendente'}
                                </h1>
                                <p className="text-gray-600">
                                    {isPaid 
                                        ? 'Seu pagamento foi processado com sucesso.'
                                        : 'Seu pagamento está sendo processado.'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Detalhes do Pedido */}
                        {orderData && (
                            <div className="px-8 py-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalhes do Pedido</h2>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Número do Pedido:</span>
                                        <span className="font-medium ml-2">#{orderData.number}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Total:</span>
                                        <span className="font-medium ml-2">{orderData.total}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Status:</span>
                                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                            isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {isPaid ? 'Pagamento Confirmado' : 'Aguardando Pagamento'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Data:</span>
                                        <span className="font-medium ml-2">
                                            {new Date(orderData.date_created).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Informações de Pagamento */}
                        {paymentStatus?.transactionId && (
                            <div className="px-8 py-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações de Pagamento</h2>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-600">ID da Transação:</span>
                                        <span className="font-mono ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                            {paymentStatus.transactionId}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Método de Pagamento:</span>
                                        <span className="ml-2">Infinitepay Checkout</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Status e Próximos Passos */}
                        <div className="px-8 py-6">
                            {isPaid ? (
                                <div className="space-y-4">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h3 className="font-medium text-green-900 mb-2">✅ Pagamento Aprovado</h3>
                                        <p className="text-sm text-green-700">
                                            Seu pedido foi confirmado e está sendo preparado para envio.
                                            Você receberá uma confirmação por e-mail em breve.
                                        </p>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleViewOrder}
                                            className="flex-1 bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors"
                                        >
                                            Ver Detalhes do Pedido
                                        </button>
                                        <button
                                            onClick={handleBackToStore}
                                            className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Continuar Comprando
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <h3 className="font-medium text-yellow-900 mb-2">⏳ Processando Pagamento</h3>
                                        <p className="text-sm text-yellow-700">
                                            Seu pagamento está sendo processado. Isso pode levar alguns minutos.
                                            Você receberá uma confirmação por e-mail quando o pagamento for aprovado.
                                        </p>
                                    </div>
                                    
                                    <div className="text-center">
                                        <button
                                            onClick={handleBackToStore}
                                            className="bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors"
                                        >
                                            Voltar à Loja
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Informações Adicionais */}
                    <div className="mt-8 text-center text-sm text-gray-600">
                        <p>
                            Tem dúvidas? Entre em contato conosco pelo e-mail{' '}
                            <a href="mailto:atendimento@sualojadomail.com" className="text-orange-600 hover:text-orange-700">
                                atendimento@sualojadomail.com
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default InfinitepayConfirmation;
