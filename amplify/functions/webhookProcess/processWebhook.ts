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

interface MetaObjectResponse {
    data: {
        metaobject: {
            fields: Array<{ key: string; type: string; value: string }>;
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

interface Feature {
    name?: string;
    imageSrc?: string;
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

        // Log response data for debugging
        // console.log("Response data:", data);

        // Extract image URL from response
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

        // Check if data exists and has the expected structure
        if (!data?.data?.node?.image?.url) {
            console.error("Invalid response structure:", data);
            throw new Error("Media image URL not found in response");
        }

        // Log the URL for debugging
        // console.log('Retrieved media image URL:', data.data.node.image.url);

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
                let newFeature: Feature = {};
                const feature = await getMetaObject(featureId, SHOPIFY_ACCESS_TOKEN);
                for (const field of feature.data.metaobject.fields) {
                    if (field.key === "feature_title") {
                        newFeature.name = field.value;
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

export async function getProductData(webhookData: any, SHOPIFY_ACCESS_TOKEN: string) {
    try {
        if (!SHOPIFY_ACCESS_TOKEN) {
            throw new Error('SHOPIFY_ACCESS_TOKEN is not defined in environment variables');
        }

        let productData = {
            id: webhookData.id,
            title: webhookData.title,
            handle: webhookData.handle,
            description: webhookData.body_html,
            main_image: await getProductImageUrl(webhookData.admin_graphql_api_id, SHOPIFY_ACCESS_TOKEN),
            variants: webhookData.variants,
            pdf_url: webhookData.pdf_link?.value,
            specs: await getSpecs(webhookData.id, SHOPIFY_ACCESS_TOKEN),
            features: await getFeatures(webhookData.id, SHOPIFY_ACCESS_TOKEN),
            status: webhookData.status,
            // created_at: webhookData.created_at,
            // updated_at: webhookData.updated_at,
        };

        // productData.specs = await getSpecs(productData.id);
        // productData.features = await getFeatures(productData.id);
        // const test = await getPdfMetafield(productData.id);
        // console.log(test);
        // productData.pdf_link = await getPdfMetafield(productData.id);
        // console.log(productData);

        return productData;
    } catch (error) {
        console.error("Error editing data:", error);
        throw error;
    }
}