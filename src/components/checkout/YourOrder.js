import { Fragment } from 'react';
import CheckoutCartItem from "./CheckoutCartItem";
import { formatPrice } from '../../utils/format-price';

const YourOrder = ({ cart }) => {    // Função para extrair valor numérico de strings formatadas de preço
    // Usar o priceToNumber da utility formatPrice em vez de duplicar a lógica
    const extractNumericValue = (priceString) => {
        // Esta é apenas uma camada para manter compatibilidade e registrar logs específicos desta componente
        try {
            // Delegamos o processamento para a função utilitária especializada
            const result = priceToNumber(priceString);
            
            if (isNaN(result) || !isFinite(result)) {
                console.warn('[YourOrder] Valor não numérico detectado:', { priceString });
                return 0;
            }
            
            return result;
        } catch (error) {
            console.error('[YourOrder] Erro ao extrair valor numérico:', error, { priceString });
            return 0;
        }
    };// Subtotal calculado manualmente para precisão
    const calculateSubtotal = () => {
        if (!cart || !cart.products || !cart.products.length) return 0;
        
        const subtotal = cart.products.reduce((total, item) => {
            let itemPrice = 0;
            
            try {
                if (item.totalPrice && typeof item.totalPrice === 'string') {
                    const cleanTotal = item.totalPrice.replace(/&nbsp;/g, ' ');
                    itemPrice = extractNumericValue(cleanTotal) || 0;
                } else if (item.price) {
                    const quantity = parseInt(item.qty || 1);
                    const basePrice = extractNumericValue(item.price) || 0;
                    itemPrice = basePrice * quantity;
                    
                    // Correção para valores pequenos que podem estar em formato incorreto
                    if (itemPrice > 0 && itemPrice < 10 && quantity > 0) {
                        itemPrice *= 1000;
                    }
                }
                
                // Verificar se o resultado é um número válido
                if (isNaN(itemPrice)) {
                    console.warn('[YourOrder] Preço inválido calculado:', { item, itemPrice });
                    itemPrice = 0;
                }
            } catch (error) {
                console.error('[YourOrder] Erro ao calcular preço do item:', error, { item });
                itemPrice = 0;
            }
            
            return total + itemPrice;
        }, 0);
        
        // Verificação final de segurança
        return isNaN(subtotal) ? 0 : subtotal;
    };

    // Valores constantes
    const subtotal = calculateSubtotal();
    const FREE_SHIPPING_THRESHOLD = 199; // Mínimo para frete grátis (R$ 199,00)
    const CASH_PAYMENT_DISCOUNT_PERCENT = 8; // Desconto de 8% para pagamento à vista
    const CASH_PAYMENT_MULTIPLIER = (100 - CASH_PAYMENT_DISCOUNT_PERCENT) / 100; // Multiplica por 0.92 para 8% de desconto
    const MAX_INSTALLMENTS = 12; // Número máximo de parcelas sem juros
    const hasFreightFree = subtotal >= FREE_SHIPPING_THRESHOLD;
    
    return (
        <div className="order-summary bg-white rounded-lg">
            {cart ? (
                <>
                    {/* Resumo do Carrinho */}
                    <div className="px-4 py-6">
                        {/* Produtos */}
                        <div className="product-list divide-y">
                            {cart.products && cart.products.length > 0 && cart.products.map(item => (
                                <div key={item.productId} className="py-4 flex justify-between items-center">
                                    <div className="flex items-center">
                                        <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded border border-gray-200 mr-4">
                                            <img 
                                                src={item.image?.sourceUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDg4QzEwNi42MjcgODggMTEyIDgyLjYyNyAxMTIgNzZDMTEyIDY5LjM3MyAxMDYuNjI3IDY0IDEwMCA2NEM5My4zNzMgNjQgODggNjkuMzczIDg4IDc2Qzg4IDgyLjYyNyA5My4zNzMgODggMTAwIDg4WiIgZmlsbD0iIzlDQTNBRiIvPjxwYXRoIGQ9Ik0xNDAgMTQ0VjEzNkMxNDAgMTIyLjc0NSAxMjkuMjU1IDExMiAxMTYgMTEySDg0QzcwLjc0NSAxMTIgNjAgMTIyLjc0NSA2MCAxMzZWMTQ0SDE0MFoiIGZpbGw9IiM5Q0EzQUYiLz48L3N2Zz4='} 
                                                alt={item.name || 'Produto'}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-gray-800 font-medium">{item.name}</h3>
                                            <p className="text-gray-500 text-sm">Qtd: {item.qty || 1}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">{item.totalPrice}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Frete grátis */}
                        {hasFreightFree && (
                            <div className="rounded-lg p-3 mb-4 mt-4" style={{
                                background: 'linear-gradient(90deg, rgba(220, 252, 231, 0.3), rgba(236, 253, 245, 0.3))',
                                border: '1px solid rgba(209, 250, 229, 0.5)',
                                borderRadius: '8px'
                            }}>
                                <div className="w-full h-1.5 mb-2 rounded-full animate-pulse" style={{
                                    background: 'linear-gradient(90deg, #22c55e, #10b981)'
                                }}></div>
                                <span className="text-green-700 text-sm font-medium">
                                    Você ganhou frete grátis por compras acima de R$ 199,00
                                </span>
                            </div>
                        )}
                        
                        {/* Valores */}
                        <div className="border-t border-dashed pt-4 mt-4">                            <div className="flex justify-between py-2">
                                <div className="text-gray-700">Subtotal:</div>
                                <div className="font-medium">{formatPrice(subtotal || 0)}</div>
                            </div>
                            
                            <div className="flex justify-between py-2">
                                <div className="text-gray-700">Frete:</div>
                                <div className="font-medium">
                                    {hasFreightFree ? (
                                        <span className="text-green-600">Grátis</span>
                                    ) : (
                                        <span className="text-gray-500 italic">Calculado no próximo passo</span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-between py-2">
                                <div className="text-gray-700">Descontos:</div>
                                <div className="font-medium text-green-500">—</div>
                            </div>
                        </div>
                        
                        {/* Total */}
                        <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center mb-2">
                                <span className="text-gray-800 font-bold mr-2">Total:</span>
                                <span className="text-2xl font-bold text-orange-500">{formatPrice(subtotal || 0)}</span>
                            </div>
                            
                            <small className="savings block mt-2">                                <span className="font-medium text-green-700">
                                    {formatPrice((subtotal || 0) * CASH_PAYMENT_MULTIPLIER)}
                                </span>à vista <span className="text-xs">({CASH_PAYMENT_DISCOUNT_PERCENT}% de desconto)</span>
                            </small>
                            
                            <div className="text-sm text-gray-600 mt-1">
                                ou em até <span className="font-medium">{MAX_INSTALLMENTS}x</span> de <span className="font-medium">
                                    {formatPrice((subtotal || 0) / MAX_INSTALLMENTS)}
                                </span> sem juros
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="p-4 text-center text-gray-500">
                    Não há itens no carrinho.
                </div>
            )}
        </div>
    );
};

export default YourOrder;
