import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '../../../v2/cart/hooks/useCart';
import { isEmpty } from 'lodash';
import LoadingSpinner from '../../LoadingSpinner';

const CartItemsContainer = () => {
	// Use Cart v2 hook
	const { 
		cartItems, 
		cartCount, 
		cartTotal, 
		loading: cartLoading, 
		removeFromCart, 
		updateCartItem,
		clearCart: clearCartV2,
		error: cartError 
	} = useCart();
	
	const [requestError, setRequestError] = useState(null);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isClearing, setIsClearing] = useState(false);

	// Handle remove product click
	const handleRemoveProductClick = async (event, productId) => {
		event.stopPropagation();
		setIsUpdating(true);
		
		try {
			await removeFromCart(productId);
		} catch (error) {
			setRequestError('Erro ao remover item do carrinho');
			console.error('Error removing item:', error);
		} finally {
			setIsUpdating(false);
		}
	};

	// Handle quantity update
	const handleQuantityUpdate = async (productId, newQuantity) => {
		if (newQuantity < 1) {
			handleRemoveProductClick({ stopPropagation: () => {} }, productId);
			return;
		}

		setIsUpdating(true);
		try {
			await updateCartItem(productId, newQuantity);
		} catch (error) {
			setRequestError('Erro ao atualizar quantidade');
			console.error('Error updating quantity:', error);
		} finally {
			setIsUpdating(false);
		}
	};

	// Clear the entire cart
	const handleClearCart = async (event) => {
		event.stopPropagation();
		
		if (isClearing) return;
		
		setIsClearing(true);
		try {
			await clearCartV2();
		} catch (error) {
			setRequestError('Erro ao limpar carrinho');
			console.error('Error clearing cart:', error);
		} finally {
			setIsClearing(false);
		}
	};

	// Show loading state
	if (cartLoading) {
		return (
			<div className="cart product-cart-container container mx-auto my-32 px-4 xl:px-0">
				<div className="flex flex-col items-center justify-center py-12">
					<LoadingSpinner />
					<p className="mt-4 text-gray-600">Carregando carrinho...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="cart product-cart-container container mx-auto my-32 px-4 xl:px-0">
			{!isEmpty(cartItems) ? (
				<div className="woo-next-cart-wrapper container">
					<div className="cart-header grid grid-cols-2 gap-4">
						<h1 className="text-2xl mb-5 uppercase">Carrinho ({cartCount} {cartCount === 1 ? 'item' : 'itens'})</h1>
						{/*Clear entire cart*/}
						<div className="clear-cart text-right">
							<button 
								className="px-4 py-1 bg-gray-500 text-white rounded-sm w-auto" 
								onClick={handleClearCart} 
								disabled={isClearing || isUpdating}
							>
								<span className="woo-next-cart">Limpar Carrinho</span>
								<i className="fa fa-arrow-alt-right"/>
							</button>
							{isClearing && <p>Limpando...</p>}
							{isUpdating && <p>Atualizando...</p>}
						</div>
					</div>
					
					<div className="grid grid-cols-1 xl:grid-cols-4 gap-0 xl:gap-4 mb-5">
						<table className="cart-products table-auto col-span-3 mb-5">
							<thead className="text-left">
								<tr className="woo-next-cart-head-container">
									<th className="woo-next-cart-heading-el" scope="col"></th>
									<th className="woo-next-cart-heading-el" scope="col"></th>
									<th className="woo-next-cart-heading-el" scope="col">Produto</th>
									<th className="woo-next-cart-heading-el" scope="col">Preço</th>
									<th className="woo-next-cart-heading-el" scope="col">Quantidade</th>
									<th className="woo-next-cart-heading-el" scope="col">Total</th>
								</tr>
							</thead>
							<tbody>
								{cartItems.map(item => (
									<tr key={item.id || item.productId} className="woo-next-cart-item">
										<td>
											<button 
												onClick={(e) => handleRemoveProductClick(e, item.id || item.productId)}
												className="text-red-500 hover:text-red-700"
												disabled={isUpdating}
											>
												×
											</button>
										</td>
										<td>
											{item.image && (
												<img 
													src={item.image} 
													alt={item.name} 
													className="w-16 h-16 object-cover"
												/>
											)}
										</td>
										<td>
											<div>
												<h3 className="font-medium">{item.name}</h3>
												{item.variation && <p className="text-sm text-gray-600">{item.variation}</p>}
											</div>
										</td>
										<td>
											<span>R$ {typeof item.price === 'number' ? item.price.toFixed(2) : item.price}</span>
										</td>
										<td>
											<input 
												type="number" 
												value={item.quantity} 
												onChange={(e) => handleQuantityUpdate(item.id || item.productId, parseInt(e.target.value))}
												min="1"
												className="w-16 px-2 py-1 border rounded"
												disabled={isUpdating}
											/>
										</td>
										<td>
											<span>R$ {(typeof item.price === 'number' && typeof item.quantity === 'number') 
												? (item.price * item.quantity).toFixed(2) 
												: '0.00'}</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						{/*Cart Total*/}
						<div className="row woo-next-cart-total-container border p-5 bg-gray-200">
							<div className="">
								<table className="table table-hover mb-5">
									<tbody>
										<tr className="table-light flex flex-col">
											<td className="woo-next-cart-element-total text-2xl font-normal">Subtotal</td>
											<td className="woo-next-cart-element-amt text-2xl font-bold">
												R$ {typeof cartTotal === 'number' ? cartTotal.toFixed(2) : cartTotal}
											</td>
										</tr>
									</tbody>
								</table>
								<Link href="/checkout">
									<button className="bg-purple-600 text-white px-5 py-3 rounded-sm w-auto xl:w-full">
										<span className="woo-next-cart-checkout-txt">Finalizar Pedido</span>
										<i className="fas fa-long-arrow-alt-right"/>
									</button>
								</Link>
							</div>
						</div>
					</div>

					{/* Display Errors if any */}
					{(requestError || cartError) && (
						<div className="row woo-next-cart-total-container mt-5 p-4 bg-red-100 text-red-700 rounded"> 
							{requestError || cartError} 
						</div>
					)}
				</div>
			) : (
				<div className="container mx-auto my-32 px-4 xl:px-0">
					<h2 className="text-2xl mb-5">Nenhum item no carrinho</h2>
					<Link href="/">
						<button className="bg-purple-600 text-white px-5 py-3 rounded-sm">
							<span className="woo-next-cart-checkout-txt">Adicionar Produtos</span>
							<i className="fas fa-long-arrow-alt-right"/>
						</button>
					</Link>
				</div>
			)}
		</div>
	);
};

export default CartItemsContainer;
