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
        }

        console.log('[Payment Confirmation] Dados não encontrados no sessionStorage, iniciando verificação via API');
    }, [orderId]);    // Verificar status do pagamento
    const checkPaymentStatus = async () => {
        if (!orderId) return;

        try {
            console.log(`[Payment Confirmation] Verificação #${checkCount + 1} para pedido:`, orderId);
            
            const response = await fetch(`/api/pagbank/status/${orderId}`);
            const result = await response.json();

            if (response.ok) {
                console.log('[Payment Confirmation] Dados recebidos:', result);
                setPaymentData(result);
                
                // Atualizar status do pedido no WooCommerce
                try {
                    const updateResponse = await fetch('/api/pagbank/update-order-status', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            pagbankOrderId: result.orderId || result.id,
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
                
                // Se pagamento foi confirmado, parar de verificar
                if (result.charges && result.charges.some(charge => charge.status === 'PAID')) {
                    setLoading(false);
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

    return (
        <Layout>
            <Head>
                <title>Confirmação de Pagamento - Loja</title>
                <meta name="description" content="Confirmação do seu pagamento" />
            </Head>
            
            <div className="confirmation-container">
                <div className="container-content">
                    {/* Header moderno com gradiente Xiaomi */}
                    <div className="content-card">
                        <div className="page-header">
                            <div className="header-icon">
                                {statusInfo.icon}
                            </div>
                            <h1 className="header-title">
                                {statusInfo.text}
                            </h1>
                            <p className="header-subtitle">
                                Sua transação está sendo processada
                            </p>
                            {orderId && (
                                <div className="order-id-display">
                                    Pedido: {orderId}
                                </div>
                            )}
                        </div>
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
                        )}

                        {/* Dados do Pagamento */}
                        {paymentData && (
                            <>
                                {/* QR Code PIX - Seção Especial */}
                                {paymentData.qr_codes && paymentData.qr_codes.length > 0 && (
                                    <div className="content-card pix-card">
                                        <div className="pix-header">
                                            <div className="pix-icon">🔵</div>
                                            <h3 className="pix-title">
                                                Pagamento via PIX
                                            </h3>
                                        </div>
                                        
                                        {paymentData.qr_codes.map((qrCode, index) => (
                                            <div key={qrCode.id}>
                                                {/* QR Code Image */}
                                                {qrCode.links && qrCode.links.find(link => link.media === 'image/png') && (
                                                    <div className="qr-container">
                                                        <img 
                                                            src={qrCode.links.find(link => link.media === 'image/png').href}
                                                            alt="QR Code PIX"
                                                            className="qr-image"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div style={{display: 'none'}} className="qr-fallback">
                                                            QR Code não disponível
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Instruções */}
                                                <div className="instructions-card">
                                                    <h4 className="instructions-title">
                                                        📱 Como pagar:
                                                    </h4>
                                                    <ol className="instructions-list">
                                                        <li>1. Abra o app do seu banco</li>
                                                        <li>2. Escaneie o QR Code acima</li>
                                                        <li>3. Confirme o pagamento</li>
                                                        <li>4. Aguarde a confirmação automática</li>
                                                    </ol>
                                                </div>
                                                
                                                {/* Valor e Expiração */}
                                                <div className="payment-info-grid">
                                                    <div className="info-item">
                                                        <p className="info-label">Valor:</p>
                                                        <p className="info-value value-amount">
                                                            R$ {(qrCode.amount.value / 100).toFixed(2)}
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
                                            </p>
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
                        )}

                        {/* Ações */}
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

            {/* Estilos modernos Xiaomi */}
            <style jsx>{`
                .confirmation-container {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    padding: 32px 0;
                }
                
                .container-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 24px;
                }
                
                .content-card {
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    margin-bottom: 24px;
                    position: relative;
                    border: 1px solid transparent;
                    background-clip: padding-box;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                }
                
                .content-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
                    z-index: -1;
                    margin: -2px;
                    border-radius: inherit;
                }
                
                .page-header {
                    background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
                    padding: 48px 32px;
                    text-align: center;
                    color: white;
                    position: relative;
                    overflow: hidden;
                }
                
                .page-header::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                    animation: xiaomiShine 6s ease-in-out infinite;
                }
                
                @keyframes xiaomiShine {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .header-icon {
                    width: 96px;
                    height: 96px;
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 48px;
                    margin: 0 auto 24px;
                    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                }
                
                .header-title {
                    font-size: 36px;
                    font-weight: 800;
                    margin-bottom: 12px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                
                .header-subtitle {
                    font-size: 18px;
                    opacity: 0.95;
                    font-weight: 500;
                    letter-spacing: 0.5px;
                }
                
                .order-id-display {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 16px 32px;
                    border-radius: 50px;
                    font-weight: 700;
                    font-size: 16px;
                    margin-top: 24px;
                    display: inline-block;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    backdrop-filter: blur(10px);
                }
                
                .main-content {
                    padding: 0;
                }
                
                .error-card {
                    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                    border: 2px solid #ef4444;
                    border-radius: 16px;
                    padding: 40px;
                    margin: 24px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .error-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                    position: relative;
                    z-index: 1;
                }
                
                .error-icon {
                    font-size: 64px;
                    filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.1));
                }
                
                .error-text {
                    color: #dc2626;
                    font-weight: 700;
                    font-size: 20px;
                    text-align: center;
                }
                
                .loading-card {
                    text-align: center;
                    padding: 64px 40px;
                    position: relative;
                }
                
                .loading-spinner {
                    width: 64px;
                    height: 64px;
                    border: 4px solid #e5e7eb;
                    border-top: 4px solid #ff6900;
                    border-radius: 50%;
                    animation: xiaomiSpin 1s linear infinite;
                    margin: 0 auto 24px;
                    box-shadow: 0 8px 32px rgba(255, 105, 0, 0.2);
                }
                
                @keyframes xiaomiSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .loading-text {
                    color: #475569;
                    font-weight: 600;
                    font-size: 18px;
                    margin-bottom: 8px;
                }
                
                .loading-counter {
                    color: #ff6900;
                    font-weight: 800;
                    font-size: 16px;
                }
                
                .pix-card {
                    background: linear-gradient(135deg, rgba(255,105,0,0.03), rgba(0,168,225,0.03));
                    padding: 40px;
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
                    background: linear-gradient(45deg, transparent, rgba(255, 105, 0, 0.05), transparent);
                    animation: pixShine 8s ease-in-out infinite;
                }
                
                @keyframes pixShine {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .pix-header {
                    text-align: center;
                    margin-bottom: 32px;
                    position: relative;
                    z-index: 1;
                }
                
                .pix-icon {
                    width: 88px;
                    height: 88px;
                    background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 40px;
                    margin: 0 auto 20px;
                    box-shadow: 0 16px 48px rgba(255, 105, 0, 0.3);
                    border: 3px solid rgba(255, 255, 255, 0.3);
                }
                
                .pix-title {
                    font-size: 28px;
                    font-weight: 800;
                    background: linear-gradient(90deg, #ff6900, #00a8e1);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .qr-container {
                    background: white;
                    padding: 32px;
                    border-radius: 20px;
                    box-shadow: 0 16px 64px rgba(0, 0, 0, 0.1);
                    margin-bottom: 32px;
                    text-align: center;
                    position: relative;
                    z-index: 1;
                    border: 1px solid rgba(255, 105, 0, 0.1);
                }
                
                .qr-image {
                    width: 300px;
                    height: 300px;
                    margin: 0 auto;
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    border: 2px solid #f1f5f9;
                }
                
                .qr-fallback {
                    width: 300px;
                    height: 300px;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #64748b;
                    font-weight: 600;
                    border-radius: 16px;
                    margin: 0 auto;
                    border: 2px dashed #cbd5e1;
                }
                
                .instructions-card {
                    background: linear-gradient(135deg, rgba(255,105,0,0.05), rgba(0,168,225,0.05));
                    border: 1px solid rgba(255, 105, 0, 0.2);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    position: relative;
                    z-index: 1;
                }
                
                .instructions-title {
                    font-weight: 800;
                    background: linear-gradient(90deg, #ff6900, #00a8e1);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 18px;
                }
                
                .instructions-list {
                    color: #334155;
                    font-size: 15px;
                    line-height: 1.8;
                    font-weight: 500;
                }
                
                .instructions-list li {
                    margin-bottom: 8px;
                    padding-left: 8px;
                }
                
                .payment-info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                    margin-bottom: 24px;
                    position: relative;
                    z-index: 1;
                }
                
                .info-item {
                    background: white;
                    padding: 24px;
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 105, 0, 0.1);
                    position: relative;
                    overflow: hidden;
                }
                
                .info-item::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #ff6900, #00a8e1);
                }
                
                .info-label {
                    color: #64748b;
                    font-size: 12px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .info-value {
                    font-weight: 800;
                    font-size: 20px;
                }
                
                .value-amount {
                    background: linear-gradient(90deg, #059669, #10b981);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .value-expiry {
                    color: #dc2626;
                    font-size: 16px;
                    font-weight: 700;
                }
                
                .copy-section {
                    background: white;
                    padding: 24px;
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    margin-bottom: 24px;
                    position: relative;
                    z-index: 1;
                    border: 1px solid rgba(255, 105, 0, 0.1);
                }
                
                .copy-label {
                    color: #334155;
                    font-size: 15px;
                    margin-bottom: 16px;
                    font-weight: 600;
                }
                
                .copy-container {
                    display: flex;
                    gap: 16px;
                    align-items: stretch;
                }
                
                .copy-input {
                    flex: 1;
                    padding: 16px;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 13px;
                    background: #f8fafc;
                    font-family: 'Courier New', monospace;
                    word-break: break-all;
                    transition: all 0.3s ease;
                }
                
                .copy-input:focus {
                    outline: none;
                    border-color: #ff6900;
                    box-shadow: 0 0 0 3px rgba(255, 105, 0, 0.1);
                }
                
                .copy-button {
                    background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
                    color: white;
                    border: none;
                    padding: 16px 32px;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    white-space: nowrap;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    box-shadow: 0 8px 32px rgba(255, 105, 0, 0.3);
                }
                
                .copy-button:hover {
                    background: linear-gradient(135deg, #00a8e1 0%, #ff6900 100%);
                    transform: translateY(-2px) scale(1.02);
                    box-shadow: 0 12px 48px rgba(255, 105, 0, 0.4);
                }
                
                .copy-button:active {
                    transform: translateY(0) scale(0.98);
                }
                
                .payment-status {
                    text-align: center;
                    padding: 24px;
                    border-radius: 16px;
                    font-weight: 700;
                    position: relative;
                    z-index: 1;
                    font-size: 16px;
                }
                
                .status-paid {
                    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                    border: 2px solid #10b981;
                    color: #065f46;
                    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.2);
                }
                
                .status-waiting {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    border: 2px solid #f59e0b;
                    color: #92400e;
                    animation: xiaomiPulse 2s ease-in-out infinite;
                    box-shadow: 0 8px 32px rgba(245, 158, 11, 0.2);
                }
                
                @keyframes xiaomiPulse {
                    0%, 100% { 
                        opacity: 1; 
                        transform: scale(1);
                    }
                    50% { 
                        opacity: 0.9; 
                        transform: scale(1.02);
                    }
                }
                
                .info-card {
                    background: linear-gradient(135deg, rgba(255,105,0,0.02), rgba(0,168,225,0.02));
                    margin: 24px;
                    padding: 32px;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 105, 0, 0.1);
                    position: relative;
                    overflow: hidden;
                }
                
                .info-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #ff6900, #00a8e1);
                }
                
                .info-title {
                    font-size: 24px;
                    font-weight: 800;
                    background: linear-gradient(90deg, #ff6900, #00a8e1);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 20px;
                    padding-bottom: 12px;
                    border-bottom: 2px solid rgba(255, 105, 0, 0.1);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .info-content {
                    color: #334155;
                    font-weight: 500;
                }
                
                .info-item-inline {
                    margin-bottom: 12px;
                    line-height: 1.8;
                    font-size: 15px;
                }
                
                .info-label-inline {
                    font-weight: 700;
                    color: #1e293b;
                }
                
                .action-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    justify-content: center;
                    padding: 40px 32px;
                    background: linear-gradient(135deg, rgba(255,105,0,0.02), rgba(0,168,225,0.02));
                    border-radius: 20px 20px 0 0;
                    margin-top: 24px;
                    border-top: 1px solid rgba(255, 105, 0, 0.1);
                }
                
                .action-button {
                    padding: 18px 36px;
                    border-radius: 16px;
                    font-weight: 700;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    border: none;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    min-width: 180px;
                    position: relative;
                    overflow: hidden;
                }
                
                .action-button::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.5s;
                }
                
                .action-button:hover::before {
                    left: 100%;
                }
                
                .btn-primary {
                    background: linear-gradient(135deg, #ff6900 0%, #ff8f00 100%);
                    color: white;
                    box-shadow: 0 8px 32px rgba(255, 105, 0, 0.3);
                }
                
                .btn-primary:hover {
                    background: linear-gradient(135deg, #ff8f00 0%, #ff6900 100%);
                    transform: translateY(-4px) scale(1.02);
                    box-shadow: 0 12px 48px rgba(255, 105, 0, 0.5);
                }
                
                .btn-secondary {
                    background: linear-gradient(135deg, #64748b 0%, #475569 100%);
                    color: white;
                    box-shadow: 0 8px 32px rgba(100, 116, 139, 0.3);
                }
                
                .btn-secondary:hover {
                    background: linear-gradient(135deg, #475569 0%, #334155 100%);
                    transform: translateY(-4px) scale(1.02);
                    box-shadow: 0 12px 48px rgba(100, 116, 139, 0.4);
                }
                
                .btn-refresh {
                    background: linear-gradient(135deg, #ff6900 0%, #00a8e1 100%);
                    color: white;
                    box-shadow: 0 8px 32px rgba(255, 105, 0, 0.3);
                }
                
                .btn-refresh:hover {
                    background: linear-gradient(135deg, #00a8e1 0%, #ff6900 100%);
                    transform: translateY(-4px) scale(1.02);
                    box-shadow: 0 12px 48px rgba(0, 168, 225, 0.4);
                }
                
                .btn-refresh:disabled {
                    background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: 0 4px 16px rgba(156, 163, 175, 0.2);
                }
                
                .btn-refresh:disabled::before {
                    display: none;
                }
                
                @media (max-width: 768px) {
                    .container-content {
                        padding: 0 16px;
                    }
                    
                    .confirmation-container {
                        padding: 16px 0;
                    }
                    
                    .page-header {
                        padding: 32px 24px;
                    }
                    
                    .header-title {
                        font-size: 28px;
                    }
                    
                    .header-subtitle {
                        font-size: 16px;
                    }
                    
                    .header-icon {
                        width: 80px;
                        height: 80px;
                        font-size: 40px;
                        margin-bottom: 20px;
                    }
                    
                    .pix-card {
                        padding: 24px;
                    }
                    
                    .pix-icon {
                        width: 72px;
                        height: 72px;
                        font-size: 32px;
                    }
                    
                    .pix-title {
                        font-size: 24px;
                    }
                    
                    .payment-info-grid {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                    
                    .copy-container {
                        flex-direction: column;
                        gap: 12px;
                    }
                    
                    .action-buttons {
                        flex-direction: column;
                        align-items: stretch;
                        padding: 24px 20px;
                    }
                    
                    .action-button {
                        min-width: auto;
                    }
                    
                    .qr-image, .qr-fallback {
                        width: 260px;
                        height: 260px;
                    }
                    
                    .info-card {
                        margin: 16px;
                        padding: 24px;
                    }
                    
                    .loading-card {
                        padding: 40px 24px;
                    }
                    
                    .error-card {
                        padding: 32px 24px;
                        margin: 16px;
                    }
                }
                
                @media (max-width: 480px) {
                    .qr-image, .qr-fallback {
                        width: 220px;
                        height: 220px;
                    }
                    
                    .header-title {
                        font-size: 24px;
                        letter-spacing: 1px;
                    }
                    
                    .pix-title {
                        font-size: 20px;
                    }
                    
                    .copy-input {
                        font-size: 12px;
                        padding: 12px;
                    }
                    
                    .copy-button {
                        padding: 12px 24px;
                        font-size: 13px;
                    }
                }
            `}</style>
        </Layout>
    );
};

export default PaymentConfirmation;
