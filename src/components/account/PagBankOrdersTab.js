
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import LoadingSpinner from '../LoadingSpinner';

const PagBankOrdersTab = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const { userData } = useAuth();

    useEffect(() => {
        fetchOrders();
    }, [userData]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!userData?.id && !userData?.email) {
                setError('Usuário não logado');
                return;
            }

            const params = new URLSearchParams({
                userId: userData.id || '',
                email: userData.email || ''
            });

            const response = await fetch(`/api/orders/get-user-orders?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao buscar pedidos');
            }

            setOrders(data.orders || []);
        } catch (error) {
            console.error('[PagBankOrdersTab] Erro ao buscar pedidos:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleOrderDetails = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    const formatDate = (dateString) => {
        const options = { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('pt-BR', options);
    };

    const getStatusColor = (status) => {
        switch(status.toLowerCase()) {
            case 'concluído':
            case 'pago':
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'processando':
            case 'processing':
                return 'bg-blue-100 text-blue-800';
            case 'pendente':
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelado':
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'falhou':
            case 'failed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentMethodLabel = (method) => {
        const methods = {
            'pix': 'PIX',
            'credit': 'Cartão de Crédito',
            'debit': 'Cartão de Débito',
            'boleto': 'Boleto Bancário'
        };
        return methods[method] || method;
    };

    const getPaymentMethodIcon = (method) => {
        switch(method) {
            case 'pix':
                return '💳';
            case 'credit':
                return '💰';
            case 'debit':
                return '💸';
            case 'boleto':
                return '📄';
            default:
                return '💰';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-md">
                <h3 className="text-lg font-medium text-red-800">Erro ao carregar pedidos</h3>
                <p className="mt-2 text-red-700">{error}</p>
                <button 
                    onClick={fetchOrders} 
                    className="mt-3 text-red-600 hover:text-red-800 font-medium"
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div>
                <h2 className="text-2xl font-bold mb-6">Meus Pedidos</h2>
                <div className="bg-yellow-50 p-6 rounded-lg">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🛒</div>
                        <h3 className="text-lg font-medium text-yellow-800 mb-2">
                            Nenhum pedido encontrado
                        </h3>
                        <p className="text-yellow-700 mb-4">
                            Você ainda não realizou nenhum pedido. Que tal começar a comprar?
                        </p>
                        <Link 
                            href="/loja" 
                            className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                        >
                            Começar a comprar
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Meus Pedidos</h2>
                <button 
                    onClick={fetchOrders}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    🔄 Atualizar
                </button>
            </div>
            
            <div className="space-y-4">
                {orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                        {/* Cabeçalho do pedido */}
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Pedido #{order.orderNumber}
                                        </h3>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {formatDate(order.date)}
                                    </p>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-gray-900">
                                            {order.total}
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                            <span>{getPaymentMethodIcon(order.paymentMethod)}</span>
                                            <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => toggleOrderDetails(order.id)}
                                        className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                                    >
                                        {expandedOrder === order.id ? 'Ocultar' : 'Ver detalhes'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Detalhes expandidos */}
                        {expandedOrder === order.id && (
                            <div className="p-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Produtos */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-3">Produtos</h4>
                                        {order.items && order.items.length > 0 ? (
                                            <div className="space-y-2">
                                                {order.items.map((item, index) => (
                                                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                        <div className="flex-1">
                                                            <span className="font-medium text-gray-900">
                                                                {item.name || item.title}
                                                            </span>
                                                            <span className="text-sm text-gray-600 ml-2">
                                                                x{item.qty || item.quantity || 1}
                                                            </span>
                                                        </div>
                                                        <span className="font-medium text-gray-900">
                                                            R$ {parseFloat(item.price || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-600">Informações de produtos não disponíveis</p>
                                        )}
                                    </div>

                                    {/* Informações do cliente e entrega */}
                                    <div className="space-y-4">
                                        {/* Cliente */}
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                                            <div className="text-sm text-gray-600">
                                                <p>{order.customer?.name || `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim()}</p>
                                                <p>{order.customer?.email}</p>
                                                {order.customer?.phone && <p>{order.customer.phone}</p>}
                                            </div>
                                        </div>

                                        {/* Endereço de entrega */}
                                        {order.shipping && (
                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-2">Endereço de Entrega</h4>
                                                <div className="text-sm text-gray-600">
                                                    {order.shipping.address ? (
                                                        <>
                                                            <p>{order.shipping.address.address1}</p>
                                                            {order.shipping.address.address2 && <p>{order.shipping.address.address2}</p>}
                                                            <p>{order.shipping.address.city}, {order.shipping.address.state}</p>
                                                            <p>CEP: {order.shipping.address.postcode}</p>
                                                        </>
                                                    ) : (
                                                        <p>Endereço não informado</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Informações de pagamento */}
                                        {order.paymentData && (
                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-2">Pagamento</h4>
                                                <div className="text-sm text-gray-600">
                                                    <p>Método: {getPaymentMethodLabel(order.paymentMethod)}</p>
                                                    {order.paymentData.installments && order.paymentData.installments > 1 && (
                                                        <p>Parcelas: {order.paymentData.installments}x de R$ {order.paymentData.installmentValue}</p>
                                                    )}
                                                    {order.paymentData.transactionId && (
                                                        <p>ID da Transação: {order.paymentData.transactionId}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PagBankOrdersTab;
