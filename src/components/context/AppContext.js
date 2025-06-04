import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CART } from '../../queries/get-cart';
import { getFormattedCart } from '../../functions';
import cartStateManager from '../../utils/cart-state-manager';

// Create context with default empty values
export const AppContext = React.createContext({
	cart: null,
	setCart: () => null,
	syncCartWithServer: () => null
});

export const AppProvider = ( props ) => {
	const [ cart, setCart ] = useState( null );
	const [isCartSyncing, setIsCartSyncing] = useState(false);

	// Initialize the cart state manager
	useEffect(() => {
		cartStateManager.initialize();
		
		// Subscribe to cart changes from the state manager
		const unsubscribe = cartStateManager.subscribe((newCart) => {
			console.log('[AppContext] Cart updated by state manager:', newCart);
			setCart(newCart);
		});

		return () => {
			unsubscribe();
		};
	}, []);

	// Initialize cart with WooCommerce GraphQL data
	const { refetch } = useQuery( GET_CART, {
		notifyOnNetworkStatusChange: true,
		fetchPolicy: 'cache-and-network', // Melhor política de cache
		onCompleted: ( data ) => {
			console.log('[AppContext] Query GET_CART completed:', data);
			
			if (isCartSyncing) {
				console.log('[AppContext] Pulando atualização - sincronização em andamento');
				return; // Skip while we are in the middle of sync
			}

			// Only update if we have actual data and we're not in the middle of syncing
			if ( data?.cart ) {
				const formattedCart = getFormattedCart( data );
				console.log('[AppContext] Carrinho formatado:', formattedCart);
				
				// Use cart state manager to update cart
				cartStateManager.updateCart(formattedCart, 'graphql-query');
			} else {
				console.log('[AppContext] Dados do carrinho ausentes ou inválidos:', data);
			}
		},
		onError: (error) => {
			console.error('[AppContext] Erro ao buscar dados do carrinho:', error);
		}
	});

	// Initial cart setup from localStorage - now handled by state manager
	useEffect(() => {
		if ( process.browser ) {
			// The cart state manager will handle localStorage loading
			// Just trigger a server sync after a delay
			setTimeout(() => {
				refetch();
			}, 1000);
		}
	}, []);

	// Add custom function to force sync cart data with server when needed
	const syncCartWithServer = async () => {
		setIsCartSyncing(true);
		try {
			const result = await refetch();
			console.log('✅ [AppContext] Cart synced with server');
			return result;
		} catch (error) {
			console.error('❌ [AppContext] Error syncing cart:', error);
			throw error;
		} finally {
			setIsCartSyncing(false);
		}
	};

	// Enhanced setCart function that uses the state manager
	const updateCart = async (newCartData) => {
		try {
			return await cartStateManager.updateCart(newCartData, 'app-context');
		} catch (error) {
			console.error('[AppContext] Error updating cart:', error);
			throw error;
		}
	};

	// Provide cart state and the sync function to the entire app
	const contextValue = {
		cart,
		setCart: updateCart,
		syncCartWithServer,
		isCartSyncing,
		cartStateManager // Provide direct access for advanced use cases
	};

	return (
		<AppContext.Provider value={ contextValue }>
			{ props.children }
		</AppContext.Provider>
	);
};
