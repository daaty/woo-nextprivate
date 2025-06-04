import React, { useEffect, useState } from 'react';

/**
 * Modal de confirmação após adicionar ao carrinho
 * Pergunta ao usuário se deseja continuar comprando ou ir para o carrinho
 * 
 * @param {Object} props Props do componente
 * @param {boolean} props.isOpen Estado de abertura do modal
 * @param {Function} props.onClose Função para fechar o modal
 * @param {Function} props.onContinueShopping Função para continuar comprando
 * @param {Function} props.onGoToCart Função para ir ao carrinho
 * @returns {JSX.Element} Componente de modal
 */
const ContinueIterationModal = ({ 
  isOpen, 
  onClose, 
  onContinueShopping, 
  onGoToCart 
}) => {
  // Auto-fechamento após período de inatividade (opcional)
  const [timeLeft, setTimeLeft] = useState(0);
  const autoCloseTime = 10; // segundos para auto-fechamento
  
  // Reiniciar o temporizador quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(autoCloseTime);
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Por padrão, continuamos comprando após o tempo expirar
            onContinueShopping();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isOpen, onContinueShopping]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Overlay do modal */}
        <div className="fixed inset-0 bg-black opacity-30"></div>

        {/* Modal Content */}
        <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
          {/* Botão de fechamento */}
          <button
            type="button"
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            onClick={onContinueShopping}
          >
            <span className="sr-only">Fechar</span>
            {/* Ícone X simples */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Cabeçalho */}
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Produto adicionado ao carrinho!
          </h3>

          {/* Corpo */}
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              O que você deseja fazer agora?
            </p>

            {/* Timer (opcional) */}
            {timeLeft > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Esta mensagem será fechada em {timeLeft} segundos...
              </p>
            )}
          </div>

          {/* Botões */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-between">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              onClick={onContinueShopping}
            >
              Continuar comprando
            </button>
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              onClick={onGoToCart}
            >
              Ver carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContinueIterationModal;