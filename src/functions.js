import { v4 } from 'uuid';
import {isEmpty, isArray} from 'lodash'

/**
 * Extracts and returns float value from a string.
 *
 * @param {string} string String
 * @return {any}
 */
export const getFloatVal = ( string ) => {
	// Se for undefined ou null, retorna 0
	if (!string) return 0;
	
	// Se for um número, retorna diretamente
	if (typeof string === 'number') return parseFloat(string.toFixed(2));
	
	try {
		// Usar a função utilitária de conversão de preço para número para maior consistência
		if (typeof window !== 'undefined' && window.priceToNumber) {
			const numericValue = window.priceToNumber(string);
			// Verificação de segurança
			if (!isNaN(numericValue) && isFinite(numericValue)) {
				return parseFloat(numericValue.toFixed(2));
			}
		}
		
		// Método de fallback se a função global não estiver disponível
		// Remover entidades HTML e caracteres não numéricos exceto ponto e vírgula
		const cleanString = string.toString()
			.replace(/&nbsp;/g, ' ')
			.replace(/[^\d,.]/g, '');
		
		// Tratar formato brasileiro com pontos de milhar e vírgula decimal
		let floatValue;
		if (cleanString.includes('.') && cleanString.includes(',')) {
			// Formato brasileiro (1.234,56)
			floatValue = parseFloat(cleanString.replace(/\./g, '').replace(',', '.'));
		} else if (cleanString.includes(',')) {
			// Formato europeu (1234,56)
			floatValue = parseFloat(cleanString.replace(',', '.'));
		} else {
			// Formato americano ou simples (1234.56)
			floatValue = parseFloat(cleanString);
		}
		
		return isNaN(floatValue) ? 0 : parseFloat(floatValue.toFixed(2));
	} catch (error) {
		console.error('[getFloatVal] Erro ao extrair valor numérico:', error, {string});
		return 0;
	}
};

/**
 * Add first product.
 *
 * @param {Object} product Product
 * @return {{totalProductsCount: number, totalProductsPrice: any, products: Array}}
 */
export const addFirstProduct = ( product ) => {

	let productPrice = getFloatVal( product.price );

	let newCart = {
		products: [],
		totalProductsCount: 1,
		totalProductsPrice: productPrice
	};

	const newProduct = createNewProduct( product, productPrice, 1 );
	newCart.products.push( newProduct );

	localStorage.setItem( 'woo-next-cart', JSON.stringify( newCart ) );

	return newCart;
};

/**
 * Create a new product object.
 *
 * @param {Object} product Product
 * @param {Integer} productPrice Product Price
 * @param {Integer} qty Quantity
 * @return {{image: *, productId: *, totalPrice: number, price: *, qty: *, name: *}}
 */
export const createNewProduct = ( product, productPrice, qty ) => {

	// Validar se temos dados mínimos necessários
	const productId = product.productId || product.databaseId || product.id;
	
	if (!productId) {
		console.error('[createNewProduct] Produto sem ID válido:', product);
		throw new Error('Produto sem ID válido não pode ser adicionado ao carrinho');
	}

	return  {
		productId: productId,
		image: product.image,
		name: product.name,
		price: productPrice,
		qty,
		totalPrice: parseFloat( ( productPrice * qty ).toFixed( 2 ) )
	};

};

/**
 * Updates the existing cart with new item.
 *
 * @param {Object} existingCart Existing Cart.
 * @param {Object} product Product.
 * @param {Integer} qtyToBeAdded Quantity.
 * @param {Integer} newQty New Qty to be updated.
 * @return {{totalProductsCount: *, totalProductsPrice: *, products: *}}
 */
export const updateCart = ( existingCart, product, qtyToBeAdded, newQty = false  ) => {

	const updatedProducts = getUpdatedProducts( existingCart.products , product, qtyToBeAdded, newQty );

	const addPrice = (total, item) => {
		total.totalPrice += item.totalPrice;
		total.qty += item.qty;

		return total;
	};

	// Loop through the updated product array and add the totalPrice of each item to get the totalPrice
	let total = updatedProducts.reduce( addPrice, { totalPrice: 0, qty: 0 } );

	const updatedCart = {
		products: updatedProducts,
		totalProductsCount: parseInt( total.qty ),
		totalProductsPrice: parseFloat( total.totalPrice )
	};

	localStorage.setItem( 'woo-next-cart', JSON.stringify( updatedCart ) );

	return updatedCart;
};

/**
 * Get updated products array
 * Update the product if it exists else,
 * add the new product to existing cart,
 *
 * @param {Object} existingProductsInCart Existing product in cart
 * @param {Object} product Product
 * @param {Integer} qtyToBeAdded Quantity
 * @param {Integer} newQty New qty of the product (optional)
 * @return {*[]}
 */
export const getUpdatedProducts = ( existingProductsInCart, product, qtyToBeAdded, newQty = false ) => {

	// Check if the product already exits in the cart.
	const productExitsIndex = isProductInCart( existingProductsInCart, product.productId );

	// If product exits ( index of that product found in the array ), update the product quantity and totalPrice
	if ( -1 < productExitsIndex ) {
		let updatedProducts = existingProductsInCart;
		let updatedProduct = updatedProducts[ productExitsIndex ];

		// If have new qty of the product available, set that else add the qtyToBeAdded
		updatedProduct.qty = ( newQty ) ? parseInt( newQty ) : parseInt( updatedProduct.qty + qtyToBeAdded );
		updatedProduct.totalPrice = parseFloat( ( updatedProduct.price * updatedProduct.qty ).toFixed( 2 ) );

		return  updatedProducts;
	} else {

		// If product not found push the new product to the existing product array.
		let productPrice = getFloatVal( product.price );
		const newProduct = createNewProduct( product, productPrice, qtyToBeAdded );
		existingProductsInCart.push( newProduct );

		return existingProductsInCart;
	}
};

/**
 * Returns index of the product if it exists.
 *
 * @param {Object} existingProductsInCart Existing Products.
 * @param {Integer} productId Product id.
 * @return {number | *} Index Returns -1 if product does not exist in the array, index number otherwise
 */
const isProductInCart = ( existingProductsInCart, productId ) => {

	// Validar se temos um productId válido
	if (!productId) {
		return -1;
	}

	const returnItemThatExits = ( item, index ) => {
		// Adicionar validação para evitar comparação com valores null/undefined
		if ( productId === item.productId && item.productId ) {
			return item;
		}
	};

	// This new array will only contain the product which is matched.
	const newArray = existingProductsInCart.filter( returnItemThatExits );

	return existingProductsInCart.indexOf( newArray[0] );
};

/**
 * Remove Item from the cart.
 *
 * @param {Integer} productId Product Id.
 * @return {any | string} Updated cart
 */
export const removeItemFromCart = ( productId ) => {

	let existingCart = localStorage.getItem( 'woo-next-cart' );
	existingCart = JSON.parse( existingCart );

	// If there is only one item in the cart, delete the cart.
	if ( 1 === existingCart.products.length ) {

		localStorage.removeItem( 'woo-next-cart' );
		return null;

	}

	// Check if the product already exits in the cart.
	const productExitsIndex = isProductInCart( existingCart.products, productId );

	// If product to be removed exits
	if ( -1 < productExitsIndex ) {

		const productTobeRemoved = existingCart.products[ productExitsIndex ];
		const qtyToBeRemovedFromTotal = productTobeRemoved.qty;
		const priceToBeDeductedFromTotal = productTobeRemoved.totalPrice;

		// Remove that product from the array and update the total price and total quantity of the cart
		let updatedCart = existingCart;
		updatedCart.products.splice( productExitsIndex, 1 );
		updatedCart.totalProductsCount = updatedCart.totalProductsCount - qtyToBeRemovedFromTotal;
		updatedCart.totalProductsPrice = updatedCart.totalProductsPrice - priceToBeDeductedFromTotal;

		localStorage.setItem( 'woo-next-cart', JSON.stringify( updatedCart ) );
		return updatedCart;

	} else {
		return existingCart;
	}
};

/**
 * Returns cart data in the required format.
 * @param {String} data Cart data
 */
export const getFormattedCart = ( data ) => {
	console.log('[getFormattedCart] Iniciando formatação do carrinho:', data);

	// Se não há dados ou o cart não existe, tentar usar o carrinho atual do localStorage
	if ( undefined === data || !data.cart ) {
		console.log('[getFormattedCart] Dados ausentes, verificando localStorage');
		
		// Tentar recuperar do localStorage para manter a persistência
		try {
			if (typeof window !== 'undefined') {
				const localCart = localStorage.getItem('woo-next-cart');
				if (localCart) {
					const parsedCart = JSON.parse(localCart);
					console.log('[getFormattedCart] Recuperando carrinho do localStorage:', parsedCart);
					return parsedCart;
				}
			}
		} catch (e) {
			console.error('[getFormattedCart] Erro ao ler localStorage:', e);
		}
		
		// Se não tiver no localStorage, retornar vazio
		console.log('[getFormattedCart] Dados ausentes, retornando carrinho vazio');
		return {
			products: [],
			totalProductsCount: 0,
			totalProductsPrice: '0'
		};
	}

	// Verificar se o conteúdo do carrinho está presente
	if ( !data.cart.contents || !data.cart.contents.nodes ) {
		console.warn('[getFormattedCart] Estrutura do carrinho inválida:', data.cart);
		
		// Tentar recuperar do localStorage para manter a persistência
		try {
			if (typeof window !== 'undefined') {
				const localCart = localStorage.getItem('woo-next-cart');
				if (localCart) {
					const parsedCart = JSON.parse(localCart);
					console.log('[getFormattedCart] Usando carrinho do localStorage devido a estrutura inválida:', parsedCart);
					return parsedCart;
				}
			}
		} catch (e) {
			console.error('[getFormattedCart] Erro ao ler localStorage:', e);
		}
		
		return {
			products: [],
			totalProductsCount: 0,
			totalProductsPrice: data.cart.total || '0'
		};
	}
	
	// Se o cart existe mas não tem itens, verificar se houve um item adicionado recentemente em localStorage
	if ( !data.cart.contents.nodes.length ) {
		console.log('[getFormattedCart] Carrinho existe mas está vazio - nodes.length =', data.cart.contents.nodes.length);
		
		// CORREÇÃO CRÍTICA: Não usar backups quando estamos processando uma resposta válida da API
		// Se a API retorna explicitamente que não há itens, aceitar isso como verdade
		console.log('[getFormattedCart] API confirma carrinho vazio, retornando estado vazio');
		return {
			products: [],
			totalProductsCount: 0,
			totalProductsPrice: data?.cart?.total ?? '0'
		};
	}

	const givenProducts = data.cart.contents.nodes;
	console.log('[getFormattedCart] Processando', givenProducts.length, 'produtos');

	// Create an empty object.
	let formattedCart = {};
	formattedCart.products = [];
	let totalProductsCount = 0;
	
	for( let i = 0; i < givenProducts.length; i++  ) {
		const givenProduct = givenProducts?.[ i ]?.product?.node;
		const product = {};
		let total = getFloatVal( givenProducts[ i ].total );

		// Melhor validação para productId - tentar múltiplas fontes
		const productId = givenProduct?.productId || givenProduct?.databaseId || givenProduct?.id;
		
		// Se não conseguirmos obter um productId válido, pular este item
		if (!productId) {
			console.warn('[getFormattedCart] Item sem productId válido ignorado:', givenProduct);
			continue;
		}

		product.productId = productId;
		product.cartKey = givenProducts?.[ i ]?.key ?? '';
		product.key = product.cartKey; // Alias para compatibilidade
		product.name = givenProduct?.name ?? '';
		product.qty = givenProducts?.[ i ]?.quantity;
		
		// Melhor tratamento de preços
		const rawTotal = givenProducts?.[ i ]?.total ?? '0';
		total = getFloatVal(rawTotal);
		
		// Se o total for 0, tentamos obter o preço do produto diretamente
		if (total === 0 && givenProduct?.price) {
			const productPrice = getFloatVal(givenProduct.price);
			product.price = productPrice;
			product.totalPrice = (productPrice * product.qty).toFixed(2);
			console.log(`[getFormattedCart] Preço corrigido para ${product.name}: ${product.price} (total: ${product.totalPrice})`);
		} else {
			// Normal flow - calculate from total
			product.price = product.qty > 0 ? total / product.qty : 0;
			product.totalPrice = rawTotal;
		}
		
		product.image = {
			sourceUrl: givenProduct?.image?.sourceUrl ?? '',
			srcSet: givenProduct?.image?.srcSet ?? '',
			title: givenProduct?.image?.title ?? '',
			altText: givenProduct?.image?.altText ?? ''
		};

		totalProductsCount += givenProducts?.[ i ]?.quantity;

		// Push each item into the products array.
		formattedCart.products.push( product );
	}
	
	formattedCart.totalProductsCount = totalProductsCount;
	
	// Calcular o total manualmente se necessário
	let calculatedTotal = 0;
	// Somar preços de todos os produtos
	formattedCart.products.forEach(product => {
		// Usar o preço unitário * quantidade
		if (typeof product.price === 'number' && typeof product.qty === 'number') {
			calculatedTotal += product.price * product.qty;
		}
	});
	
	// Salvar os valores
	formattedCart.numericTotal = calculatedTotal;
	
	// Se o total retornado pela API for zero ou duvidoso, mas temos produtos, usar o total calculado
	const apiTotal = getFloatVal(data?.cart?.total);
	
	// Verificar se o total da API é confiável (pode ser zero ou muito diferente do calculado)
	const isApiTotalReliable = apiTotal > 0 && Math.abs(apiTotal - calculatedTotal) < (calculatedTotal * 0.1); // 10% de tolerância
	
	if (!isApiTotalReliable && calculatedTotal > 0) {
		console.log(`[getFormattedCart] API retornou total ${apiTotal}, mas temos ${calculatedTotal} calculado manualmente`);
		formattedCart.totalProductsPrice = `R$ ${calculatedTotal.toFixed(2).replace('.', ',')}`;
		// Salvar também o valor numérico correto
		formattedCart.numericTotalFinal = calculatedTotal;
	} else {
		formattedCart.totalProductsPrice = data?.cart?.total ?? '';
		// Sempre salvar o valor numérico do total, seja da API ou calculado
		formattedCart.numericTotalFinal = apiTotal > 0 ? apiTotal : calculatedTotal;
	}

	console.log('[getFormattedCart] Carrinho formatado final:', formattedCart);
	return formattedCart;
};

export const createCheckoutData = ( order ) => {

	// Set the billing Data to shipping, if applicable.
	const billingData = order.billingDifferentThanShipping ? order.billing : order.shipping;

	const checkoutData = {
		clientMutationId: v4(),
		shipping: {
			firstName: order?.shipping?.firstName,
			lastName: order?.shipping?.lastName,
			address1: order?.shipping?.address1,
			address2: order?.shipping?.address2,
			city: order?.shipping?.city,
			country: order?.shipping?.country,
			state: order?.shipping?.state,
			postcode: order?.shipping?.postcode,
			email: order?.shipping?.email,
			phone: order?.shipping?.phone,
			company: order?.shipping?.company,
		},
		billing: {
			firstName: billingData?.firstName,
			lastName: billingData?.lastName,
			address1: billingData?.address1,
			address2: billingData?.address2,
			city: billingData?.city,
			country: billingData?.country,
			state: billingData?.state,
			postcode: billingData?.postcode,
			email: billingData?.email,
			phone: billingData?.phone,
			company: billingData?.company,
		},
		shipToDifferentAddress: order.billingDifferentThanShipping,
		paymentMethod: order.paymentMethod,
		isPaid: false,
	};

	if (order.createAccount) {
		checkoutData.account = {
			username: order.username,
			password: order.password,
		};
	}

	return checkoutData;
};

/**
 * Get the updated items in the below format required for mutation input.
 *
 * [
 * { "key": "33e75ff09dd601bbe6dd51039152189", "quantity": 1 },
 * { "key": "02e74f10e0327ad868d38f2b4fdd6f0", "quantity": 1 },
 * ]
 *
 * Creates an array in above format with the newQty (updated Qty ).
 *
 */
export const getUpdatedItems = ( products, newQty, cartKey ) => {

	// Create an empty array.
	const updatedItems = [];

	// Loop through the product array.
	products.map( ( cartItem ) => {

		// If you find the cart key of the product user is trying to update, push the key and new qty.
		if ( cartItem.cartKey === cartKey ) {

			updatedItems.push( {
				key: cartItem.cartKey,
				quantity: parseInt( newQty )
			} );

			// Otherwise just push the existing qty without updating.
		} else {
			updatedItems.push( {
				key: cartItem.cartKey,
				quantity: cartItem.qty
			} );
		}
	} );

	// Return the updatedItems array with new Qtys.
	return updatedItems;

};
