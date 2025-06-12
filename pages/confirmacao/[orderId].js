import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../src/components/Layout';

const PaymentConfirmation = () => {
    const router = useRouter();
    const { orderId } = router.query;
    const [paymentData, setPaymentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checkCount, setCheckCount] = useState(0);
    const [showQrModal, setShowQrModal] = useState(false);
    const [currentQrCode, setCurrentQrCode] = useState(null);
    const maxChecks = 12; // Verificar por até 2 minutos (12 x 10s)

    // Tentar carregar dados do sessionStorage primeiro
    useEffect(() => {
        if (!orderId) return;

        console.log('[Payment Confirmation] Tentando carregar dados do sessionStorage para:', orderId);
        
        // Verificar se temos dados salvos no sessionStorage
        let savedPaymentData = typeof window !== 'undefined' ? sessionStorage.getItem(`pagbank_order_${orderId}`) : null;
        
        // Se não encontrar com o ID específico, tentar com chave genérica
        if (!savedPaymentData && typeof window !== 'undefined') {
            savedPaymentData = sessionStorage.getItem('pagbankOrderData');
        }
        
        if (savedPaymentData) {
            try {
                const parsedData = JSON.parse(savedPaymentData);
                console.log('[Payment Confirmation] Dados encontrados no sessionStorage:', parsedData);
                
                // Reformatar dados para compatibilidade com a interface
                const formattedData = {
                    orderId: parsedData.id || parsedData.orderId,
                    referenceId: parsedData.reference_id,
                    status: parsedData.status || 'WAITING',
                    createdAt: parsedData.created_at || parsedData.createdAt,
                    customer: parsedData.customer,
                    charges: parsedData.charges || [],
                    qr_codes: parsedData.qr_codes || [],
                    paymentStatus: parsedData.paymentStatus || 'WAITING',
                    total: parsedData.total || 0
                };
                
                setPaymentData(formattedData);
                setLoading(false);
                return;
            } catch (error) {
                console.error('[Payment Confirmation] Erro ao fazer parse dos dados do sessionStorage:', error);
            }
        }        console.log('[Payment Confirmation] Dados não encontrados no sessionStorage, iniciando verificação via API');
    }, [orderId]);    // Verificar status do pagamento
    const checkPaymentStatus = async () => {
        if (!orderId) return;

        try {
            console.log(`[Payment Confirmation] Verificação #${checkCount + 1} para pedido:`, orderId);
            
            // Usar o novo endpoint que mapeia WooCommerce ID para PagBank ID
            const response = await fetch(`/api/pagbank/order-by-woo-id/${orderId}`);
            const result = await response.json();

            if (response.ok) {
                console.log('[Payment Confirmation] Dados recebidos:', result);
                setPaymentData(result);
                  // Atualizar status do pedido no WooCommerce se necessário
                if (result.pagbankOrderId && !result.isSimulated) {
                    try {
                        const updateResponse = await fetch('/api/pagbank/update-order-status', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                wooCommerceOrderId: orderId, // Usar o ID do WooCommerce
                                pagbankOrderId: result.pagbankOrderId,
                                status: result.status || result.paymentStatus || 'WAITING'
                            })
                        });
                        
                        const updateResult = await updateResponse.json();
                        
                        if (updateResponse.ok) {
                            console.log('[Payment Confirmation] Status do pedido WooCommerce atualizado:', updateResult);
                        } else {
                            console.warn('[Payment Confirmation] Falha ao atualizar status do WooCommerce:', updateResult.error);
                        }
                    } catch (updateError) {
                        console.error('[Payment Confirmation] Erro ao atualizar status do WooCommerce:', updateError);
                    }
                }
                  // Se pagamento foi confirmado, parar de verificar
                if (result.charges && result.charges.some(charge => charge.status === 'PAID')) {
                    setLoading(false);
                    // Redirecionar para a página de agradecimento
                    setTimeout(() => {
                        window.location.href = `/thank-you?order_id=${orderId}`;
                    }, 2000);
                    return true;
                } else if (result.qr_codes) {
                    // Para PIX, mostrar o QR Code mesmo sem pagamento confirmado
                    setLoading(false);
                    return false; // Continuar verificando para PIX
                }
            } else {
                console.error('[Payment Confirmation] Erro na verificação:', result);
                
                // Se for erro 404 (Not Found), tentar usar dados do sessionStorage
                if (response.status === 404) {
                    console.log('[Payment Confirmation] Tentando recuperar dados do sessionStorage...');
                    
                    // Tentar primeiro com o ID específico do pedido
                    let savedPaymentData = sessionStorage.getItem(`pagbank_order_${orderId}`);
                    
                    // Se não encontrar, tentar com a chave genérica
                    if (!savedPaymentData) {
                        savedPaymentData = sessionStorage.getItem('pagbankOrderData');
                    }
                    
                    if (savedPaymentData) {
                        try {
                            const parsedData = JSON.parse(savedPaymentData);
                            console.log('[Payment Confirmation] Dados recuperados do sessionStorage:', parsedData);
                            
                            // Reformatar dados para compatibilidade com a interface
                            const formattedData = {
                                orderId: parsedData.id || parsedData.orderId,
                                referenceId: parsedData.reference_id,
                                status: parsedData.status || 'WAITING',
                                createdAt: parsedData.created_at || parsedData.createdAt,
                                customer: parsedData.customer,
                                charges: parsedData.charges || [],
                                qr_codes: parsedData.qr_codes || [],
                                paymentStatus: parsedData.paymentStatus || 'WAITING',
                                total: parsedData.total || 0
                            };
                            
                            setPaymentData(formattedData);
                            setLoading(false);
                            setError(null); // Limpar erro pois conseguimos dados do sessionStorage
                            return false; // Continuar verificando
                        } catch (parseError) {
                            console.error('[Payment Confirmation] Erro ao parsear dados salvos:', parseError);
                        }
                    }
                }
                
                setError(result.error || 'Erro ao verificar status do pagamento');
            }
        } catch (error) {
            console.error('[Payment Confirmation] Erro na requisição:', error);
            setError('Erro de conexão ao verificar pagamento');
        }

        return false;
    };

    // Efeito para verificação inicial e polling (só se não temos dados do sessionStorage)
    useEffect(() => {
        if (!orderId || paymentData) return; // Se já temos dados, não fazer polling

        const performCheck = async () => {
            const isPaid = await checkPaymentStatus();
            
            // Se não foi pago e ainda não excedeu o limite, agendar próxima verificação
            if (!isPaid && checkCount < maxChecks) {
                setTimeout(() => {
                    setCheckCount(prev => prev + 1);
                }, 10000); // Verificar a cada 10 segundos
            } else if (checkCount >= maxChecks) {
                // Parar verificação após limite
                setLoading(false);
            }
        };

        performCheck();
    }, [orderId, checkCount, paymentData]);

    // Status do pagamento
    const getStatusInfo = () => {
        if (!paymentData) return { color: 'gray', text: 'Verificando...', icon: '⏳' };

        switch (paymentData.paymentStatus) {
            case 'PAID':
                return { color: 'green', text: 'Pagamento Confirmado', icon: '✅' };
            case 'WAITING':
                return { color: 'yellow', text: 'Aguardando Pagamento', icon: '⏳' };
            case 'AUTHORIZED':
                return { color: 'blue', text: 'Pagamento Autorizado', icon: '🔄' };
            case 'CANCELED':
                return { color: 'red', text: 'Pagamento Cancelado', icon: '❌' };
            default:
                return { color: 'gray', text: 'Status Indefinido', icon: '❓' };
        }
    };

    const statusInfo = getStatusInfo();

    // Funções do modal QR Code
    const openQrModal = (qrCode) => {
        setCurrentQrCode(qrCode);
        setShowQrModal(true);
    };

    const closeQrModal = () => {
        setShowQrModal(false);
        setCurrentQrCode(null);
    };

    // Fechar modal quando clicar fora da imagem
    const handleModalClick = (e) => {
        if (e.target === e.currentTarget) {
            closeQrModal();
        }
    };

    return (
        <Layout>
            <Head>
                <title>Confirmação de Pagamento - Loja</title>
                <meta name="description" content="Confirmação do seu pagamento" />
            </Head>
            
            {/* Estilos globais modernos inspirados no design Xiaomi */}
            <style jsx global>{`
                .xiaomi-confirmation {
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    min-height: 100vh;
                    padding: 20px 0;
                }
                
                .confirmation-container {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 0 20px;
                }
                
                .confirmation-header {
                    background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
                    color: white;
                    padding: 40px 30px;
                    margin-bottom: 30px;
                    border-radius: 16px;
                    box-shadow: 0 12px 48px rgba(255, 105, 0, 0.2);
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .confirmation-header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                    animation: shine 3s infinite;
                }
                
                @keyframes shine {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
                
                .status-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 36px;
                    margin: 0 auto 20px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                }
                
                .status-title {
                    font-size: 28px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .order-id-badge {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 8px 16px;
                    border-radius: 50px;
                    font-size: 14px;
                    font-weight: 500;
                    display: inline-block;
                    margin-top: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                
                .main-content {
                    display: grid;
                    gap: 24px;
                }
                
                .content-card {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
                    overflow: hidden;
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255, 105, 0, 0.1);
                }
                
                .content-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 16px 64px rgba(0, 0, 0, 0.12);
                }
                
                .error-card {
                    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                    border: 1px solid #f87171;
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                }
                
                .error-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .error-icon {
                    font-size: 24px;
                    color: #dc2626;
                }
                
                .error-text {
                    color: #991b1b;
                    font-weight: 500;
                }
                
                .loading-card {
                    text-align: center;
                    padding: 40px 20px;
                }
                
                .loading-spinner {
                    width: 48px;
                    height: 48px;
                    border: 4px solid #f3f4f6;
                    border-top: 4px solid #ff6900;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .loading-text {
                    color: #6b7280;
                    font-weight: 500;
                }
                
                .loading-counter {
                    color: #ff6900;
                    font-weight: 700;
                }
                  .pix-card {
                    background: white;
                    border: 1px solid rgba(255, 105, 0, 0.1);
                    padding: 32px;
                    position: relative;
                    overflow: hidden;
                }
                  .pix-card::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(45deg, transparent, rgba(255, 105, 0, 0.02), transparent);
                    animation: pixShine 8s infinite;
                }
                
                @keyframes pixShine {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .pix-header {
                    text-align: center;
                    margin-bottom: 24px;
                    position: relative;
                    z-index: 1;
                }                .pix-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                }
                
                .pix-icon img {
                    width: 128px;
                    height: 128px;
                }
                  .pix-title {
                    font-size: 24px;
                    font-weight: 700;
                    background: linear-gradient(90deg, #ff6900, #00a8e1);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .qr-container {
                    background: white;
                    padding: 24px;
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    margin-bottom: 24px;
                    text-align: center;
                    position: relative;
                    z-index: 1;
                }
                  .qr-image {
                    width: 280px;
                    height: 280px;
                    margin: 0 auto;
                    border-radius: 12px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                }
                
                .qr-image.clickable {
                    cursor: pointer;
                }
                
                .qr-image.clickable:hover {
                    transform: scale(1.05);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                }
                
                .qr-hint {
                    font-size: 12px;
                    color: #6b7280;
                    margin-top: 8px;
                    text-align: center;
                    font-style: italic;
                }
                
                .qr-fallback {
                    width: 280px;
                    height: 280px;
                    background: #f3f4f6;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #6b7280;
                    border-radius: 12px;
                    margin: 0 auto;
                }

                /* Estilos do Modal QR Code */
                .qr-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(4px);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    animation: fadeIn 0.3s ease;
                }
                
                .qr-modal-content {
                    background: white;
                    border-radius: 20px;
                    padding: 30px;
                    max-width: 500px;
                    width: 100%;
                    text-align: center;
                    position: relative;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: slideUp 0.3s ease;
                }
                
                .qr-modal-close {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 5px;
                    line-height: 1;
                    transition: color 0.2s ease;
                }
                
                .qr-modal-close:hover {
                    color: #ff6900;
                }
                
                .qr-modal-image {
                    width: 100%;
                    max-width: 350px;
                    height: auto;
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                }
                
                .qr-modal-text {
                    margin: 20px 0 10px;
                    font-size: 16px;
                    color: #374151;
                    font-weight: 500;
                }
                
                .qr-modal-amount {
                    font-size: 24px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #ff6900, #00a8e1);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-top: 10px;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(30px) scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                  .instructions-card {
                    background: linear-gradient(135deg, rgba(255,105,0,0.05), rgba(0,168,225,0.05));
                    border: 1px solid rgba(255, 105, 0, 0.2);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                    position: relative;
                    z-index: 1;
                }
                  .instructions-title {
                    font-weight: 700;
                    background: linear-gradient(90deg, #ff6900, #00a8e1);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                  .instructions-list {
                    color: #334155;
                    font-size: 14px;
                    line-height: 1.6;
                    font-weight: 500;
                }
                
                .instructions-list li {
                    margin-bottom: 4px;
                }
                
                .payment-info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin-bottom: 20px;
                    position: relative;
                    z-index: 1;
                }
                
                .info-item {
                    background: white;
                    padding: 16px;
                    border-radius: 12px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                }
                
                .info-label {
                    color: #6b7280;
                    font-size: 12px;
                    font-weight: 500;
                    margin-bottom: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .info-value {
                    font-weight: 700;
                    font-size: 18px;
                }
                
                .value-amount {
                    color: #059669;
                }
                
                .value-expiry {
                    color: #dc2626;
                    font-size: 14px;
                }
                
                .copy-section {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                    margin-bottom: 20px;
                    position: relative;
                    z-index: 1;
                }
                
                .copy-label {
                    color: #374151;
                    font-size: 14px;
                    margin-bottom: 12px;
                    font-weight: 500;
                }
                
                .copy-container {
                    display: flex;
                    gap: 12px;
                    align-items: stretch;
                }
                
                .copy-input {
                    flex: 1;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 12px;
                    background: #f9fafb;
                    font-family: monospace;
                    transition: border-color 0.3s ease;
                }
                
                .copy-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                }
                  .copy-button {
                    background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 16px rgba(255, 105, 0, 0.3);
                }
                
                .copy-button:hover {
                    background: linear-gradient(135deg, #00a8e1 0%, #ff6900 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 24px rgba(255, 105, 0, 0.4);
                }
                
                .payment-status {
                    padding: 16px;
                    border-radius: 12px;
                    text-align: center;
                    font-weight: 600;
                    margin-bottom: 20px;
                    position: relative;
                    z-index: 1;
                }
                
                .status-paid {
                    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                    color: #065f46;
                    border: 1px solid #34d399;
                }
                
                .status-waiting {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    color: #92400e;
                    border: 1px solid #f59e0b;
                }
                
                .info-card {
                    background: white;
                    padding: 24px;
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
                    margin-bottom: 24px;
                }
                
                .info-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 16px;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #f3f4f6;
                }
                
                .info-content {
                    color: #4b5563;
                    line-height: 1.6;
                }
                
                .info-item-inline {
                    margin-bottom: 8px;
                }
                
                .info-label-inline {
                    font-weight: 600;
                    color: #374151;
                }
                
                .action-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                    justify-content: center;
                    margin-top: 32px;
                    padding: 24px;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
                }
                
                .action-button {
                    padding: 16px 24px;
                    border: none;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-size: 14px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                    min-width: 160px;
                }
                
                .btn-primary {
                    background: linear-gradient(135deg, #ff6900 0%, #ff8f00 100%);
                    color: white;
                }
                
                .btn-primary:hover {
                    background: linear-gradient(135deg, #ff8f00 0%, #ff6900 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 32px rgba(255, 105, 0, 0.3);
                }
                
                .btn-secondary {
                    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
                    color: white;
                }
                
                .btn-secondary:hover {
                    background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 32px rgba(107, 114, 128, 0.3);
                }
                
                .btn-refresh {
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                    color: white;
                }
                
                .btn-refresh:hover {
                    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
                }
                
                .btn-refresh:disabled {
                    background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: 0 4px 16px rgba(156, 163, 175, 0.2);
                }
                
                @media (max-width: 768px) {
                    .confirmation-container {
                        padding: 0 15px;
                    }
                    
                    .confirmation-header {
                        padding: 30px 20px;
                        margin-bottom: 20px;
                    }
                    
                    .status-title {
                        font-size: 24px;
                    }
                    
                    .pix-card {
                        padding: 24px 20px;
                    }
                    
                    .qr-image, .qr-fallback {
                        width: 240px;
                        height: 240px;
                    }
                    
                    .payment-info-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                    
                    .action-buttons {
                        flex-direction: column;
                        align-items: stretch;
                    }
                      .action-button {
                        min-width: auto;
                        width: 100%;
                    }
                    
                    /* Modal responsivo */
                    .qr-modal-content {
                        padding: 20px;
                        margin: 10px;
                    }
                    
                    .qr-modal-image {
                        max-width: 280px;
                    }
                    
                    .qr-modal-text {
                        font-size: 14px;
                    }
                    
                    .qr-modal-amount {
                        font-size: 20px;
                    }
                }
                
                @media (max-width: 480px) {
                    .qr-image, .qr-fallback {
                        width: 200px;
                        height: 200px;
                    }
                    
                    .qr-modal-content {
                        padding: 15px;
                        border-radius: 16px;
                    }
                    
                    .qr-modal-image {
                        max-width: 250px;
                    }
                }
            `}</style>
            
            <div className="xiaomi-confirmation">
                <div className="confirmation-container">
                    {/* Header moderno com gradiente */}
                    <div className="confirmation-header">
                        <div className="status-icon">
                            {statusInfo.icon}
                        </div>
                        <h1 className="status-title">
                            {statusInfo.text}
                        </h1>
                        {orderId && (
                            <div className="order-id-badge">
                                Pedido: {orderId}
                            </div>
                        )}
                    </div>

                    <div className="main-content">
                        {/* Erro */}
                        {error && (
                            <div className="error-card">
                                <div className="error-content">
                                    <div className="error-icon">⚠️</div>
                                    <div className="error-text">{error}</div>
                                </div>
                            </div>
                        )}

                        {/* Loading */}
                        {loading && !error && (
                            <div className="content-card">
                                <div className="loading-card">
                                    <div className="loading-spinner"></div>
                                    <p className="loading-text">
                                        Verificando status do pagamento...
                                    </p>
                                    <p className="loading-counter">
                                        ({checkCount + 1}/{maxChecks})
                                    </p>
                                </div>
                            </div>
                        )}                {/* Dados do Pagamento */}
                        {paymentData && (
                            <>
                                {/* QR Code PIX - Seção Especial */}
                                {paymentData.qr_codes && paymentData.qr_codes.length > 0 && (
                                    <div className="content-card pix-card">                                        <div className="pix-header">
                                            <h3 className="pix-title">
                                                Pagamento via
                                            </h3>
                                            <div className="pix-icon">
                                                <img src="/payment/pix.svg" alt="PIX" />
                                            </div>
                                        </div>
                                        
                                        {paymentData.qr_codes.map((qrCode, index) => (
                                            <div key={qrCode.id}>                                                {/* QR Code Image */}
                                                {qrCode.links && qrCode.links.find(link => link.media === 'image/png') && (
                                                    <div className="qr-container">
                                                        <img 
                                                            src={qrCode.links.find(link => link.media === 'image/png').href}
                                                            alt="QR Code PIX"
                                                            className="qr-image clickable"
                                                            onClick={() => openQrModal(qrCode)}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div style={{display: 'none'}} className="qr-fallback">
                                                            QR Code não disponível
                                                        </div>
                                                        <p className="qr-hint">
                                                            💡 Clique na imagem para ampliar
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                {/* Instruções */}                                                <div className="instructions-card">
                                                    <h4 className="instructions-title">
                                                        📱 Como pagar:
                                                    </h4>
                                                    <ol className="instructions-list">
                                                        <li>Abra o app do seu banco</li>
                                                        <li>Escaneie o QR Code acima</li>
                                                        <li>Confirme o pagamento</li>
                                                        <li>Aguarde a confirmação automática</li>
                                                    </ol>
                                                </div>
                                                
                                                {/* Valor e Expiração */}                                                <div className="payment-info-grid">
                                                    <div className="info-item">
                                                        <p className="info-label">Valor:</p>
                                                        <p className="info-value value-amount">
                                                            R$ {(qrCode.amount.value / 100).toLocaleString('pt-BR', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="info-item">
                                                        <p className="info-label">Expira em:</p>
                                                        <p className="info-value value-expiry">
                                                            {new Date(qrCode.expiration_date).toLocaleString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {/* Código PIX para Copy/Paste */}
                                                {qrCode.text && (
                                                    <div className="copy-section">
                                                        <p className="copy-label">
                                                            💡 <strong>Alternativa:</strong> Copie e cole o código PIX:
                                                        </p>
                                                        <div className="copy-container">
                                                            <input 
                                                                type="text" 
                                                                value={qrCode.text}
                                                                readOnly
                                                                className="copy-input"
                                                            />
                                                            <button 
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(qrCode.text);
                                                                    alert('Código PIX copiado!');
                                                                }}
                                                                className="copy-button"
                                                            >
                                                                Copiar
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        
                                        {/* Status do Pagamento */}
                                        <div className={`payment-status ${
                                            paymentData.paymentStatus === 'PAID' 
                                                ? 'status-paid' 
                                                : 'status-waiting'
                                        }`}>
                                            <p>
                                                {paymentData.paymentStatus === 'PAID' 
                                                    ? '✅ Pagamento confirmado! Seu pedido será processado.' 
                                                    : '⏳ Aguardando pagamento... A página será atualizada automaticamente.'
                                                }
                                            </p>                                        </div>
                                    </div>
                                )}

                                {/* Modal QR Code */}
                                {showQrModal && currentQrCode && (
                                    <div className="qr-modal-overlay" onClick={handleModalClick}>
                                        <div className="qr-modal-content">
                                            <button className="qr-modal-close" onClick={closeQrModal}>
                                                ✕
                                            </button>
                                            <img 
                                                src={currentQrCode.links.find(link => link.media === 'image/png').href}
                                                alt="QR Code PIX - Ampliado"
                                                className="qr-modal-image"
                                            />
                                            <p className="qr-modal-text">
                                                Escaneie este QR Code com o app do seu banco
                                            </p>
                                            <div className="qr-modal-amount">
                                                R$ {(currentQrCode.amount.value / 100).toLocaleString('pt-BR', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Informações do Cliente */}
                                {paymentData.customer && (
                                    <div className="content-card info-card">
                                        <h3 className="info-title">Dados do Cliente</h3>
                                        <div className="info-content">
                                            <div className="info-item-inline">
                                                <span className="info-label-inline">Nome:</span> {paymentData.customer.name}
                                            </div>
                                            <div className="info-item-inline">
                                                <span className="info-label-inline">Email:</span> {paymentData.customer.email}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Informações das Charges (para outros métodos de pagamento) */}
                                {paymentData.charges && paymentData.charges.length > 0 && (
                                    <div className="content-card info-card">
                                        <h3 className="info-title">Detalhes do Pagamento</h3>
                                        <div className="info-content">
                                            {paymentData.charges.map((charge, index) => (
                                                <div key={charge.id} style={{marginBottom: '16px', paddingBottom: '16px', borderBottom: index < paymentData.charges.length - 1 ? '1px solid #e5e7eb' : 'none'}}>
                                                    <div className="info-item-inline">
                                                        <span className="info-label-inline">ID:</span> {charge.id}
                                                    </div>
                                                    <div className="info-item-inline">
                                                        <span className="info-label-inline">Status:</span> {charge.status}
                                                    </div>
                                                    <div className="info-item-inline">
                                                        <span className="info-label-inline">Valor:</span> R$ {(charge.amount?.value / 100).toFixed(2)}
                                                    </div>
                                                    <div className="info-item-inline">
                                                        <span className="info-label-inline">Método:</span> {charge.paymentMethod?.type}
                                                    </div>
                                                    {charge.paidAt && (
                                                        <div className="info-item-inline">
                                                            <span className="info-label-inline">Pago em:</span> {new Date(charge.paidAt).toLocaleString('pt-BR')}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Links úteis */}
                                                    {charge.links && charge.links.length > 0 && (
                                                        <div style={{marginTop: '8px'}}>
                                                            <span className="info-label-inline">Links:</span>
                                                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px'}}>
                                                                {charge.links.map((link, linkIndex) => (
                                                                    <a
                                                                        key={linkIndex}
                                                                        href={link.href}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        style={{color: '#3b82f6', textDecoration: 'underline', fontSize: '14px'}}
                                                                    >
                                                                        {link.rel}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            
                                            <div style={{marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #f3f4f6'}}>
                                                <div className="info-item-inline">
                                                    <span className="info-label-inline" style={{fontSize: '18px'}}>Total:</span> 
                                                    <span style={{fontSize: '18px', fontWeight: '700', color: '#059669'}}>
                                                        R$ {(paymentData.total / 100).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Data de Criação */}
                                {paymentData.createdAt && (
                                    <div className="content-card info-card">
                                        <h3 className="info-title">Informações do Pedido</h3>
                                        <div className="info-content">
                                            <div className="info-item-inline">
                                                <span className="info-label-inline">Pedido criado em:</span> {new Date(paymentData.createdAt).toLocaleString('pt-BR')}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}                        {/* Ações */}
                        <div className="action-buttons">
                            <button
                                onClick={() => router.push('/minha-conta')}
                                className="action-button btn-primary"
                            >
                                Ver Meus Pedidos
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="action-button btn-secondary"
                            >
                                Voltar ao Início
                            </button>
                            {orderId && (
                                <button
                                    onClick={checkPaymentStatus}
                                    disabled={loading}
                                    className="action-button btn-refresh"
                                >
                                    Verificar Novamente
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PaymentConfirmation;
