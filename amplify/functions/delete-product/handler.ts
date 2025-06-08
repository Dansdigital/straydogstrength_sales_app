import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { generateClient, GraphQLResult } from "aws-amplify/data";
import { type Schema } from "../../data/resource";
import { Amplify } from 'aws-amplify';
import { env } from "$amplify/env/delete-product";


export const handler = async (event: any) => {
    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
    Amplify.configure(resourceConfig, libraryOptions);

    const client = generateClient<Schema>();
    try {
        const { productId } = event.arguments;
        console.log('delete lambda product_id:', productId);
        if (!productId) {
            throw new Error('Product ID is required');
        }

        // get product data ids
        const query = `
            query GetProduct($productId: String!) {
                getProduct(product_id: $productId) {
                    product_features {
                        items {
                            id
                        }
                    }
                    product_specs {
                        items {
                            id
                        }
                    }
                    product_variants {
                        items {
                            variant_id
                        }
                    }
                }
            }`;

        const productData = await client.graphql({
            query: query,
            variables: {
                productId: productId
            }
        }) as GraphQLResult<{ getProduct: { product_variants: { items: any[] }, product_specs: { items: any[] }, product_features: { items: any[] } } }>;

        console.log('productData:', productData);

        // delete variants
        const variantIds = productData.data?.getProduct.product_variants.items;
        console.log('variantIds:', variantIds);
        for (const variantId of variantIds) {
            if (variantId.id) {
                const result = await client.models.ProductVariant.delete({ variant_id: variantId.id })
                console.log('variantId:', result);
            }
        }
        //delete specs
        const specsIds = productData.data?.getProduct.product_specs.items;
        console.log('specsIds:', specsIds);
        for (const specId of specsIds) {
            if (specId.id) {
                const result = await client.models.ProductSpec.delete({ id: specId.id })
                console.log('specId:', result);
            }
        }

        //delete features
        const featuresIds = productData.data?.getProduct.product_features.items;
        console.log('featuresIds:', featuresIds);
        for (const featureId of featuresIds) {
            if (featureId.id) {
                const result = await client.models.ProductFeature.delete({ id: featureId.id })
                console.log('featureId:', result);
            }
        }

        //delete product
        const result = await client.models.Product.delete({ product_id: productId })
        console.log('productId:', result);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Product and all related items deleted successfully',
                productId: productId
            })
        };
    } catch (error) {
        console.error('Error deleting product:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error deleting product',
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
};
