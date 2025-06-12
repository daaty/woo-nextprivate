import { useState, useRef, useCallback, useEffect } from 'react';
import { v4 } from "uuid";
import { getUpdatedItems } from "../../../functions";
import {Cross, Loading} from "../../icons";
import { cartLockHelpers } from "../../../utils/cart-lock";

const CartItem = ( {
	                   item,
	                   products,
					   updateCartProcessing,
	                   handleRemoveProductClick,
	                   updateCart,
                   } ) => {

	const [productCount, setProductCount] = useState( item.qty );
	const [isUpdating, setIsUpdating] = useState(false);
	const lastUpdateTimeRef = useRef(0);
	const updateTimeoutRef = useRef(null);

	/*
	 * When user changes the qty from product input update the cart in localStorage
	 * Also update the cart in global context - with race condition protection
	 *
	 * @param {Object} event event
	 *
	 * @return {void}
	 */
	const handleQtyChange = useCallback(( event, cartKey ) => {
		if ( process.browser ) {
			event.stopPropagation();

			// Proteção contra múltiplas atualizações rápidas
			const now = Date.now();
			if (now - lastUpdateTimeRef.current < 300) {
				console.log('🚫 [CartItem] Atualização muito rápida, ignorando');
				return;
			}
			lastUpdateTimeRef.current = now;

			// If the previous update cart mutation request is still processing, then return.
			if ( updateCartProcessing || isUpdating ) {
				console.log('🚫 [CartItem] Atualização em progresso, ignorando');
				return;
			}

			// If the user tries to delete the count of product, set that to 1 by default ( This will not allow him to reduce it less than zero )
			const newQty = ( event.target.value ) ? parseInt( event.target.value ) : 1;

			// Validar quantidade
			if (newQty < 1 || newQty > 999) {
				console.log('🚫 [CartItem] Quantidade inválida:', newQty);
				return;
			}

			// Set the new qty in state.
			setProductCount( newQty );

			// Limpar timeout anterior se existir
			if (updateTimeoutRef.current) {
				clearTimeout(updateTimeoutRef.current);
			}

			// Debounce a atualização para evitar muitas chamadas
			updateTimeoutRef.current = setTimeout(async () => {
				if ( products.length ) {
					setIsUpdating(true);
					
					try {
						await cartLockHelpers.updateCartItem(cartKey, async () => {
							const updatedItems = getUpdatedItems( products, newQty, cartKey );

							return await updateCart( {
								variables: {
									input: {
										clientMutationId: v4(),
										items: updatedItems
									}
								},
							} );
						});
						
						console.log('✅ [CartItem] Quantidade atualizada com sucesso');
					} catch (error) {
						console.error('❌ [CartItem] Erro ao atualizar quantidade:', error);
						// Reverter a quantidade em caso de erro
						setProductCount(item.qty);
					} finally {
						setIsUpdating(false);
					}
				}
			}, 500); // 500ms de debounce
		}
	}, [products, updateCartProcessing, isUpdating, updateCart, item.qty]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (updateTimeoutRef.current) {
				clearTimeout(updateTimeoutRef.current);
			}
		};
	}, []);


	return (
		<tr className="woo-next-cart-item" key={ item.productId }>
			<th className="woo-next-cart-element woo-next-cart-el-close">
				{/* Remove item */}
				<span className="woo-next-cart-close-icon cursor-pointer"
				      onClick={ ( event ) => handleRemoveProductClick( event, item.cartKey, products ) }>
					<Cross/>
				</span>
			</th>
			<td className="woo-next-cart-element">
				<img width="64" src={ item.image.sourceUrl } srcSet={ item.image.srcSet } alt={ item.image.title }/>
			</td>
			<td className="woo-next-cart-element">{ item.name }</td>
			<td className="woo-next-cart-element">{ ( 'string' !== typeof item.price ) ? item.price.toFixed( 2 ) : item.price }</td>			{/* Qty Input */ }
			<td className="woo-next-cart-element woo-next-cart-qty">
				<div className="relative">
					<input
						type="number"
						min="1"
						max="999"
						data-cart-key={ item.cartKey }
						className={ `woo-next-cart-qty-input form-control ${ (updateCartProcessing || isUpdating) ? 'opacity-50 cursor-not-allowed' : '' } ` }
						value={ productCount }
						onChange={ ( event ) => handleQtyChange( event, item.cartKey ) }
						disabled={ updateCartProcessing || isUpdating }
					/>
					{/* Indicador de loading para a atualização */}
					{isUpdating && (
						<div className="absolute inset-y-0 right-2 flex items-center">
							<Loading className="w-4 h-4 animate-spin" />
						</div>
					)}
				</div>
			</td>
			<td className="woo-next-cart-element">
				{ ( 'string' !== typeof item.totalPrice ) ? item.totalPrice.toFixed( 2 ) : item.totalPrice }
			</td>
		</tr>
	)
};

export default CartItem;
