<?php
/**
 * WooCommerce Account Integration Functions
 *
 * Handles the integration between the React site and WooCommerce My Account functionality
 */

// Make sure WooCommerce is active
if (!function_exists('is_woocommerce')) {
    return;
}

/**
 * Register a new rewrite rule for the My Account page
 */
function add_custom_rewrite_rule() {
    add_rewrite_rule('^minha-conta/?$', 'index.php?pagename=minha-conta', 'top');
}
add_action('init', 'add_custom_rewrite_rule', 10, 0);

/**
 * Register a new endpoint for the My Account page
 */
function custom_woocommerce_account_endpoint() {
    add_rewrite_endpoint('minha-conta', EP_ROOT | EP_PAGES);
}
add_action('init', 'custom_woocommerce_account_endpoint');

/**
 * Customize the My Account menu items
 */
function custom_my_account_menu_items($items) {
    // You can customize the menu items here
    return $items;
}
add_filter('woocommerce_account_menu_items', 'custom_my_account_menu_items');

/**
 * Ensure the My Account shortcode is properly loaded
 */
function ensure_my_account_shortcode() {
    if (!shortcode_exists('woocommerce_my_account')) {
        add_shortcode('woocommerce_my_account', 'woocommerce_my_account');
    }
}
add_action('init', 'ensure_my_account_shortcode');
