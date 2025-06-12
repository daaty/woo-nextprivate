const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDg4QzEwNi42MjcgODggMTEyIDgyLjYyNyAxMTIgNzZDMTEyIDY5LjM3MyAxMDYuNjI3IDY0IDEwMCA2NEM5My4zNzMgNjQgODggNjkuMzczIDg4IDc2Qzg4IDgyLjYyNyA5My4zNzMgODggMTAwIDg4WiIgZmlsbD0iIzlDQTNBRiIvPjxwYXRoIGQ9Ik0xNDAgMTQ0VjEzNkMxNDAgMTIyLjc0NSAxMjkuMjU1IDExMiAxMTYgMTEySDg0QzcwLjc0NSAxMTIgNjAgMTIyLjc0NSA2MCAxMzZWMTQ0SDE0MFoiIGZpbGw9IiM5Q0EzQUYiLz48L3N2Zz4=';

const CheckoutCartItem = ({ item }) => {
    return (
        <div className="flex justify-between items-center py-4 border-b border-gray-100 last:border-none">
            <div className="flex items-center">
                <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded border border-gray-200 mr-4">
                    <img 
                        src={item.image?.sourceUrl || DEFAULT_PLACEHOLDER} 
                        srcSet={item.image?.srcSet || ''} 
                        alt={item.image?.title || item.name || 'Produto'}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_PLACEHOLDER;
                        }}
                    />
                </div>
                <div>
                    <h3 className="text-gray-800 font-medium">{item.name}</h3>
                    <p className="text-gray-500 text-sm">Qtd: {item.qty || 1}</p>
                    
                    {/* Exibir variações do produto, se houver */}
                    {item.variations && Array.isArray(item.variations) && item.variations.length > 0 && (
                        <div className="mt-1 flex flex-wrap">
                            {item.variations.map((variation, i) => (
                                <span key={`variation-${i}`} className="bg-gradient-to-r from-gray-50 to-gray-100 text-xs text-gray-700 px-2 py-0.5 rounded-full mr-1 mb-1 shadow-sm">
                                    {variation}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="text-right">
                <div className="font-medium">{item.totalPrice}</div>
            </div>
        </div>
    );
};

export default CheckoutCartItem;
