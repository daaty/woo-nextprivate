import React, { useState, useContext } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import Link from "next/link";
import { v4 } from 'uuid';
import cx from 'classnames';

import { AppContext } from "../context/AppContext";
import { getFormattedCart } from "../../functions";
import { GET_CART } from "../../queries/get-cart";
import { ADD_TO_CART } from "../../mutations/add-to-cart";

const AddToCart = (props) => {
    const { product } = props;
    const [quantity, setQuantity] = useState(1);
    const [cart, setCart] = useContext(AppContext);
    const [showViewCart, setShowViewCart] = useState(false);
    const [requestError, setRequestError] = useState(null);
    const [requestInProgress, setRequestInProgress] = useState(false);

    // Get Cart Data.
    const { data, refetch } = useQuery(GET_CART, {
        notifyOnNetworkStatusChange: true,
        onCompleted: () => {
            // Update cart in the localStorage.
            const updatedCart = getFormattedCart(data);
            localStorage.setItem('woo-next-cart', JSON.stringify(updatedCart));

            // Update cart data in React Context.
            setCart(updatedCart);
        }
    });

    // Add to Cart Mutation.
    const [addToCart, { loading: addToCartLoading }] = useMutation(ADD_TO_CART, {
        variables: {
            input: {
                clientMutationId: 'add_to_cart',
                productId: product?.databaseId || '',
                quantity: quantity,
            }
        },
        onCompleted: () => {
            // Success callback
            refetch();
            setShowViewCart(true);
            setRequestInProgress(false);
        },
        onError: (error) => {
            // Error callback
            console.error('Error adding to cart:', error);
            setRequestError(error?.graphQLErrors?.[0]?.message ?? '');
            setRequestInProgress(false);
        }
    });

    const handleAddToCartClick = async () => {
        setRequestError(null);
        setRequestInProgress(true);
        await addToCart();
    };

    return (
        <div>
            {/*	Check if its an external product then put its external buy link */}
            {"ExternalProduct" === product.__typename ? (
                <a href={product?.externalUrl ?? '/'} target="_blank"
                   className="px-3 py-1 rounded-sm mr-3 text-sm border-solid border border-current inline-block hover:bg-purple-600 hover:text-white hover:border-purple-600">
                    Buy now
                </a>
            ) :
                <button
                    disabled={addToCartLoading || requestInProgress}
                    onClick={handleAddToCartClick}
                    className={cx(
                        'px-3 py-1 rounded-sm mr-3 text-sm border-solid border border-current',
                        {'hover:bg-purple-600 hover:text-white hover:border-purple-600': !addToCartLoading && !requestInProgress},
                        {'opacity-50 cursor-not-allowed': addToCartLoading || requestInProgress}
                    )}
                >
                    {addToCartLoading || requestInProgress ? 'Adding to cart...' : 'Add to cart'}
                </button>
            }
            {showViewCart ? (
                <Link href="/cart">
                    <button
                        className="px-3 py-1 rounded-sm text-sm border-solid border border-current inline-block hover:bg-purple-600 hover:text-white hover:border-purple-600">View
                        Cart
                    </button>
                </Link>
            ) : ''}
        </div>
    );
};

export default AddToCart;
