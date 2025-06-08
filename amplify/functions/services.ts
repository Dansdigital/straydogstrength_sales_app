export interface RawProductInput {
    id: string;
    title: string;
    body_html: string;
    handle: string;
    status: string;
    admin_graphql_api_id: string;
    sku: string;
    variants?: any[];
}

export interface Feature {
    title: string;
    imageSrc: string;
}

export interface MetaObjectResponse {
    data: {
        metaobject: {
            fields: Array<{ key: string; type: string; value: string }>;
        };
    };
}

export interface ProductResponse {
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

export interface PdfFileResponse {
    data: {
        node: {
            url: string;
            id: string;
        };
    };
}

export interface FileResponse {
    data: {
        node: {
            image?: {
                url: string;
            };
            url?: string;
        };
    };
}

export interface ProductData {
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
    features?: Feature[];
    product_id: string;
    error?: string;
    raw_data?: RawProductInput;
    product_specs?: Array<{ key: string; value: string; product_id: string }>;
}

// Common Functions
export async function getPdfMetafield(productId: string, accessToken: string) {
    try {
        const response = await fetch(
            "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": accessToken,
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

export async function getPdfUrl(fileId: string, accessToken: string) {
    try {
        const response = await fetch(
            "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": accessToken,
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

export async function getProductImageUrl(productId: string, accessToken: string) {
    try {
        const response = await fetch(
            "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": accessToken,
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

export async function getMetaObject(specId: string, accessToken: string) {
    try {
        const response = await fetch(
            "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": accessToken,
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

        const data = await response.json() as MetaObjectResponse;
        return data;
    } catch (error) {
        console.error("Test failed:", error);
        throw error;
    }
}

export async function getMediaImageUrl(mediaImageId: string, accessToken: string) {
    try {
        const response = await fetch(
            "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": accessToken,
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