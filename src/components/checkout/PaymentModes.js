import Error from "./Error";

const PaymentModes = ({ input, handleOnChange }) => {
    const { errors, paymentMethod } = input || {};

    return (
        <div className="mt-6">
            <h2 className="text-xl font-medium mb-4 flex items-center">
                <span className="mr-2 text-orange-500">💳</span>
                Forma de Pagamento
            </h2>
            
            <Error errors={errors} fieldName={'paymentMethod'} />
            
            <div className="payment-methods space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                
                {/* === INFINITEPAY - MÉTODO PRINCIPAL === */}
                
                {/* Infinitepay - Checkout Completo */}
                <div className="payment-option">
                    <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-orange-300 transition-colors">
                        <input
                            onChange={handleOnChange}
                            value="infinitepay-checkout"
                            className="form-radio h-5 w-5 text-orange-600"
                            name="paymentMethod"
                            type="radio"
                            checked={'infinitepay-checkout' === paymentMethod}
                        />
                        <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-800 font-medium">Checkout Infinitepay</span>
                                <div className="flex items-center bg-green-100 px-2 py-1 rounded-full">
                                    <span className="text-xs text-green-600 font-medium">Recomendado</span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                PIX, Cartão (até 12x) ou Boleto. Pagamento rápido e seguro.
                            </div>
                            <div className="flex items-center mt-2 space-x-2">
                                <span className="text-lg">⚡</span>
                                <span className="text-xs text-gray-600">PIX • Cartão • Boleto</span>
                            </div>
                        </div>
                    </label>
                </div>

                {/* === OUTROS MÉTODOS (FALLBACK) === */}
                
                {/* Cartão de Crédito / Stripe */}
                <div className="payment-option">
                    <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-orange-300 transition-colors">
                        <input
                            onChange={handleOnChange}
                            value="stripe-mode"
                            className="form-radio h-5 w-5 text-orange-600"
                            name="paymentMethod"
                            type="radio"
                            checked={'stripe-mode' === paymentMethod}
                        />
                        <div className="ml-3">
                            <span className="text-gray-800 font-medium">Cartão de Crédito (Internacional)</span>
                            <div className="text-xs text-gray-500 mt-1">Pague com cartão de crédito via Stripe.</div>
                            
                            <div className="flex items-center mt-2 space-x-2">
                                <span className="text-lg">🌍</span>
                                <span className="text-xs text-gray-600">Visa, Mastercard, Amex (Internacional)</span>
                            </div>
                        </div>
                    </label>
                </div>
                
                {/* PayPal */}
                <div className="payment-option">
                    <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-orange-300 transition-colors">
                        <input
                            onChange={handleOnChange}
                            value="paypal"
                            className="form-radio h-5 w-5 text-orange-600"
                            name="paymentMethod"
                            type="radio"
                            checked={'paypal' === paymentMethod}
                        />
                        <div className="ml-3">
                            <span className="text-gray-800 font-medium">PayPal</span>
                            <div className="text-xs text-gray-500 mt-1">
                                Pague usando sua conta PayPal.
                            </div>
                        </div>
                    </label>
                </div>
                
                {/* Pagamento na entrega / COD */}
                <div className="payment-option">
                    <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-orange-300 transition-colors">
                        <input
                            onChange={handleOnChange}
                            value="cod"
                            className="form-radio h-5 w-5 text-orange-600"
                            name="paymentMethod"
                            type="radio"
                            checked={'cod' === paymentMethod}
                        />
                        <div className="ml-3">
                            <span className="text-gray-800 font-medium">Pagamento na Entrega</span>
                            <div className="text-xs text-gray-500 mt-1">
                                Pague no momento da entrega (dinheiro ou cartão).
                            </div>
                        </div>
                    </label>
                </div>
                
                {/* Outras formas de pagamento (escondidas por padrão) */}
                <div className="hidden">
                    <label>
                        <input onChange={handleOnChange} value="jccpaymentgatewayredirect" name="paymentMethod" type="radio" checked={'jccpaymentgatewayredirect' === paymentMethod}/>
                        <span>JCC</span>
                    </label>
                </div>
                
                <div className="hidden">
                    <label>
                        <input onChange={handleOnChange} value="ccavenue" name="paymentMethod" type="radio" checked={'ccavenue' === paymentMethod}/>
                        <span>CC Avenue</span>
                    </label>
                </div>
            </div>            
            {/* === INSTRUÇÕES DE PAGAMENTO === */}
            
            {/* Instruções Infinitepay */}
            {paymentMethod === 'infinitepay-checkout' && (
                <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 text-sm text-blue-700 rounded-lg">
                    <p className="font-medium mb-2 flex items-center">
                        <span className="mr-2">⚡</span>
                        Checkout Infinitepay:
                    </p>
                    <ul className="space-y-1 text-xs">
                        <li>• Você será redirecionado para o checkout seguro da Infinitepay</li>
                        <li>• Pague com PIX (instantâneo), Cartão de Crédito (até 12x) ou Boleto</li>
                        <li>• Aprovação rápida e segura</li>
                        <li>• Retorno automático após o pagamento</li>
                    </ul>
                    <div className="mt-2 flex items-center text-xs bg-blue-100 p-2 rounded">
                        <span className="mr-1">🛡️</span>
                        <span className="font-medium">Checkout otimizado para conversão</span>
                    </div>
                </div>
            )}

            {/* Instruções legadas */}
            {paymentMethod === 'bacs' && (
                <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 text-sm text-blue-700 rounded">
                    <p className="font-medium mb-1">Instruções para Boleto:</p>
                    <p>Após finalizar seu pedido, você receberá um e-mail com o boleto para pagamento. O prazo de compensação é de até 3 dias úteis.</p>
                </div>
            )}
            
            {paymentMethod === 'cheque' && (
                <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 text-sm text-blue-700 rounded">
                    <p className="font-medium mb-1">Instruções para PIX:</p>
                    <p>Após finalizar seu pedido, você receberá um e-mail com a chave PIX e as instruções para pagamento.</p>
                </div>
            )}
            
            {paymentMethod === 'cod' && (
                <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 text-sm text-yellow-700 rounded">
                    <p className="font-medium mb-1">Pagamento na Entrega:</p>
                    <p>Verifique se a opção de pagamento na entrega está disponível para o seu CEP antes de finalizar o pedido. Aceitamos dinheiro e cartão.</p>
                </div>
            )}

            {/* Informações de segurança geral */}
            <div className="mt-4 bg-gray-50 border border-gray-200 p-3 rounded-lg">
                <div className="flex items-center justify-center space-x-6 text-xs text-gray-600">
                    <div className="flex items-center">
                        <span className="mr-1">🔒</span>
                        <span>Pagamento Seguro</span>
                    </div>
                    <div className="flex items-center">
                        <span className="mr-1">🛡️</span>
                        <span>SSL Criptografado</span>
                    </div>
                    <div className="flex items-center">
                        <span className="mr-1">✅</span>
                        <span>PCI Compliance</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModes;
