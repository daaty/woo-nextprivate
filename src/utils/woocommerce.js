import { WooCommerceRestApi } from "@woocommerce/woocommerce-rest-api";

// Configure WooCommerce API
const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://your-wordpress-site.com",
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
});

export default api;
