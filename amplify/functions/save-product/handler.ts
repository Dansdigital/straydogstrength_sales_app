import { env } from '$amplify/env/save-product';
// import { getProductData } from '../api-function/processWebhook';
import type { Schema } from "../../data/resource"

const SHOPIFY_ACCESS_TOKEN = env.SHOPIFY_ACCESS_TOKEN;

interface RawProductInput {
    id: string;
    title: string;
    body_html: string;
    handle: string;
    status: string;
    admin_graphql_api_id: string;
    sku: string;
    variants?: any[]; // Optional since it's commented out in the test data
    // pdf_link?: { value: string }; // Optional since it's commented out in the test data
}

interface Feature {
    title: string;
    imageSrc: string;
}

interface MetaObjectResponse {
    data: {
        metaobject: {
            fields: Array<{ key: string; type: string; value: string }>;
        };
    };
}

interface ProductResponse {
    data: {
        product: {
            metafield: {
                id: string;
                value: string;
                type: string;
            };
        };
    };
}

interface PdfFileResponse {
    data: {
        node: {
            url: string;
            id: string;
        };
    };
}

interface FileResponse {
    data: {
        node: {
            image?: {
                url: string;
            };
            url?: string;
        };
    };
}

interface feature {
    title: string;
    imageSrc: string;
}

interface ProductData {
    id: string;
    title: string;
    handle: string;
    description: string;
    status: string;
    main_image_url: string;
    variants: any[];
    sku: string;
    pdf: {
        id: string;
        url: string;
    };
    features?: feature[];
    product_id: string;
    error?: string;
    raw_data?: RawProductInput;
    product_specs?: Array<{ key: string; value: string; product_id: string }>;
}

async function getProductVariant(variantId: string, SHOPIFY_ACCESS_TOKEN: string) {
    try {
        const response = await fetch(
            'https://011075-5.myshopify.com/admin/api/2024-07/graphql.json',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
                },
                body: JSON.stringify({
                    query: `query ProductVariantMetafield($namespace: String!, $key: String!, $ownerId: ID!) {
                        productVariant(id: $ownerId) {
                            id
                            title
                            sku
                            pdfLink: metafield(namespace: $namespace, key: $key) {
                                value
                            }
                        }
                    }`,
                    variables: {
                        namespace: "custom",
                        key: "pdf_link",
                        ownerId: `gid://shopify/ProductVariant/${variantId}`
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('product variant data:', data);
        return {
            id: data.data.productVariant.id || "",
            title: data.data.productVariant.title || "",
            sku: data.data.productVariant.sku || "",
            pdfLink: (data.data.productVariant.pdfLink) ? await getPdfUrl(data.data.productVariant.pdfLink.value, SHOPIFY_ACCESS_TOKEN) : null
        }
    } catch (error) {
        console.error('Error fetching Shopify variant:', error);
        throw error;
    }
};

async function getProductImageUrl(productId: string, SHOPIFY_ACCESS_TOKEN: string) {
    try {
        const response = await fetch(
            "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
                },
                body: JSON.stringify({
                    query: `
                        query GetProductImageUrl($productId: ID!) { 
                            product(id: $productId) { 
                                images(first: 1) { 
                                    edges { 
                                        node { 
                                            url 
                                        } 
                                    } 
                                } 
                            } 
                        }
                    `,
                    variables: {
                        productId: productId,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        const imageUrl = data?.data?.product?.images?.edges?.[0]?.node?.url;

        if (!imageUrl) {
            console.error("Invalid response structure:", data);
            throw new Error("Product image URL not found in response");
        }

        return imageUrl;
    } catch (error) {
        console.error("Error fetching product image URL:", error);
        throw error;
    }
}

async function getMetaObject(specId: string, SHOPIFY_ACCESS_TOKEN: string) {
    try {
        const response = await fetch(
            "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
                },
                body: JSON.stringify({
                    query: `
                query {
                  metaobject(id: "${specId}") {
                    displayName,
                    fields {
                      key
                      type
                      value
                    }
                  }
                }
              `,
                    variables: {},
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Then type the response
        const data = await response.json() as MetaObjectResponse;
        return data;
    } catch (error) {
        console.error("Test failed:", error);
        throw error;
    }
}

async function getSpecs(productId: string, SHOPIFY_ACCESS_TOKEN: string) {
    try {
        const response = await fetch(
            "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
                },
                body: JSON.stringify({
                    query: `
            query {
              product(id: "gid://shopify/Product/${productId}") {
                metafield(namespace: "custom", key: "specs") {
                  id
                  value
                  type
                }
              }
            }
          `,
                    variables: {},
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as ProductResponse;
        // console.log("data: ", data);
        // Check if there's a value and return just the value if it exists
        if (data?.data?.product?.metafield?.value) {
            // return data.data.product.metafield.value;
            const rawSpec = await getMetaObject(data.data.product.metafield.value, SHOPIFY_ACCESS_TOKEN);
            return rawSpec.data.metaobject.fields;
        }

        return null; // Return null if no value exists
    } catch (error) {
        console.error("Error fetching product metafields:", error);
        throw error;
    }
}

async function getMediaImageUrl(mediaImageId: string, SHOPIFY_ACCESS_TOKEN: string) {
    try {
        const response = await fetch(
            "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
                },
                body: JSON.stringify({
                    query: `
            query {
              node(id: "${mediaImageId}") {
                id
                ... on MediaImage {
                  image {
                    url
                  }
                }
              }
            }
          `,
                    variables: {},
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as FileResponse;

        if (!data?.data?.node?.image?.url) {
            console.error("Invalid response structure:", data);
            throw new Error("Media image URL not found in response");
        }

        return data.data.node.image.url;
    } catch (error) {
        console.error("Error fetching media image URL:", error);
        throw error;
    }
}

async function getFeatures(productId: string, SHOPIFY_ACCESS_TOKEN: string) {
    try {
        const response = await fetch(
            "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
                },
                body: JSON.stringify({
                    query: `
            query {
              product(id: "gid://shopify/Product/${productId}") {
                metafield(namespace: "custom", key: "product_features") {
                  id
                  value
                  type
                }
              }
            }
          `,
                    variables: {},
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as ProductResponse;
        // Parse the string value into an array if it exists
        if (data?.data?.product?.metafield?.value) {
            const featuresIds = JSON.parse(data.data.product.metafield.value);
            let features = [];
            for (const featureId of featuresIds.slice(0, 3)) {
                let newFeature: Feature = { title: "", imageSrc: "" };
                const feature = await getMetaObject(featureId, SHOPIFY_ACCESS_TOKEN);
                for (const field of feature.data.metaobject.fields) {
                    if (field.key === "feature_title") {
                        newFeature.title = field.value;
                    }
                    if (field.key === "feature_image") {
                        newFeature.imageSrc = await getMediaImageUrl(field.value, SHOPIFY_ACCESS_TOKEN);
                    }
                }
                features.push(newFeature);
            }
            return features;
        }

        return []; // Return empty array if no value exists
    } catch (error) {
        console.error("Error fetching product metafields:", error);
        throw error;
    }
}

async function getPdfUrl(fileId: string, SHOPIFY_ACCESS_TOKEN: string) {
    try {
        const response = await fetch(
            "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
                },
                body: JSON.stringify({
                    query: `
                        query GetFileUrl($fileId: ID!) {
                            node(id: $fileId) {
                                ... on GenericFile {
                                    id
                                    url
                                }
                            }
                        }
                    `,
                    variables: {
                        fileId: fileId
                    }
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as PdfFileResponse;
        return data?.data?.node?.url || null;
    } catch (error) {
        console.error("Error fetching PDF metafield:", error);
        throw error;
    }
}

async function getPdfMetafield(productId: string, SHOPIFY_ACCESS_TOKEN: string) {
    try {
        const response = await fetch(
            "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
                },
                body: JSON.stringify({
                    query: `
            query getProductPdfLink($productId: ID!) {
              product(id: $productId) {
                metafield(namespace: "custom", key: "pdf_link") {
                  id
                  value
                  type
                }
              }
            }
          `,
                    variables: {
                        productId: `gid://shopify/Product/${productId}`,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as ProductResponse;
        console.log(`product data get metafield: ${data.data.product.metafield}`);
        if (data?.data?.product?.metafield?.value) {
            return {
                id: data?.data?.product?.metafield?.id,
                value: data?.data?.product?.metafield?.value,
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching PDF metafield:", error);
        throw error;
    }
}

async function getProductData(RawProduct: RawProductInput, SHOPIFY_ACCESS_TOKEN: string) {
    try {
        if (!SHOPIFY_ACCESS_TOKEN) {
            throw new Error('SHOPIFY_ACCESS_TOKEN is not defined in environment variables');
        }

        let productData: ProductData = {
            id: RawProduct.id,
            product_id: RawProduct.id,
            title: RawProduct.title,
            sku: RawProduct?.variants?.[0]?.sku || "",
            handle: RawProduct.handle,
            description: RawProduct.body_html,
            status: RawProduct.status,
            main_image_url: "error getting main image",
            variants: [],
            pdf: {
                id: "",
                url: "",
            },
            raw_data: RawProduct
        };

        try {
            if (RawProduct.variants) {
                for (const variant of RawProduct.variants) {
                    productData.variants.push(await getProductVariant(variant.id, SHOPIFY_ACCESS_TOKEN));
                }
            }
        } catch (error) {
            console.error('Error fetching product variant:', error);
            productData.error = `Error fetching product variant: ${error instanceof Error ? error.message : String(error)}`;
        }

        try {
            if (RawProduct.admin_graphql_api_id) {
                productData.main_image_url = await getProductImageUrl(RawProduct.admin_graphql_api_id, SHOPIFY_ACCESS_TOKEN);
            }
            // console.log('main_image:', productData.main_image_url);
        } catch (error) {
            console.error('Error fetching main image:', error);
            productData.error = `Error fetching main image: ${error instanceof Error ? error.message : String(error)}`;
        }

        try {
            if (RawProduct.id) {
                const specs = await getSpecs(RawProduct.id, SHOPIFY_ACCESS_TOKEN);
                if (specs) {
                    // Create array of product specs
                    productData.product_specs = specs.map(spec => ({
                        key: spec.key,
                        value: spec.value,
                        product_id: RawProduct.id
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching specs:', error);
            productData.error = (productData.error || '') + ` Error fetching specs: ${error instanceof Error ? error.message : String(error)}`;
        }

        try {
            if (RawProduct.admin_graphql_api_id) {
                const features = await getFeatures(RawProduct.id, SHOPIFY_ACCESS_TOKEN);
                if (features) {
                    productData.features = features;
                }
                // console.log('features:', productData.features);
            }
        } catch (error) {
            console.error('Error fetching features:', error);
            productData.error = (productData.error || '') + ` Error fetching features: ${error instanceof Error ? error.message : String(error)}`;
        }

        try {
            if (RawProduct.id) {
                let pdf = {
                    id: "",
                    url: "",
                }
                const pdf_url = await getPdfMetafield(RawProduct.id, SHOPIFY_ACCESS_TOKEN);
                if (pdf_url) {
                    pdf.id = pdf_url.id;
                    pdf.url = await getPdfUrl(pdf_url.value, SHOPIFY_ACCESS_TOKEN) || "Not found";
                }
                productData.pdf = pdf;
                console.log('pdf:', pdf);
            }
        } catch (error) {
            console.error('Error fetching pdf_url:', error);
            productData.error = (productData.error || '') + ` Error fetching pdf_url: ${error instanceof Error ? error.message : String(error)}`;
        }

        return productData;
    } catch (error) {
        console.error("Error editing data:", error);
        throw error;
    }
}

export const handler = async (event: { arguments: { RawProduct: RawProductInput } }) => {
    const RawProduct = event.arguments.RawProduct;
    try {
        if (!event.arguments) {
            throw new Error('No arguments provided');
        }

        const product = await getProductData(RawProduct, SHOPIFY_ACCESS_TOKEN);
        return product
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process product';
        console.error('Error processing raw product:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: errorMessage })
        };
    }
};
