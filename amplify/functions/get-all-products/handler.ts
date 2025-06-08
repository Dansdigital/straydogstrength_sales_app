import { env } from '$amplify/env/get-all-products';

const SHOPIFY_ACCESS_TOKEN = env.SHOPIFY_ACCESS_TOKEN;

export const handler = async () => {
    // console.log('Lambda function triggered');
    try {
        // console.log('Fetching products from Shopify');
        const response = await fetch(
            `https://011075-5.myshopify.com/admin/products.json?limit=250`,
            {
                method: 'GET',
                headers: {
                    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawProducts = await response.json();

        return rawProducts;
    } catch (error) {
        console.error('Error fetching Shopify products:', error);
        throw error;
    }
};
